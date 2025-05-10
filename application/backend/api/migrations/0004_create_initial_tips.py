# Generated manually for creating initial tips

from django.db import migrations

def create_initial_tips(apps, schema_editor):
    Tips = apps.get_model('api', 'Tips')
    initial_tips = [
        {
            'text': 'Reduce your use of single-use plastics by carrying reusable bags, water bottles, and food containers.',
            'like_count': 0,
            'dislike_count': 0
        },
        {
            'text': 'Start composting food scraps to reduce waste and create nutrient-rich soil for your garden.',
            'like_count': 0,
            'dislike_count': 0
        },
        {
            'text': 'Choose products with minimal packaging or recyclable packaging when shopping.',
            'like_count': 0,
            'dislike_count': 0
        },
        {
            'text': 'Donate or sell items you no longer need instead of throwing them away.',
            'like_count': 0,
            'dislike_count': 0
        },
        {
            'text': 'Fix and repair items when possible instead of replacing them.',
            'like_count': 0,
            'dislike_count': 0
        }
    ]
    
    for tip_data in initial_tips:
        Tips.objects.create(**tip_data)

def delete_initial_tips(apps, schema_editor):
    Tips = apps.get_model('api', 'Tips')
    Tips.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_create_waste_types'),
    ]

    operations = [
        migrations.RunPython(create_initial_tips, delete_initial_tips),
    ]