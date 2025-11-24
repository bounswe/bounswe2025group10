"""
Django management command to generate realistic mock/demo data for the Zero Waste application.

USAGE EXAMPLES:
---------------

1. Generate full dataset with default values (100 users, 100 posts, etc.):
   python manage.py create_mock_data

2. Generate a small test dataset:
   python manage.py create_mock_data --num-users=10 --num-posts=20 --num-tips=10

3. Generate reproducible data using a seed:
   python manage.py create_mock_data --seed=42

4. Preview data generation without saving to database (dry-run):
   python manage.py create_mock_data --dry-run --seed=42

5. Generate only specific data types using modes:
   python manage.py create_mock_data --mode=users --num-users=50
   python manage.py create_mock_data --mode=posts --num-posts=30
   python manage.py create_mock_data --mode=follows --num-users=30
   python manage.py create_mock_data --mode=wastes --num-max-wastes-per-user=20
   python manage.py create_mock_data --mode=tips --num-tips=15
   python manage.py create_mock_data --mode=challenges --num-challenges=10

6. Combine options for custom scenarios:
   python manage.py create_mock_data --mode=full --num-users=50 --num-posts=80 --seed=123 --dry-run

AVAILABLE MODES:
----------------
- full: Generate all data types (default)
- users: Generate only users
- posts: Generate users + posts + comments
- follows: Generate users + posts + follow relationships (activity-based)
- wastes: Generate users + waste entries
- tips: Generate only tips
- challenges: Generate users + achievements + challenges

AVAILABLE OPTIONS:
------------------
--num-users=N                    Number of users to generate (default: 100)
--num-posts=N                    Number of posts to generate (default: 100)
--num-max-comments-per-post=N    Max comments per post (default: 7)
--num-tips=N                     Number of tips to generate (default: 30)
--num-max-wastes-per-user=N      Max waste entries per user (default: 30)
--num-achievements=N             Number of achievements to generate (default: 25)
--num-challenges=N               Number of challenges to generate (default: 40)
--max-challenge-target-amount=N  Max challenge target amount (default: 50)
--reported-content-percent=F     Percentage of content to report, 0.0-1.0 (default: 0.05)
--seed=N                         Set RNG seed for reproducible output
--dry-run                        Run and rollback (no DB changes, useful for testing)
--mode=MODE                      Generation mode (see above)

NOTES:
------
- The script creates a test user (username: test_user, password: test123, email: test@gmail.com)
- Follow relationships are activity-based: active users get more followers
- All curated content (tips, captions, images) is recycling/sustainability themed
- Minimum 20 items guaranteed for tips, achievements, challenges, and captions
- Use --dry-run to validate data without persisting changes
- Use --seed for reproducible data across runs (useful for testing/demos)
"""

from django.core.management.base import BaseCommand
from faker import Faker
import random
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.hashers import make_password
from django.contrib.contenttypes.models import ContentType
from api.models import (
    Users, Achievements, UserAchievements, Posts, Comments, Tips, Waste,
    UserWastes, Report, TipLikes, PostLikes, Follow, SavedPosts, SuspiciousWaste
)
from challenges.models import Challenge, UserChallenge
from api.utils.translation import translate_text

# English locale
try:
    fake = Faker("en_US")
except Exception:
    fake = Faker()

# ----------------------- Domain knobs (edit freely) --------------------------

# Points/CO2 (kg) saved per *item* recycled (toy values; tune to your model)
POINTS_PER_TYPE = {
    "plastic": 5,
    "paper":   3,
    "glass":   2,
    "metal":   4,
}
CO2_PER_TYPE = {
    "plastic": 0.10,
    "paper":   0.08,
    "glass":   0.05,
    "metal":   0.09,
}

# Relative frequency of waste items users tend to log
WASTE_WEIGHTS = {
    "plastic": 0.40,
    "paper":   0.30,
    "glass":   0.15,
    "metal":   0.15,
}

def themed_avatar_url(user_id: int | None = None) -> str:
    """Generate a unique avatar URL using a placeholder service"""
    # Use UI Avatars with initials to avoid gender mismatch
    # Generate neutral, colorful avatars based on user_id
    seed = user_id or random.randint(1, 1000)
    colors = ['4CAF50', '2196F3', 'FF9800', '9C27B0', 'F44336', '00BCD4', 'FFEB3B', '8BC34A', 'E91E63', '3F51B5']
    bg_color = colors[seed % len(colors)]
    # Use recycling emoji or letter as placeholder
    emoji = '♻️'
    return f"https://ui-avatars.com/api/?name={emoji}&size=256&background={bg_color}&color=fff&bold=true"

def themed_post_image_url(waste_type: str | None = None) -> str:
    """Generate recycling/waste-themed post images"""
    # Curated list of actual recycling/waste reduction images from Unsplash
    # These are real photos that will properly display
    recycling_images = {
        "plastic": [
            "https://images.unsplash.com/photo-1528323273322-d81458248d40?w=900&h=600&fit=crop",  # plastic bottles
            "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=900&h=600&fit=crop",  # recycling plastic
            "https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=900&h=600&fit=crop",  # plastic waste
        ],
        "paper": [
            "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=900&h=600&fit=crop",  # cardboard boxes
            "https://images.unsplash.com/photo-1572981779307-e4f7a7c3f700?w=900&h=600&fit=crop",  # paper recycling
            "https://images.unsplash.com/photo-1604519972441-11e6ab863a0c?w=900&h=600&fit=crop",  # stacked paper
        ],
        "glass": [
            "https://images.unsplash.com/photo-1572635196243-4dd75fbdbd7f?w=900&h=600&fit=crop",  # glass bottles
            "https://images.unsplash.com/photo-1610876762825-bc2c5129b484?w=900&h=600&fit=crop",  # glass recycling
            "https://images.unsplash.com/photo-1582802728194-c21e9d6e4569?w=900&h=600&fit=crop",  # glass jars
        ],
        "metal": [
            "https://images.unsplash.com/photo-1581888227599-779811939961?w=900&h=600&fit=crop",  # aluminum cans
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=900&h=600&fit=crop",  # metal recycling
            "https://images.unsplash.com/photo-1569204803726-61b4dc8a8cfc?w=900&h=600&fit=crop",  # crushed cans
        ],
        "electronic": [
            "https://images.unsplash.com/photo-1567789884554-0b844b597180?w=900&h=600&fit=crop",  # e-waste
            "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=900&h=600&fit=crop",  # old electronics
            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&h=600&fit=crop",  # circuit boards
        ],
        "oil&fat": [
            "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=900&h=600&fit=crop",  # cooking oil
            "https://images.unsplash.com/photo-1556910110-a5a63dfd393c?w=900&h=600&fit=crop",  # oil containers
            "https://images.unsplash.com/photo-1536304447766-da5a0e6d494f?w=900&h=600&fit=crop",  # kitchen waste
        ],
        "organic": [
            "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&h=600&fit=crop",  # composting
            "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=900&h=600&fit=crop",  # compost bin
            "https://images.unsplash.com/photo-1585459871909-d3ce4c864f3e?w=900&h=600&fit=crop",  # organic waste
        ],
    }
    
    # General recycling images as fallback
    general_recycling = [
        "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=900&h=600&fit=crop",  # recycling bins
        "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=900&h=600&fit=crop",  # recycling symbol
        "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=900&h=600&fit=crop",  # waste sorting
        "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=900&h=600&fit=crop",  # recycling center
    ]
    
    # Get images for specific waste type or use general
    images = recycling_images.get(waste_type, general_recycling)
    
    # Return a random image from the appropriate category
    return random.choice(images)


# At least 20 curated recycling tips (title, body)
# ---------------------------------------------------------------------------
# 🟢 RECYCLING TIPS (expanded ~50)
# ---------------------------------------------------------------------------

RECYCLING_TIPS = [
    ("Squash plastic bottles", "Remove caps and squash bottles to save bin space and improve collection efficiency."),
    ("Keep paper clean", "Greasy or wet paper cannot be recycled. Keep it dry and clean for higher recovery rates."),
    ("Rinse glass quickly", "A quick rinse removes food residue; labels are fine—don’t overthink them."),
    ("Crush cans", "Flatten aluminum cans to increase bin capacity and reduce transport emissions."),
    ("Check plastic codes", "PET and HDPE are widely accepted; multi-layer plastics often aren’t."),
    ("Sort at the source", "Set up separate bins at home: plastic/metal, paper/cardboard, and glass."),
    ("Reuse before recycle", "Glass jars make great storage. Prioritize reuse, then recycle."),
    ("E-waste properly", "Batteries/electronics need special drop-off points; never put them in regular bins."),
    ("Shop low-waste", "Carry a tote, a reusable bottle, and a coffee tumbler to avoid single-use."),
    ("Know collection days", "Track local pick-up days to avoid overflow and contamination."),
    ("Flatten cardboard", "Break down boxes to save space and keep fibers clean."),
    ("Avoid black plastic", "Many facilities can’t detect black plastic—choose clear or colored alternatives."),
    ("Compost organics", "Keep food scraps out of recycling streams; compost where possible."),
    ("Return deposit bottles", "Use deposit return schemes where available for higher recycling rates."),
    ("Keep caps separate", "Check local rules; some accept bottles with caps on, after squashing."),
    ("No bagged recycling", "Loose items are best; bagged recyclables can be rejected by facilities."),
    ("Leave staples", "Small staples are okay on paper; remove big clips if easy."),
    ("Don’t smash glass", "Intact glass is safer and easier to sort than shards."),
    ("Learn your MRF rules", "Facilities differ; a quick lookup prevents contamination."),
    ("Donate before tossing", "Working items and containers might find a second life."),
    ("Refill stations", "Look for bulk/refill shops for detergents and pantry goods."),
    ("Bring back hangers", "Many stores accept hangers; reduce plastic hanger waste."),
    ("Dry recyclables", "Moisture damages paper fibers—dry before binning."),
    ("Combine errands", "Plan drop-offs with errands to save fuel."),
    ("Eco labels", "Choose certified recyclable or compostable packaging."),
    ("Glass color separation", "Separate clear and colored glass when required."),
    ("Store recyclables neatly", "Stack neatly to prevent contamination from spills."),
    ("Avoid mixed materials", "Items with foil + plastic layers are rarely recyclable."),
    ("Support local recyclers", "Use nearby drop-offs to reduce carbon impact."),
    ("Repair instead of replace", "Fix appliances before discarding."),
    ("Teach your kids", "Explain why recycling matters early—it builds lifelong habits."),
    ("Community bins", "Share bins with neighbors if you lack space."),
    ("Audit your trash", "Review what you throw away; identify avoidable waste."),
    ("Choose refill packs", "Buy in bulk to reduce single-use bottles."),
    ("Reuse mailers", "Padded envelopes and boxes can often be reused."),
    ("Bring your mug", "Coffee shops often give discounts for reusables."),
    ("Label your bins", "Clear labels help others sort correctly."),
    ("Host a recycling drive", "Collect from your building or office together."),
    ("Avoid glitter", "Most glitter is microplastic—choose biodegradable."),
    ("Skip receipts", "Opt for digital receipts when possible."),
    ("Buy second-hand", "Thrift stores extend the life of goods."),
    ("Reuse packaging", "Boxes and jars can serve storage purposes."),
    ("Recycle scrap metal", "Don’t toss it—metal is infinitely recyclable."),
    ("Carpool or bike", "Reduces indirect waste from car maintenance."),
    ("Say no to straws", "Unless needed for accessibility, skip disposables."),
    ("Compost coffee grounds", "They enrich soil and reduce methane emissions."),
    ("Separate lids", "Plastic lids often have different melting points."),
    ("Upcycle creatively", "Turn waste into art, planters, or organizers."),
    ("Follow the 5Rs", "Refuse, Reduce, Reuse, Recycle, Rot."),
    ("Celebrate small wins", "Consistency beats perfection in sustainability."),
    ("Recycling reduces landfill waste", "Recycling reduces the amount of waste sent to landfills."),
    ("Conserve natural resources", "It helps conserve natural resources like water, minerals, and timber."),
    ("Save energy and costs", "Recycling saves energy compared to producing new materials, lowering overall production costs."),
    ("Lower greenhouse emissions", "It lowers greenhouse gas emissions and supports a healthier environment."),
    ("Financial rewards available", "Many recycling programs offer direct financial rewards, points, or cashback."),
    ("Sell recyclable materials", "Selling recyclable materials like metal or paper can generate extra income."),
    ("Save on garbage fees", "Recycling reduces household waste volume, helping you save on garbage collection fees."),
    ("Business tax incentives", "Businesses that recycle often qualify for tax incentives or cost reductions."),
    ("Reduce material expenses", "Using recycled materials in manufacturing can significantly reduce material expenses."),
    ("Deposit-return schemes", "Consumers can benefit from deposit-return schemes for bottles and cans."),
    ("Create job opportunities", "Recycling creates job opportunities, strengthening the economy."),
    ("Keep communities clean", "It helps keep communities cleaner and more livable."),
    ("Reduce pollution", "Recycling reduces pollution caused by extracting and processing raw materials."),
    ("Support circular economy", "Contributing to a circular economy helps lower market prices by reducing dependence on raw resources."),
    ("Personal achievement", "Being environmentally responsible can give a sense of personal achievement."),
    ("Track your progress", "Tracking your recycling progress can motivate consistent eco-friendly habits."),
]

# ---------------------------------------------------------------------------
# 🟡 ACHIEVEMENTS (expanded ~50)
# ---------------------------------------------------------------------------

ACHIEVEMENT_TEMPLATES = [
    ("Paper Saver I", "Recycled 10 paper/cardboard items in total."),
    ("Plastic Hunter I", "Recycled 10 plastic items in total."),
    ("Glass Guardian I", "Recycled 10 glass items in total."),
    ("Metal Master I", "Recycled 10 metal items in total."),
    ("Seven-Day Streak", "Logged recycling for 7 consecutive days."),
    ("Commenter", "Left comments on at least 5 community posts."),
    ("Tip Appreciator", "Liked at least 3 tips."),
    ("Challenger", "Joined and completed at least 1 challenge."),
    ("CO₂ Cutter I", "Saved 2 kg of CO₂ emissions."),
    ("Recycling Ambassador", "Stayed active and supportive in the community."),
    ("Paper Saver II", "Recycled 50 paper items."),
    ("Plastic Hunter II", "Recycled 50 plastic items."),
    ("Glass Guardian II", "Recycled 50 glass items."),
    ("Metal Master II", "Recycled 50 metal items."),
    ("CO₂ Cutter II", "Saved 5 kg of CO₂ emissions."),
    ("Weekly Warrior", "Logged waste entries every day in a week."),
    ("Neighborhood Helper", "Encouraged others to recycle with you."),
    ("Zero-Waste Starter", "Set up separate bins at home."),
    ("Clean Stream", "Kept your recycling uncontaminated for a month."),
    ("Goal Getter", "Reached a personal recycling goal."),
    ("Challenge Finisher", "Finished 3 challenges."),
    ("Community Favorite", "Received lots of likes on your helpful posts."),
    ("Compost Captain", "Composted 5 batches successfully."),
    ("Donation Hero", "Donated 10 reusable items."),
    ("Refill Regular", "Used refill stations 10 times."),
    ("Plastic-Free Month", "Logged zero plastic waste for 30 days."),
    ("Green Thumb", "Started composting or gardening at home."),
    ("Event Organizer", "Hosted a local recycling meetup or cleanup."),
    ("E-Waste Eliminator", "Disposed of electronics properly 5 times."),
    ("Streak Keeper", "Maintained 30 days of recycling activity."),
    ("Carbon Neutral", "Balanced emissions via waste reduction."),
    ("Data Contributor", "Uploaded 100 waste logs to the system."),
    ("Challenge Master", "Completed 5 unique challenges."),
    ("Friend Influencer", "Brought a new user to the platform."),
    ("Sorting Pro", "Recycled 500 total items."),
    ("Eco Mentor", "Gave 5 verified recycling tips."),
    ("Waste Watcher", "Reduced daily waste output by 50%."),
    ("City Hero", "Represented your city in recycling leaderboard."),
    ("Eco Streak 100", "Maintained 100 days of continuous activity."),
    ("Bin Organizer", "Customized your home sorting setup."),
    ("Team Recycler", "Collaborated in a group challenge."),
    ("Plastic-Free Champion", "Avoided single-use plastic for 60 days."),
    ("Sustainability Advocate", "Shared 10 informative posts."),
    ("Upcycle Artist", "Created 3 upcycled items."),
    ("Waste-Free Weekend", "Produced zero landfill waste for 2 days."),
    ("Glass Master III", "Recycled 200 glass items."),
    ("Paper Champion III", "Recycled 200 paper items."),
    ("CO₂ Saver III", "Saved 10 kg of CO₂."),
    ("Ultimate Recycler", "Unlocked every base achievement."),
]

# ---------------------------------------------------------------------------
# 🔵 CHALLENGES (expanded ~50)
# ---------------------------------------------------------------------------

CHALLENGE_TEMPLATES = [
    # (title, description, target_grams, bias_type)
    ("Recycling Sprint 1kg",    "Recycle at least 1,000 grams.", 1000, "plastic"),
    ("Diversion Drive 1.5kg",   "Recycle at least 1,500 grams.", 1500, "paper"),
    ("Recovery Goal 2kg",       "Recycle at least 2,000 grams.", 2000, "glass"),
    ("Material Marathon 1.2kg", "Recycle at least 1,200 grams.", 1200, "metal"),
    ("Impact Target 1kg",       "Recycle at least 1,000 grams.", 1000, "electronic"),
    ("Clean Stream Goal 1kg",   "Recycle at least 1,000 grams.", 1000, "oil&fat"),
    ("Circularity Push 3kg",    "Recycle at least 3,000 grams.", 3000, "organic"),

    ("Recycling Sprint 2kg",    "Recycle at least 2,000 grams.", 2000, "plastic"),
    ("Diversion Drive 2.5kg",   "Recycle at least 2,500 grams.", 2500, "paper"),
    ("Recovery Goal 1.5kg",     "Recycle at least 1,500 grams.", 1500, "glass"),
    ("Material Marathon 2kg",   "Recycle at least 2,000 grams.", 2000, "metal"),
    ("Impact Target 1.5kg",     "Recycle at least 1,500 grams.", 1500, "electronic"),
    ("Clean Stream Goal 1.2kg", "Recycle at least 1,200 grams.", 1200, "oil&fat"),
    ("Circularity Push 2.5kg",  "Recycle at least 2,500 grams.", 2500, "organic"),
]


# ---------------------------------------------------------------------------
# 🔴 COMMENT BANK (expanded ~50)
# ---------------------------------------------------------------------------

COMMENT_BANK = [
    "Great work—keep sorting! 💚",
    "Rinsing glass really helps MRFs. Nice!",
    "Tracking pickup days changed my routine too.",
    "Crushing cans saves so much space—+1.",
    "Bottle caps: check your local rules!",
    "Motivating to see this—well done.",
    "Labels? Usually fine—residue is the real issue.",
    "Love the separate bins setup—so practical.",
    "Deposit return is underrated; good call.",
    "Cardboard flattened like a pro.",
    "Nice reminder about e-waste drop-offs.",
    "Reusing jars is my favorite quick win.",
    "Clean stream for the win—no contamination!",
    "Bulk stores do help reduce plastic.",
    "Composting keeps recycling streams clean.",
    "Avoiding black plastic is a smart move.",
    "Donation before recycling—love it.",
    "Staples can stay; big clips off if easy.",
    "Keeping glass intact helps sorting—thanks!",
    "Neighborhood initiatives are powerful.",
    "Small habits add up fast.",
    "This is inspiring—thanks for sharing.",
    "Your tips are super actionable.",
    "Consistency beats perfection—nice streak!",
    "Love how detailed your sorting is!",
    "Brilliant idea for labeling bins!",
    "That refill station looks great—thanks for sharing.",
    "Really cool to see office recycling in action.",
    "Helping neighbors recycle is inspiring.",
    "A clean stream means cleaner planet—awesome.",
    "Good point about black plastic detection issues.",
    "I need to try composting too!",
    "Sustainable choices every day—respect.",
    "That donation tip just saved me time.",
    "The setup looks so aesthetic and functional!",
    "Rinsing jars before bed—efficient habit!",
    "Your CO₂ savings are impressive!",
    "More posts like this, please!",
    "Nice streak, keep it up!",
    "I love the consistency—true eco hero!",
    "Really liked how you explained sorting.",
    "I’ll start flattening boxes like that.",
    "This inspired me to create a community bin.",
    "You’re raising the bar for all of us!",
    "So many helpful ideas—thank you!",
    "Reminds me to clean my bins today!",
    "The reusable bottle commitment is great!",
    "Love seeing sustainability become a habit.",
    "That’s how change starts—awesome job.",
]

# ---------------------------------------------------------------------------
# 🟣 SEED CAPTIONS (expanded ~50)
# ---------------------------------------------------------------------------

SEED_CAPTIONS = [
    "Separated 6 plastic bottles and 3 cardboard boxes today. #plastic #paper #recycle",
    "Glass collection day in my block—4 jars and 2 bottles dropped off. #glass",
    "Flattened 10 aluminum cans—bin fits so much more now. #metal",
    "Switched to a tote for groceries—no more plastic bags.",
    "Rinsed jars quickly before tossing—no sticky mess, cleaner stream.",
    "Set up a small sorting corner in the kitchen; so much easier now.",
    "Labeled bins for roommates: paper, plastic/metal, glass—zero confusion.",
    "Marked the municipal pickup calendar—no more overflow.",
    "Tried a refill station for detergent—cut a bottle this week.",
    "Returned deposit bottles and grabbed a coffee with the refund.",
    "Kept caps on bottles after squashing—per local guidance.",
    "Flattened a mountain of parcel boxes after moving.",
    "Donated containers before recycling—second life > recycle.",
    "Avoided black plastic trays; chose clear packaging instead.",
    "Batch-rinsed glass bottles; took 3 minutes total.",
    "E-waste run: old batteries out of the drawer at last.",
    "Shared the bin space with neighbors to avoid contamination.",
    "Started composting—blue bin is cleaner than ever.",
    "Printed less; switched two bills to digital.",
    "Refilled my water bottle the whole week—no PET used.",
    "Team effort at work: mini sorting station launched.",
    "Asked the local MRF about labels—learned a lot!",
    "Reused jars for overnight oats before recycling.",
    "Carried a travel mug all week—zero disposable cups.",
    "Planted herbs in cleaned tin cans—upcycled planters!",
    "Used cardboard scraps for crafts before recycling.",
    "Recycling app streak: 10 days and counting!",
    "Sorted all plastics by code—so satisfying.",
    "Weekend cleanup with neighbors—collected 200 bottles!",
    "Cut down packaging waste by buying bulk snacks.",
    "Donated old clothes instead of throwing them away.",
    "Tried compostable trash liners—worked great.",
    "Flattened all cereal boxes—tiny step, big space gain.",
    "Recycling game night—family sorting challenge!",
    "Installed small bins in every room—no excuses now.",
    "Shared eco-tips in our apartment chat group.",
    "Refused free promotional flyers—paper saved!",
    "Used reusable produce bags—felt great skipping plastic.",
    "Glass bin filled perfectly sorted—looks beautiful.",
    "Finally learned what NOT to recycle—feels good!",
    "Made a DIY compost bin from a bucket.",
    "Tracked weekly recycling totals—beat last week!",
    "Reused bubble wrap for shipping gifts.",
    "Joined an online zero-waste challenge—feeling motivated.",
    "Cleaned labels off bottles—ready for drop-off.",
    "Helped parents set up color-coded bins at home.",
    "Cut single-use lunch packaging—went fully reusable.",
    "Organized my drawers using upcycled boxes.",
    "Repaired my old coffee maker instead of replacing it.",
    "Participated in community cleanup—feels amazing!",
]


MIN_POOL = 20  # Safety threshold for curated lists

@transaction.atomic
def generate_mock_data(
    num_users=10,
    num_posts=10,
    num_max_comments_per_post=10,
    num_tips=10,
    num_max_wastes_per_user=10,
    num_achievements=10,
    num_challenges=10,
    max_challenge_target_amount=10,   # kept for compatibility
    reported_content_percent=0.05
):
    # ----------------------------- USERS -------------------------------------
    users = []

    test_user = Users(
        username="test_user",
        email="test@gmail.com",
        password=make_password("test123"),
        isAdmin=False,
        profile_image=themed_avatar_url(0),
        bio="Sharing my journey to reduce waste and recycle better.",
    )
    test_user.save()
    users.append(test_user)

    generated_usernames = {"test_user"}
    generated_emails = {"test@gmail.com"}

    while len(users) < num_users:
        username = fake.user_name()
        email = fake.unique.email()
        if username in generated_usernames or email in generated_emails:
            continue

        user = Users(
            username=username,
            email=email,
            password=make_password(fake.password()),
            isAdmin=random.random() < 0.05,  # ~5% admin
            profile_image=themed_avatar_url(len(users)),
            bio = random.choice([
    "Learning to live more sustainably and reduce daily waste.",
    "Passionate about recycling and sharing eco-friendly habits.",
    "On a journey to cut single-use plastics from my routine.",
    "Helping my neighborhood recycle smarter and cleaner.",
    "Keeping track of how small actions reduce big waste.",
    "Exploring ways to reuse and repurpose household materials.",
    "Trying to make zero-waste living more achievable for everyone.",
    "Experimenting with composting and local recycling programs.",
    "Encouraging friends to log and improve their recycling habits.",
    "Turning sustainability into a daily practice, not a chore.",
    "Lover of clean bins, organized spaces, and circular systems.",
    "Reducing my footprint one sorted item at a time.",
    "Finding balance between convenience and sustainability.",
    "Believer in community-driven environmental change.",
    "Working on becoming plastic-free by the end of the year.",
    "Tracking my recycling progress to stay motivated.",
    "Exploring minimalism through sustainable living.",
    "Sharing tips for cleaner, smarter waste management.",
    "Using small daily habits to make a big environmental impact.",
    "Recycling advocate and lifelong learner about sustainability.",
    "Spreading awareness about waste reduction in my community.",
    "Loving the process of sorting, recycling, and reusing creatively.",
    "Challenging myself to go one week without disposable plastics.",
    "Documenting my journey to a more circular lifestyle.",
    "Finding joy in turning waste into resources.",
    "Participating in local cleanup events and recycling drives.",
    "Building a low-waste home, one step at a time.",
    "Experimenting with DIY reuse projects and upcycling.",
    "Supporting local recycling initiatives and education.",
    "Making sustainable living fun and approachable.",
]),
            total_points=0,
            total_co2=0.0,
        )
        user.save()
        users.append(user)
        generated_usernames.add(username)
        generated_emails.add(email)

    # Ensure Waste choices exist
    for key, _ in getattr(Waste, "WASTE_TYPES", [("plastic","Plastic"),("paper","Paper"),("glass","Glass"),("metal","Metal")]):
        Waste.objects.get_or_create(type=key)
    wastes = list(Waste.objects.all())
    key_by_id = {w.id: w.type for w in wastes}
    idx_by_key = {w.type: i for i, w in enumerate(wastes)}

    # ----------------------------- POSTS -------------------------------------
    posts = []
    # Seed at least MIN_POOL captions for variety (use all; then add random if desired)
    test_user_posts = []
    for text in SEED_CAPTIONS[:max(MIN_POOL, min(len(SEED_CAPTIONS), 3))]:
        selected_lang = random.choice(['en', 'tr', 'ar', 'es', 'fr'])
        # Translate text if not English
        post_text = translate_text(text, 'en', selected_lang) if selected_lang != 'en' else text
        
        post = Posts(
            text=post_text,
            image=themed_post_image_url(),
            creator=test_user,
            date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            like_count=0,
            dislike_count=0,
            language=selected_lang,
        )
        post.save()
        test_user_posts.append(post)

    # Random community posts themed around waste types
    waste_keys = [k for k, _ in getattr(Waste, "WASTE_TYPES", [("plastic","Plastic"),("paper","Paper"),("glass","Glass"),("metal","Metal")])]
    post_phrases = [
    "Sorted {n} pieces of {t} today.",
    "Rinsed and recycled {n} items of {t}.",
    "Set a dedicated bin for {t}—sorting is faster now.",
    "Tracked pickup times; no more overflowing {t}.",
    "Swapped single-use with reusables; less {t} this week.",
    "Kept the stream clean—no food residue on {t}.",
    "Flattened bulky {t} packaging to save space.",
    "Helped a friend start sorting {t} at home.",
    "Logged {n} {t} items after a quick cleanup.",
    "Separated {t} at the source; kitchen corner sorted.",
    "Checked local rules; learned how to prepare {t} properly.",
    "Avoided contamination—removed food from {t} before binning.",
    "Batch-rinsed {t}; done in under five minutes.",
    "Returned deposit bottles; fewer {t} in my recycling now.",
    "Skipped black plastic—chose alternatives; reduced {t}.",
    "Flattened boxes; {t} bin has room again.",
    "Labelled bins so roommates sort {t} correctly.",
    "Used a tote and bottle; prevented new {t} waste.",
    "Scheduled a reminder for {t} collection day.",
    "Donated containers before recycling; less {t} overall.",
    "Moved to e-bills; less {t} in the mailbox.",
    "Refill station run—cut down on {t} packaging.",
    "Community cleanup: logged {n} pieces of {t} from the park.",
    "Workplace station launched; colleagues now sort {t}.",
    "Added a caddy under the sink to separate {t}.",
    "Kept caps on per guidance; squashed {t} for pickup.",
    "Quick tip shared about prepping {t}; got great feedback.",
    "Organized a hallway bin to collect {t} for the floor.",
    "Family effort: everyone logged {n} {t} items today.",
    "Weekend purge: sorted old {t} into the right stream.",
    "Tracked weekly totals; {t} entries trending up.",
    "Switched a product to a reusable—no more {t} from it.",
    "Asked the MRF about labels; updated how I sort {t}.",
    "Removed non-recyclables mixed with {t}; clean bin now.",
    "Set a goal to log {n} {t} this month.",
    "Challenge progress: focused on {t} and hit today’s target.",
    "Reused jars first, recycled {t} only when done.",
    "Shared storage hacks to reduce {t} clutter at home.",
    "Neighbor swap: traded containers to cut {t} waste.",
    "E-waste drop-off cleared; kept it out of {t} stream.",
    "Taught a friend how to prep {t}; they logged their first {n} items.",
    "Bulk order with neighbors; less {t} packaging per person.",
    "Rainy-day sort: cleaned and dried {t} before binning.",
    "Mini-audit: fixed a few mistakes in how I sorted {t}.",
    "Event cleanup crew: collected {n} {t} after the meetup.",
    "Compost started; recycling stream has cleaner {t} now.",
    "Carried a kit (tote & tumbler) and avoided new {t} all week.",
    "Moved {t} bin closer to the action—sorting feels effortless.",
    "End-of-month tally: {n} {t} items diverted from trash.",
]
    # Generate up to num_posts random posts
    for _ in range(num_posts):
        t = random.choice(waste_keys)
        text = random.choice(post_phrases).format(n=random.randint(2, 12), t=t)
        selected_lang = random.choice(['en', 'tr', 'ar', 'es', 'fr'])
        # Translate text if not English
        post_text = translate_text(text, 'en', selected_lang) if selected_lang != 'en' else text
        
        post = Posts(
            text=post_text,
            image=themed_post_image_url(t),
            creator=random.choice(users),
            date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            like_count=0,
            dislike_count=0,
            language=selected_lang,
        )
        post.save()
        posts.append(post)

    # ----------------------------- COMMENTS ----------------------------------
    comments = []
    # Ensure we have at least MIN_POOL distinct comments available
    comment_pool = COMMENT_BANK[:]
    while len(comment_pool) < MIN_POOL:
        comment_pool.append(fake.sentence(nb_words=8))

    for post in posts + test_user_posts:
        for _ in range(random.randint(0, num_max_comments_per_post)):
            comment = Comments(
                post=post,
                author=random.choice(users),
                content=random.choice(comment_pool),
                date=fake.date_time_between(start_date=post.date, end_date=timezone.now(),
                                            tzinfo=timezone.get_current_timezone()),
            )
            comment.save()
            comments.append(comment)

    # ------------------------------- TIPS ------------------------------------
    tips = []
    tips_pool = RECYCLING_TIPS[:]
    # Guarantee at least MIN_POOL tips
    while len(tips_pool) < MIN_POOL:
        tips_pool.append((
            fake.sentence(nb_words=3),
            "Sort clean, dry items and follow your local rules to reduce contamination."
        ))
    # Create tips (bounded by requested num_tips but never less than 20 curated created)
    create_count = max(num_tips, MIN_POOL)
    for i in range(create_count):
        title, body = tips_pool[i % len(tips_pool)]
        selected_lang = random.choice(['en', 'tr', 'ar', 'es', 'fr'])
        # Translate both title and body if not English
        if selected_lang != 'en':
            tip_title = translate_text(title, 'en', selected_lang)
            tip_body = translate_text(body, 'en', selected_lang)
        else:
            tip_title = title
            tip_body = body
        
        tip = Tips(
            title=tip_title,
            text=tip_body,
            like_count=0,
            dislike_count=0,
            language=selected_lang,
        )
        tip.save()
        tips.append(tip)

    # --------------------------- USER WASTES ---------------------------------
    user_wastes = []
    for user in users:
        total_logs = random.randint(0, num_max_wastes_per_user)
        if total_logs == 0:
            continue

        keys = list(WASTE_WEIGHTS.keys())
        weights = [WASTE_WEIGHTS.get(k, 0.25) for k in keys]
        for _ in range(total_logs):
            chosen_key = random.choices(keys, weights=weights, k=1)[0]
            w = wastes[idx_by_key.get(chosen_key, 0)]
            amount = random.randint(1, 5)
            uw = UserWastes(user=user, waste=w, amount=amount)
            uw.save()
            user_wastes.append(uw)

        # Compute totals from wastes
        totals_points = 0
        totals_co2 = 0.0
        for uw in UserWastes.objects.filter(user=user):
            k = key_by_id.get(uw.waste_id)
            if not k:
                continue
            totals_points += POINTS_PER_TYPE.get(k, 1) * uw.amount
            totals_co2 += CO2_PER_TYPE.get(k, 0.05) * uw.amount
        user.total_points = totals_points
        user.total_co2 = round(totals_co2, 3)
        user.save()

    # ----------------------------- REACTIONS ---------------------------------
    # Tip reactions (unique per user; recount counters from DB)
    for tip in tips:
        reactors = random.sample(users, random.randint(0, min(len(users), 30)))
        seen = set()
        for user in reactors:
            if user.id in seen:
                continue
            seen.add(user.id)
            reaction = random.choice(["LIKE", "DISLIKE"])
            TipLikes.objects.create(
                user=user,
                tip=tip,
                reaction_type=reaction,
                date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            )
        tip.like_count = TipLikes.objects.filter(tip=tip, reaction_type="LIKE").count()
        tip.dislike_count = TipLikes.objects.filter(tip=tip, reaction_type="DISLIKE").count()
        tip.save()

    # Post reactions (unique per user; recount counters)
    for post in posts + test_user_posts:
        reactors = random.sample(users, random.randint(0, min(len(users), 30)))
        seen = set()
        for user in reactors:
            if user.id in seen:
                continue
            seen.add(user.id)
            reaction = random.choice(["LIKE", "DISLIKE"])
            PostLikes.objects.create(
                user=user,
                post=post,
                reaction_type=reaction,
                date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            )
        post.like_count = PostLikes.objects.filter(post=post, reaction_type="LIKE").count()
        post.dislike_count = PostLikes.objects.filter(post=post, reaction_type="DISLIKE").count()
        post.save()

    # ---------------------------- ACHIEVEMENTS -------------------------------
    achievements = []
    ach_pool = ACHIEVEMENT_TEMPLATES[:]
    while len(ach_pool) < MIN_POOL:
        ach_pool.append((fake.sentence(nb_words=3), "For being awesome at consistent recycling."))
    create_ach = max(num_achievements, MIN_POOL)
    for i in range(create_ach):
        title, desc = ach_pool[i % len(ach_pool)]
        a = Achievements(title=title, description=desc, icon=themed_avatar_url(1000 + i))
        a.save()
        achievements.append(a)

    # Randomly award some (later you can compute strictly)
    user_achievements = []
    for user in users:
        sampled = random.sample(achievements, random.randint(0, min(7, len(achievements))))
        for a in sampled:
            ua = UserAchievements(
                user=user,
                achievement=a,
                earned_at=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            )
            ua.save()
            user_achievements.append(ua)

    challenges = []
    chall_pool = CHALLENGE_TEMPLATES[:]

    REQUIRED_TYPES = ["plastic", "paper", "glass", "metal", "electronic", "oil&fat", "organic"]
    TARGET_CHOICES = [1000, 1200, 1500, 1800, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 8000, 10000]
    TITLE_SEEDS = [
        "Recycling Sprint", "Diversion Drive", "Recovery Goal", "Material Marathon",
        "Impact Target", "Clean Stream Goal", "Circularity Push", "Zero-Landfill Push",
        "Footprint Cut", "Waste Offset", "Eco Milestone", "Sustainability Target"
    ]

    def make_generic_title(target):
        # e.g., 2000 -> "2kg", 4500 -> "4.5kg"
        kg = (target / 1000.0)
        suffix = f"{kg:g}kg"
        return f"{random.choice(TITLE_SEEDS)} {suffix}"

    def make_generic_desc(target):
        return f"Recycle at least {target} grams."

    # Fill up to MIN_POOL with generic entries; keep internal bias but never mention it in text
    while len(chall_pool) < MIN_POOL:
        bias = random.choice(REQUIRED_TYPES + [None])  # may include a generic/mixed slot
        target = random.choice(TARGET_CHOICES)
        title = make_generic_title(target)
        desc = make_generic_desc(target)
        chall_pool.append((title, desc, target, bias))

    # Hard guarantee: at least one challenge for each required type
    present_types = {b for (_, _, _, b) in chall_pool if b in REQUIRED_TYPES}
    for missing in set(REQUIRED_TYPES) - present_types:
        target = random.choice([1000, 1500, 2000, 2500, 3000])
        chall_pool.append((make_generic_title(target), make_generic_desc(target), target, missing))

    create_ch = max(num_challenges, MIN_POOL)
    for i in range(create_ch):
        title, desc, target, bias = chall_pool[i % len(chall_pool)]
        reward = Achievements(
            title=f"Completed: {title}",
            description=f"For finishing the '{title}' challenge.",
            icon=themed_avatar_url(2000 + i),
        )
        reward.save()
        ch = Challenge(
            title=title,
            description=desc,
            target_amount=target,
            current_progress=random.uniform(0, max(1.0, target * 0.4)),
            is_public=random.choice([True, False]),
            reward=reward,
            creator=random.choice(users),
        )
        ch.save()
        challenges.append(ch)


    # Public challenges: many members; private: creator only
    for ch in challenges:
        if ch.is_public:
            chosen_users = random.sample(users, random.randint(1, len(users)))
            for u in chosen_users:
                UserChallenge.objects.create(
                    user=u,
                    challenge=ch,
                    joined_date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
                )
        else:
            UserChallenge.objects.create(
                user=ch.creator,
                challenge=ch,
                joined_date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            )

    # ------------------------------- REPORTS ---------------------------------
    comment_ct = ContentType.objects.get_for_model(Comments)
    post_ct = ContentType.objects.get_for_model(Posts)
    challenge_ct = ContentType.objects.get_for_model(Challenge)
    user_ct = ContentType.objects.get_for_model(Users)
    tip_ct = ContentType.objects.get_for_model(Tips)

    medias = [
        (comment_ct, comments),
        (post_ct, posts + test_user_posts),
        (challenge_ct, challenges),
        (user_ct, users),
        (tip_ct, tips),
    ]

    for media_ct, media in medias:
        if not media:
            continue
        n_reports = int(len(media) * reported_content_percent)
        for _ in range(n_reports):
            media_instance = random.choice(media)
            Report.objects.create(
                content_type=media_ct,
                object_id=getattr(media_instance, "id", getattr(media_instance, "pk", None)),
                reporter=random.choice(users),
                reason=random.choice(Report.REPORT_REASON_CHOICES)[0],
                description=random.choice([
                    "Wrong category", "Inappropriate language", "Duplicate content", "Spam", "Misinformation"
                ]),
                date_reported=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            )

    # ---------------------------- FOLLOW RELATIONSHIPS -----------------------
    # Create realistic follow relationships between users
    # Users tend to follow others who are active, similar interests, or popular
    follows = []
    
    # Calculate "popularity score" based on activity
    user_activity = {}
    for user in users:
        post_count = Posts.objects.filter(creator=user).count()
        comment_count = Comments.objects.filter(author=user).count()
        activity_score = post_count * 3 + comment_count  # Posts weighted more than comments
        user_activity[user.id] = activity_score
    
    # Sort users by activity (more active users get more followers)
    users_by_activity = sorted(users, key=lambda u: user_activity.get(u.id, 0), reverse=True)
    
    for user in users:
        # Each user follows between 0-15 other users (weighted towards active users)
        num_to_follow = random.randint(0, 15)
        
        # Higher chance of following more active users
        # Create a weighted list where more active users appear more times
        weighted_candidates = []
        for candidate in users:
            if candidate.id == user.id:  # Can't follow yourself
                continue
            
            # Weight by activity score
            weight = max(1, user_activity.get(candidate.id, 0) // 2)
            weighted_candidates.extend([candidate] * weight)
        
        # Also add all users at least once to ensure everyone has a chance
        for candidate in users:
            if candidate.id != user.id:
                weighted_candidates.append(candidate)
        
        if weighted_candidates:
            # Sample without replacement to avoid duplicates
            num_to_follow = min(num_to_follow, len(set(weighted_candidates)))
            followed_users = []
            attempts = 0
            max_attempts = num_to_follow * 3
            
            while len(followed_users) < num_to_follow and attempts < max_attempts:
                candidate = random.choice(weighted_candidates)
                if candidate not in followed_users and candidate.id != user.id:
                    followed_users.append(candidate)
                attempts += 1
            
            # Create Follow relationships
            for followed_user in followed_users:
                # Check if relationship doesn't already exist
                if not Follow.objects.filter(follower=user, following=followed_user).exists():
                    follow = Follow.objects.create(
                        follower=user,
                        following=followed_user,
                        created_at=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
                    )
                    follows.append(follow)
    
    # Ensure test_user has some followers and is following some users
    if not Follow.objects.filter(follower=test_user).exists():
        # Make test_user follow some active users
        test_follows = random.sample([u for u in users_by_activity[:10] if u.id != test_user.id], min(5, len(users) - 1))
        for followed in test_follows:
            Follow.objects.get_or_create(
                follower=test_user,
                following=followed,
                defaults={'created_at': fake.date_time_this_year(tzinfo=timezone.get_current_timezone())}
            )
    
    if not Follow.objects.filter(following=test_user).exists():
        # Make some users follow test_user
        test_followers = random.sample([u for u in users if u.id != test_user.id], min(8, len(users) - 1))
        for follower in test_followers:
            Follow.objects.get_or_create(
                follower=follower,
                following=test_user,
                defaults={'created_at': fake.date_time_this_year(tzinfo=timezone.get_current_timezone())}
            )

    # ---------------------------- SAVED POSTS --------------------------------
    # Users save posts they find interesting/useful
    saved_posts = []
    for user in users:
        # Each user saves between 0-10 posts
        num_to_save = random.randint(0, min(10, len(posts + test_user_posts)))
        if num_to_save > 0:
            posts_to_save = random.sample(posts + test_user_posts, num_to_save)
            for post in posts_to_save:
                # Don't save your own posts (optional rule)
                if post.creator.id == user.id:
                    continue
                # Check if not already saved
                if not SavedPosts.objects.filter(user=user, post=post).exists():
                    saved_post = SavedPosts.objects.create(
                        user=user,
                        post=post,
                        date_saved=fake.date_time_this_year(tzinfo=timezone.get_current_timezone())
                    )
                    saved_posts.append(saved_post)
    
    # Ensure test_user has some saved posts
    if not SavedPosts.objects.filter(user=test_user).exists():
        test_saved = random.sample([p for p in posts if p.creator.id != test_user.id], min(5, len(posts)))
        for post in test_saved:
            SavedPosts.objects.get_or_create(
                user=test_user,
                post=post,
                defaults={'date_saved': fake.date_time_this_year(tzinfo=timezone.get_current_timezone())}
            )

    # -------------------------- SUSPICIOUS WASTE -----------------------------
    # Generate some suspicious waste entries that need verification
    # These are waste logs that might be fraudulent or need review
    suspicious_wastes = []
    
    # Select ~5% of users to have suspicious waste entries
    suspicious_users = random.sample(users, max(1, int(len(users) * 0.05)))
    
    for user in suspicious_users:
        # Each suspicious user has 1-3 suspicious waste entries
        num_suspicious = random.randint(1, 3)
        for _ in range(num_suspicious):
            waste_type = random.choice(wastes)
            # Suspicious entries tend to have unusually high amounts
            amount = random.uniform(100, 500)  # Much higher than normal
            suspicious = SuspiciousWaste.objects.create(
                user=user,
                waste=waste_type,
                amount=amount,
                date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
                photo=f"suspicious_waste_photos/suspicious_{user.id}_{random.randint(1000, 9999)}.jpg"
            )
            suspicious_wastes.append(suspicious)


class Command(BaseCommand):
    help = 'Generate mock data (English, recycling-focused, rich variety)'

    def add_arguments(self, parser):
        parser.add_argument("--num-users", type=int, default=100, help="Number of users to generate")
        parser.add_argument("--num-posts", type=int, default=100, help="Number of posts to generate")
        parser.add_argument("--num-max-comments-per-post", type=int, default=7, help="Maximum comments per post")
        parser.add_argument("--num-tips", type=int, default=30, help="Number of tips to generate")
        parser.add_argument("--num-max-wastes-per-user", type=int, default=30, help="Maximum waste entries per user")
        parser.add_argument("--num-achievements", type=int, default=25, help="Number of achievements to generate")
        parser.add_argument("--num-challenges", type=int, default=40, help="Number of challenges to generate")
        parser.add_argument("--max-challenge-target-amount", type=int, default=50, help="Max challenge target amount")
        parser.add_argument("--reported-content-percent", type=float, default=0.05, help="Percentage of content to report (0.0-1.0)")
        parser.add_argument("--seed", type=int, default=None, help="Set RNG seed for reproducible output")
        parser.add_argument("--dry-run", action="store_true", help="Run and rollback (no DB changes)")
        parser.add_argument("--mode", choices=["full", "users", "posts", "follows", "wastes", "tips", "challenges"], default="full",
                            help="Run only a subset useful for iteration")

    def handle(self, *args, **options):
        seed = options.get("seed")
        dry_run = options.get("dry_run")
        mode = options.get("mode", "full")

        # Apply seed for reproducibility
        if seed is not None:
            random.seed(seed)
            try:
                fake.seed_instance(seed)
            except Exception:
                pass
            self.stdout.write(self.style.NOTICE(f"Using seed={seed}"))

        kwargs = dict(
            num_users=options["num_users"],
            num_posts=options["num_posts"],
            num_max_comments_per_post=options["num_max_comments_per_post"],
            num_tips=options["num_tips"],
            num_max_wastes_per_user=options["num_max_wastes_per_user"],
            num_achievements=options["num_achievements"],
            num_challenges=options["num_challenges"],
            max_challenge_target_amount=options["max_challenge_target_amount"],
            reported_content_percent=options["reported_content_percent"],
        )

        self.stdout.write(self.style.NOTICE(f"Mode={mode} | Params: {', '.join(f'{k}={v}' for k, v in kwargs.items())}"))
        
        # Wrap in atomic so we can rollback on dry-run
        with transaction.atomic():
            try:
                if mode == "full":
                    generate_mock_data(**kwargs)
                elif mode == "users":
                    # Generate only users (needed for other modes)
                    generate_mock_data(
                        num_users=kwargs["num_users"], 
                        num_posts=0, 
                        num_max_comments_per_post=0,
                        num_tips=0,
                        num_max_wastes_per_user=0, 
                        num_achievements=0, 
                        num_challenges=0,
                        max_challenge_target_amount=0,
                        reported_content_percent=0.0
                    )
                elif mode == "posts":
                    # Generate users and posts (posts need users)
                    generate_mock_data(
                        num_users=max(10, kwargs["num_users"] // 10),  # Need some users for posts
                        num_posts=kwargs["num_posts"], 
                        num_max_comments_per_post=kwargs["num_max_comments_per_post"],
                        num_tips=0,
                        num_max_wastes_per_user=0, 
                        num_achievements=0, 
                        num_challenges=0,
                        max_challenge_target_amount=0,
                        reported_content_percent=0.0
                    )
                elif mode == "follows":
                    # Generate users to create follow relationships
                    generate_mock_data(
                        num_users=kwargs["num_users"], 
                        num_posts=max(5, kwargs["num_posts"] // 10),  # Need some posts for activity-based following
                        num_max_comments_per_post=2,
                        num_tips=0,
                        num_max_wastes_per_user=0, 
                        num_achievements=0, 
                        num_challenges=0,
                        max_challenge_target_amount=0,
                        reported_content_percent=0.0
                    )
                elif mode == "wastes":
                    # Generate users and waste entries
                    generate_mock_data(
                        num_users=kwargs["num_users"], 
                        num_posts=0, 
                        num_max_comments_per_post=0,
                        num_tips=0,
                        num_max_wastes_per_user=kwargs["num_max_wastes_per_user"],
                        num_achievements=0, 
                        num_challenges=0,
                        max_challenge_target_amount=0,
                        reported_content_percent=0.0
                    )
                elif mode == "tips":
                    # Generate only tips (no users needed)
                    generate_mock_data(
                        num_users=0, 
                        num_posts=0, 
                        num_max_comments_per_post=0,
                        num_tips=kwargs["num_tips"],
                        num_max_wastes_per_user=0, 
                        num_achievements=0, 
                        num_challenges=0,
                        max_challenge_target_amount=0,
                        reported_content_percent=0.0
                    )
                elif mode == "challenges":
                    # Generate users and challenges
                    generate_mock_data(
                        num_users=max(10, kwargs["num_users"] // 10),  # Need some users for challenges
                        num_posts=0, 
                        num_max_comments_per_post=0,
                        num_tips=0,
                        num_max_wastes_per_user=0, 
                        num_achievements=kwargs["num_achievements"],  # Challenges need achievements for rewards
                        num_challenges=kwargs["num_challenges"],
                        max_challenge_target_amount=kwargs["max_challenge_target_amount"],
                        reported_content_percent=0.0
                    )
                
                if dry_run:
                    # Mark rollback for the current transaction
                    transaction.set_rollback(True)
                    self.stdout.write(self.style.WARNING("🔄 Dry-run: rolling back changes (no data persisted)"))
                else:
                    self.stdout.write(self.style.SUCCESS(f"✅ Mock data generated successfully (mode: {mode})"))
                    
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"❌ Error during generation: {e}"))
                raise
