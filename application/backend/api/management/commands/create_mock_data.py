from django.core.management.base import BaseCommand
from faker import Faker
import random
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.hashers import make_password
from django.contrib.contenttypes.models import ContentType

from api.models import (
    Users, Achievements, UserAchievements, Posts, Comments, Tips, Waste,
    UserWastes, Report, TipLikes, PostLikes
)
from challenges.models import Challenge, UserChallenge

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

# At least 20 curated recycling tips (title, body)
RECYCLING_TIPS = [
    ("Squash plastic bottles", "Remove caps and squash bottles to save bin space and improve collection efficiency."),
    ("Keep paper clean", "Greasy/wet paper cannot be recycled. Keep it dry and clean for higher recovery rates."),
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
    ("Keep caps separate", "Check your local rules; many now accept bottles with caps on, after squashing."),
    ("No bagged recycling", "Loose items are best; bagged recyclables can be rejected by facilities."),
    ("Leave staples", "Small staples are okay on paper; remove big clips if easy."),
    ("Don’t smash glass", "Intact glass is safer and easier to sort than shards."),
    ("Learn your MRF rules", "Facilities differ; a quick lookup prevents contamination."),
    ("Donate before tossing", "Working items and containers might find a second life."),
    ("Refill stations", "Look for bulk/refill shops for detergents and pantry goods."),
    ("Bring back hangers", "Many stores accept hangers; reduce plastic hanger waste."),
]

# At least 20 achievements (title, description)
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
]

# At least 20 challenges (title, description, target items, bias type or None)
CHALLENGE_TEMPLATES = [
    ("Plastic-Free Week", "Minimize single-use plastics for one week.", 20, "plastic"),
    ("Paper Purge", "Collect and recycle all paper/cardboard at home.", 30, "paper"),
    ("Glass Jar Revival", "Rinse and recycle or repurpose your glass jars.", 15, "glass"),
    ("Metal Rush", "Flatten and recycle all beverage cans this month.", 25, "metal"),
    ("100 Mixed Items", "Recycle any mix of materials to reach 100 items.", 100, None),
    ("Zero E-Waste", "Take old batteries/e-waste to a proper drop-off.", 5, None),
    ("Invite a Friend", "Invite someone to join and recycle with you.", 10, None),
    ("Cardboard King", "Flatten and recycle moving/parcel boxes.", 40, "paper"),
    ("Bottle Buster", "Recycle 30 plastic bottles responsibly.", 30, "plastic"),
    ("Canteen Club", "Use a refillable bottle; cut bottle waste.", 20, "plastic"),
    ("Jar Genius", "Recycle or reuse 20 glass containers.", 20, "glass"),
    ("Can-Do Spirit", "Recycle 30 metal cans.", 30, "metal"),
    ("No-Bag Pledge", "Avoid bagging recyclables for 2 weeks.", 25, None),
    ("Deposit Dynamo", "Return 15 deposit bottles.", 15, "plastic"),
    ("Clean Stream Week", "Zero contamination in your bin for a week.", 25, None),
    ("Office Recycler", "Set up a small sorting station at work.", 20, None),
    ("Label Learner", "Learn local rules; achieve 20 perfect sorts.", 20, None),
    ("Bulk Buyer", "Use bulk/refill stations 5 times.", 5, None),
    ("Hang On", "Return 20 plastic hangers to stores.", 20, "plastic"),
    ("Paperless Push", "Switch a few bills/statements to digital.", 10, "paper"),
    ("Metal Monday", "Collect and recycle metal every Monday.", 20, "metal"),
    ("Glass Gala", "Focus on glass this week and log 15 items.", 15, "glass"),
    ("Spring Clean", "Declutter and donate before recycling.", 30, None),
]

# At least 20 comment strings
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
]

# Seed captions for domain posts (≥20 short captions/ideas)
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
        profile_image=fake.image_url(),
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
            profile_image=fake.image_url(),
            bio=random.choice([
                "Learning to sort smarter.",
                "Cutting single-use plastic step by step.",
                "Glass and paper recycling fan.",
                "Trying a zero-waste routine.",
                "Helping neighbors recycle right.",
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
        post = Posts(
            text=text,
            image=fake.image_url(),
            creator=test_user,
            date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            like_count=0,
            dislike_count=0,
        )
        post.save()
        test_user_posts.append(post)

    # Random community posts themed around waste types
    waste_keys = [k for k, _ in getattr(Waste, "WASTE_TYPES", [("plastic","Plastic"),("paper","Paper"),("glass","Glass"),("metal","Metal")])]
    post_phrases = [
        "Sorted {n} pieces of {t} today.",
        "Set a dedicated bin for {t}—sorting is faster now.",
        "Rinsed and recycled a batch of {t}.",
        "Tracked pickup times; no more overflowing {t}.",
        "Swapped single-use with reusables; less {t} this week.",
        "Kept the stream clean—no food residue on {t}.",
        "Flattened bulky {t} packaging to save space.",
        "Helped a friend start sorting {t} at home.",
    ]
    # Generate up to num_posts random posts
    for _ in range(num_posts):
        t = random.choice(waste_keys)
        text = random.choice(post_phrases).format(n=random.randint(2, 12), t=t)
        post = Posts(
            text=text,
            image=fake.image_url(),
            creator=random.choice(users),
            date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            like_count=0,
            dislike_count=0,
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
        tip = Tips(
            title=title,
            text=body,
            like_count=0,
            dislike_count=0,
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
        a = Achievements(title=title, description=desc, icon=fake.image_url())
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

    # ----------------------------- CHALLENGES --------------------------------
    challenges = []
    chall_pool = CHALLENGE_TEMPLATES[:]
    while len(chall_pool) < MIN_POOL:
        chall_pool.append((
            fake.sentence(nb_words=2),
            fake.text(max_nb_chars=120),
            random.randint(10, 120),
            random.choice([None, "plastic", "paper", "glass", "metal"])
        ))
    create_ch = max(num_challenges, MIN_POOL)
    for i in range(create_ch):
        title, desc, target, bias = chall_pool[i % len(chall_pool)]
        reward = Achievements(
            title=f"Completed: {title}",
            description=f"For finishing the '{title}' challenge.",
            icon=fake.image_url(),
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


class Command(BaseCommand):
    help = 'Generate mock data (English, recycling-focused, rich variety)'

    def handle(self, *args, **kwargs):
        generate_mock_data(
            num_users=100,
            num_posts=100,
            num_max_comments_per_post=7,
            num_tips=30,             # will still create at least 20
            num_max_wastes_per_user=30,
            num_achievements=25,     # at least 20 will be created
            num_challenges=40,       # at least 20 will be created
            max_challenge_target_amount=50,
            reported_content_percent=0.05,
        )
        self.stdout.write(self.style.SUCCESS("English recycling mock data generated."))
