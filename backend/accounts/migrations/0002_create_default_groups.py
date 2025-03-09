from django.db import migrations

def create_groups(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    
    # Create the groups
    Group.objects.get_or_create(name='org_owner')
    Group.objects.get_or_create(name='org_member')

def reverse_func(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.filter(name__in=['org_owner', 'org_member']).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_groups, reverse_func),
    ] 