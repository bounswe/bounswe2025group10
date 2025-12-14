# Migration to remove badge-related columns from Achievements table

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0016_badges_userbadges'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE `Achievements` 
                DROP COLUMN `category`,
                DROP COLUMN `level`,
                DROP COLUMN `criteria_value`;
            """,
            reverse_sql="""
                ALTER TABLE `Achievements`
                ADD COLUMN `category` VARCHAR(50) NOT NULL,
                ADD COLUMN `level` INT NOT NULL,
                ADD COLUMN `criteria_value` DOUBLE NOT NULL;
            """,
        ),
    ]
