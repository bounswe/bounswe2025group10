from django.core.management.base import BaseCommand

from api.account_deletion import process_due_account_deletions


class Command(BaseCommand):
    help = "Permanently delete accounts whose deletion grace period has elapsed."

    def handle(self, *args, **options):
        deleted = process_due_account_deletions()
        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted} account(s)."))

