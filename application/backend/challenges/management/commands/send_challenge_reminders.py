"""
Django management command to send deadline reminder notifications for challenges.

This command should be run periodically (e.g., via cron job or Celery Beat) to check
for challenges with approaching deadlines and notify participants.

Usage:
    python manage.py send_challenge_reminders

Optional arguments:
    --hours HOURS    Number of hours before deadline to send reminders (default: 24)
    --dry-run        Show what would be sent without actually sending notifications
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from challenges.models import Challenge, UserChallenge
from api.models import Users
from notifications.utils import send_bulk_notifications


class Command(BaseCommand):
    help = 'Send reminder notifications for challenges approaching their deadline'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Number of hours before deadline to send reminders (default: 24)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be sent without actually sending notifications',
        )

    def handle(self, *args, **options):
        hours_before = options['hours']
        dry_run = options['dry_run']
        
        now = timezone.now()
        reminder_time = now + timedelta(hours=hours_before)
        
        # Find challenges with deadlines within the reminder window
        # that are not yet completed
        upcoming_challenges = Challenge.objects.filter(
            deadline__isnull=False,
            deadline__gte=now,
            deadline__lte=reminder_time,
            current_progress__lt=F('target_amount')
        ).select_related('reward')
        
        total_notifications = 0
        
        for challenge in upcoming_challenges:
            # Get all participants
            user_challenges = UserChallenge.objects.filter(
                challenge=challenge
            ).select_related('user')
            
            participants = [uc.user for uc in user_challenges]
            
            if not participants:
                continue
            
            # Calculate time remaining
            time_remaining = challenge.deadline - now
            hours_remaining = int(time_remaining.total_seconds() / 3600)
            
            if hours_remaining < 1:
                time_str = f"{int(time_remaining.total_seconds() / 60)} minutes"
            elif hours_remaining < 24:
                time_str = f"{hours_remaining} hours"
            else:
                days_remaining = int(time_remaining.total_seconds() / 86400)
                time_str = f"{days_remaining} days"
            
            # Calculate progress percentage
            progress_pct = (challenge.current_progress / challenge.target_amount * 100) if challenge.target_amount > 0 else 0
            
            message = (
                f"⏰ Reminder: Challenge '{challenge.title}' deadline in {time_str}! "
                f"Current progress: {challenge.current_progress:.1f}/{challenge.target_amount} kg ({progress_pct:.0f}%)"
            )
            
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f"[DRY RUN] Would send to {len(participants)} participants: {message}"
                    )
                )
            else:
                send_bulk_notifications(participants, message)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Sent reminder to {len(participants)} participants for challenge '{challenge.title}'"
                    )
                )
            
            total_notifications += len(participants)
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"\n[DRY RUN] Would send {total_notifications} notifications for {len(upcoming_challenges)} challenges"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\nSent {total_notifications} notifications for {len(upcoming_challenges)} challenges"
                )
            )
