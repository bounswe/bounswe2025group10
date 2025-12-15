from django.core.management.base import BaseCommand
from api.models import Badges


class Command(BaseCommand):
    help = 'Creates initial badges for the badge system'

    def handle(self, *args, **kwargs):
        # Define badge criteria for each category and level
        badge_definitions = [
            # PLASTIC badges (criteria in grams)
            {'category': 'PLASTIC', 'level': 1, 'criteria': 1000.0},
            {'category': 'PLASTIC', 'level': 2, 'criteria': 5000.0},
            {'category': 'PLASTIC', 'level': 3, 'criteria': 10000.0},
            {'category': 'PLASTIC', 'level': 4, 'criteria': 25000.0},
            {'category': 'PLASTIC', 'level': 5, 'criteria': 50000.0},
            
            # PAPER badges (criteria in grams)
            {'category': 'PAPER', 'level': 1, 'criteria': 1000.0},
            {'category': 'PAPER', 'level': 2, 'criteria': 5000.0},
            {'category': 'PAPER', 'level': 3, 'criteria': 10000.0},
            {'category': 'PAPER', 'level': 4, 'criteria': 25000.0},
            {'category': 'PAPER', 'level': 5, 'criteria': 50000.0},
            
            # GLASS badges (criteria in grams)
            {'category': 'GLASS', 'level': 1, 'criteria': 1000.0},
            {'category': 'GLASS', 'level': 2, 'criteria': 5000.0},
            {'category': 'GLASS', 'level': 3, 'criteria': 10000.0},
            {'category': 'GLASS', 'level': 4, 'criteria': 25000.0},
            {'category': 'GLASS', 'level': 5, 'criteria': 50000.0},
            
            # METAL badges (criteria in grams)
            {'category': 'METAL', 'level': 1, 'criteria': 1000.0},
            {'category': 'METAL', 'level': 2, 'criteria': 5000.0},
            {'category': 'METAL', 'level': 3, 'criteria': 10000.0},
            {'category': 'METAL', 'level': 4, 'criteria': 25000.0},
            {'category': 'METAL', 'level': 5, 'criteria': 50000.0},
            
            # ELECTRONIC badges (criteria in grams)
            {'category': 'ELECTRONIC', 'level': 1, 'criteria': 500.0},
            {'category': 'ELECTRONIC', 'level': 2, 'criteria': 2000.0},
            {'category': 'ELECTRONIC', 'level': 3, 'criteria': 5000.0},
            {'category': 'ELECTRONIC', 'level': 4, 'criteria': 10000.0},
            {'category': 'ELECTRONIC', 'level': 5, 'criteria': 20000.0},
            
            # OIL&FATS badges (criteria in grams)
            {'category': 'OIL&FATS', 'level': 1, 'criteria': 500.0},
            {'category': 'OIL&FATS', 'level': 2, 'criteria': 2000.0},
            {'category': 'OIL&FATS', 'level': 3, 'criteria': 5000.0},
            {'category': 'OIL&FATS', 'level': 4, 'criteria': 10000.0},
            {'category': 'OIL&FATS', 'level': 5, 'criteria': 20000.0},
            
            # ORGANIC badges (criteria in grams)
            {'category': 'ORGANIC', 'level': 1, 'criteria': 2000.0},
            {'category': 'ORGANIC', 'level': 2, 'criteria': 10000.0},
            {'category': 'ORGANIC', 'level': 3, 'criteria': 25000.0},
            {'category': 'ORGANIC', 'level': 4, 'criteria': 50000.0},
            {'category': 'ORGANIC', 'level': 5, 'criteria': 100000.0},
            
            # TOTAL_WASTE badges (criteria in grams)
            {'category': 'TOTAL_WASTE', 'level': 1, 'criteria': 5000.0},
            {'category': 'TOTAL_WASTE', 'level': 2, 'criteria': 25000.0},
            {'category': 'TOTAL_WASTE', 'level': 3, 'criteria': 50000.0},
            {'category': 'TOTAL_WASTE', 'level': 4, 'criteria': 100000.0},
            {'category': 'TOTAL_WASTE', 'level': 5, 'criteria': 250000.0},
            
            # CONTRIBUTIONS badges (total posts + tips)
            {'category': 'CONTRIBUTIONS', 'level': 1, 'criteria': 5.0},
            {'category': 'CONTRIBUTIONS', 'level': 2, 'criteria': 20.0},
            {'category': 'CONTRIBUTIONS', 'level': 3, 'criteria': 50.0},
            {'category': 'CONTRIBUTIONS', 'level': 4, 'criteria': 100.0},
            {'category': 'CONTRIBUTIONS', 'level': 5, 'criteria': 250.0},
            
            # LIKES_RECEIVED badges
            {'category': 'LIKES_RECEIVED', 'level': 1, 'criteria': 10.0},
            {'category': 'LIKES_RECEIVED', 'level': 2, 'criteria': 50.0},
            {'category': 'LIKES_RECEIVED', 'level': 3, 'criteria': 150.0},
            {'category': 'LIKES_RECEIVED', 'level': 4, 'criteria': 500.0},
            {'category': 'LIKES_RECEIVED', 'level': 5, 'criteria': 1000.0},
        ]

        created_count = 0
        updated_count = 0

        for badge_def in badge_definitions:
            badge, created = Badges.objects.update_or_create(
                category=badge_def['category'],
                level=badge_def['level'],
                defaults={
                    'criteria_value': badge_def['criteria'],
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_count} new badges and updated {updated_count} existing badges.'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'Total badges in system: {Badges.objects.count()}'
            )
        )
