from django.core.management.base import BaseCommand
from faker import Faker
import random
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.hashers import make_password
from django.contrib.contenttypes.models import ContentType

from api.models import Users, Achievements, UserAchievements, Posts, Comments, Tips, Waste, UserWastes, Report, TipLikes, PostLikes

from challenges.models import Challenge, UserChallenge

fake = Faker()


@transaction.atomic
def generate_mock_data(
        num_users=10,
        num_posts=10,
        num_max_comments_per_post=10,
        num_tips=10,
        num_max_wastes_per_user=10,
        num_achievements=10,
        num_challenges=10,
        max_challenge_target_amount=10,
        reported_content_percent=0.05
):
    # USERS
    users = []
    # Create a specific test user
    test_user = Users(
        username="test_user",
        email="test@gmail.com",
        password=make_password("test123"),
        isAdmin=False,
        profile_image=fake.image_url(),
        bio="Test user for development and testing purposes.",
    )
    test_user.save()
    users.append(test_user)

    # Create test user posts
    test_user_posts = []
    for i in range(3):
        post = Posts(
            text=f"Test post {i + 1} from test_user",
            image=fake.image_url(),
            creator=test_user,
            date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            
        )
        post.save()
        test_user_posts.append(post)

    # Create random users
    generated_usernames = set(["test_user"])  # Already used
    generated_emails = set(["test@gmail.com"])  # Already used
    while len(users) < num_users:
        username = fake.user_name()
        email = fake.email()
        if username in generated_usernames or email in generated_emails:
            continue

        user = Users(
            username=username,
            email=email,
            password=make_password(fake.password()),
            isAdmin=random.choice([True, False, False, False, False, False, False, False, False, False, False]),
            profile_image=fake.image_url(),
            bio=fake.text(),
            total_points=random.randint(0, 100),
            total_co2=random.uniform(0, 100),

        )
        user.save()
        users.append(user)
        generated_usernames.add(username)
        generated_emails.add(email)

    # POSTS
    posts = []
    for _ in range(num_posts):
        post = Posts(
            text=fake.text(),
            image=fake.image_url(),
            creator=random.choice(users),
            date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            like_count=0,
            dislike_count=0
        )
        post.save()
        posts.append(post)

    # COMMENTS
    comments = []
    for post in posts:
        for _ in range(random.randint(0, num_max_comments_per_post)):
            comment = Comments(
                post=post,
                author=random.choice(users),
                content=fake.text(),
                date=fake.date_time_between(start_date=post.date, end_date=timezone.now(),
                                            tzinfo=timezone.get_current_timezone()),
            )
            comment.save()
            comments.append(comment)
            
    # TIPS
    tips = []
    for i in range(num_tips):
        tip = Tips(
            title=fake.sentence(nb_words=random.randint(2, 4)),
            text=fake.text(),
            like_count=0,  # Initialize to 0, will be updated based on actual likes
            dislike_count=0,  # Initialize to 0, will be updated based on actual dislikes
        )
        tip.save()
        tips.append(tip)

    # Generate Wastes (The 4 canonical types)
    for key, _ in Waste.WASTE_TYPES:
        Waste.objects.get_or_create(type=key)
    wastes = list(Waste.objects.all())

    # USER WASTES
    user_wastes = []
    for user in users:
        waste_bins = [0] * len(wastes)
        for _ in range(random.randint(0, num_max_wastes_per_user)):
            waste_bins[random.randint(0, len(waste_bins) - 1)] += 1
        for waste_index, waste_count in enumerate(waste_bins):
            if waste_count > 0:
                user_waste = UserWastes(
                    user=user,
                    waste=wastes[waste_index],
                    amount=waste_count,
                )
                user_waste.save()
                user_wastes.append(user_waste)
                
    # TIP LIKES AND DISLIKES
    for tip in tips:
        # Randomly select users who will react to this tip
        reacting_users = random.sample(
            users, 
            random.randint(0, min(len(users), 30))  # Maximum 30 users per tip or all users if less
        )
        
        for user in reacting_users:
            # Decide if the user will like or dislike
            reaction_type = random.choice(['LIKE', 'DISLIKE'])  # 50% chance of like, 50% dislike
            
            tip_like = TipLikes(
                user=user,
                tip=tip,
                reaction_type=reaction_type,
                date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            )
            tip_like.save()
            
            # Update tip counters
            if reaction_type == 'LIKE':
                tip.like_count += 1
            else:
                tip.dislike_count += 1
          # Save the updated counts
        tip.save()

    # POST LIKES AND DISLIKES
    for post in posts + test_user_posts:
        # Randomly select users who will react to this post
        reacting_users = random.sample(
            users, 
            random.randint(0, min(len(users), 30))  # Maximum 30 users per post or all users if less
        )
        
        for user in reacting_users:
            # Decide if the user will like or dislike
            reaction_type = random.choice(['LIKE', 'DISLIKE'])  # 50% chance of like, 50% dislike
            
            post_like = PostLikes(
                user=user,
                post=post,
                reaction_type=reaction_type,
                date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            )
            post_like.save()
            
            # Update post counters
            if reaction_type == 'LIKE':
                post.like_count += 1
            else:
                post.dislike_count += 1
        
        # Save the updated counts
        post.save()

    # ACHIEVEMENTS
    achievements = []
    for i in range(num_achievements):
        achievement = Achievements(
            title=fake.sentence(),
            description=fake.text(),
            icon=fake.image_url(),
        )
        achievement.save()
        achievements.append(achievement)

    # USER ACHIEVEMENTS
    user_achievements = []
    for user in users:
        sampled_achievements = random.sample(achievements, random.randint(0, num_achievements))
        for achievement in sampled_achievements:
            user_achievement = UserAchievements(
                user=user,
                achievement=achievement,
                earned_at=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            )
            user_achievement.save()
            user_achievements.append(user_achievement)

    # CHALLENGES
    challenges = []
    for i in range(num_challenges):
        challenge_title = fake.sentence(nb_words=2)
        completion_achievement = Achievements(
            title=f"Completed {challenge_title}",
            description=f"Given for completing '{challenge_title}' challenge.",
            icon=fake.image_url(),
        )
        completion_achievement.save()
        challenge = Challenge(
            title=challenge_title,
            description=fake.text(),
            target_amount=random.uniform(max_challenge_target_amount // 10, max_challenge_target_amount),
            current_progress=random.uniform(0, 100),
            is_public=random.choice([True, False]),
            reward=completion_achievement,
            creator=random.choice(users),
        )
        challenge.save()
        challenges.append(challenge)

    # USER CHALLENGES
    for challenge in challenges:
        if challenge.is_public:
            # For public challenges, any user can join
            chosen_users = random.sample(users, random.randint(1, len(users)))
            for user in chosen_users:
                user_challenge = UserChallenge(
                    user=user,
                    challenge=challenge,
                    joined_date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
                )
                user_challenge.save()
        else:
            # For private challenges, only the creator can join
            user_challenge = UserChallenge(
                user=challenge.creator,
                challenge=challenge,
                joined_date=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            )
            user_challenge.save()

    # REPORTS
    comment_ct = ContentType.objects.get_for_model(Comments)
    post_ct = ContentType.objects.get_for_model(Posts)
    challenge_ct = ContentType.objects.get_for_model(Challenge)
    user_ct = ContentType.objects.get_for_model(Users)
    tip_ct = ContentType.objects.get_for_model(Tips)

    medias = [
        (comment_ct, comments),
        (post_ct, posts),
        (challenge_ct, challenges),
        (user_ct, users),
        (tip_ct, tips),
    ]

    for media_ct, media in medias:
        for _ in range(int(len(media) * reported_content_percent)):
            media_instance = random.choice(media)
            report = Report(
                content_type=media_ct,
                object_id=media_instance.id,
                reporter=random.choice(users),
                reason=random.choice(Report.REPORT_REASON_CHOICES)[0],
                description=fake.sentence(),
                date_reported=fake.date_time_this_year(tzinfo=timezone.get_current_timezone()),
            )
            report.save()


class Command(BaseCommand):
    help = 'Generate mock data'

    def handle(self, *args, **kwargs):
        generate_mock_data(
            num_users=100,
            num_posts=100,
            num_max_comments_per_post=7,
            num_tips=10,
            num_max_wastes_per_user=30,
            num_achievements=10,
            num_challenges=50,
            max_challenge_target_amount=50,
            reported_content_percent=0.05,
        )
