from dataclasses import replace

from django.core.management.base import BaseCommand
from faker import Faker
import random
from django.utils import timezone
from django.db import transaction
from django.contrib.auth.hashers import make_password
from django.contrib.contenttypes.models import ContentType

from api.models import Users, Achievements, UserAchievements, Posts, Comments, Tips, Waste, UserWastes, Report
from challenges.models import Challenge, UserChallenge

fake = Faker()

def generate_mock_data(
    num_users=10,
    num_posts=10,
    num_max_comments_per_post=10,
    num_tips=10,
    num_max_wastes_per_user=10,
    num_achievements=10,
    num_challenges=10,
    max_challenge_target_amount=10,
    num_reports=10
):
    # USERS
    users = []

    generated_usernames = set()
    generated_emails = set()
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
                date=fake.date_time_between(start_date=post.date, end_date=timezone.now(), tzinfo=timezone.get_current_timezone()),
            )
            comments.append(comment)
    Comments.objects.bulk_create(comments)

     # TIPS
    tips = []
    for i in range(num_tips):
        tip = Tips(
            text=fake.text(),
            like_count=random.randint(0, 100),
            dislike_count=random.randint(0, 20),
        )
        tips.append(tip)
    Tips.objects.bulk_create(tips)

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
                user_wastes.append(user_waste)
    UserWastes.objects.bulk_create(user_wastes)

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
            user_achievements.append(user_achievement)
    UserAchievements.objects.bulk_create(user_achievements) 

 # CHALLENGES
    challenges = []
    for i in range(num_challenges):
        challenge = Challenge(
            title=fake.sentence(),
            description=fake.text(),
            target_amount=random.uniform(max_challenge_target_amount//10, max_challenge_target_amount),
            current_progress=random.uniform(0, 100),
            is_public=random.choice([True, False]),
            reward=random.choice(achievements),
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
    # Only create reports if we have comments to report
    if comments:
        # Save comments to ensure they all have valid IDs
        if any(not getattr(comment, 'id', None) for comment in comments):
            Comments.objects.bulk_create([c for c in comments if not getattr(c, 'id', None)])
            # Refresh comments list with saved objects that have valid IDs
            comments = list(Comments.objects.all())
        
        # Now create reports
        comment_ct = ContentType.objects.get_for_model(Comments)
        reports = []
        for _ in range(min(num_reports, len(comments))):  # Don't try to create more reports than comments
            comment = random.choice(comments)
            report = Report(
                content_type=comment_ct,
                object_id=comment.id,  # This should now be valid
                reporter=random.choice(users),
                reason=random.choice(Report.REPORT_REASON_CHOICES)[0],
                description=fake.sentence(),
                date_reported=fake.date_time_this_year(),
            )
            reports.append(report)
        
        if reports:
            Report.objects.bulk_create(reports)



class Command(BaseCommand):
    help = 'Generate mock data'

    def handle(self, *args, **kwargs):
        generate_mock_data(
            num_users=100,
            num_posts=1000,
            num_max_comments_per_post=7,
            num_tips=10,
            num_max_wastes_per_user=50,
            num_achievements=10,
            num_challenges=200,
            max_challenge_target_amount=50,
            num_reports=50,
        )
