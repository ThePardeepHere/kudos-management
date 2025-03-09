import json
from datetime import datetime, timedelta
import pytz
import random
import os
import django
import sys
from pathlib import Path


# Add the project root directory to the Python path
project_root = str(Path(__file__).resolve().parent.parent)
sys.path.append(project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.contrib.auth.models import Group
from django.contrib.auth.hashers import make_password

def generate_fixtures():
    now = datetime.now(pytz.UTC)
    today = now.strftime('%Y-%m-%dT%H:%M:%SZ')
    
    # Generate random timestamps for kudos (last 30 days)
    kudos_dates = []
    for _ in range(30):
        random_days = random.randint(0, 30)
        random_hours = random.randint(9, 17)
        random_minutes = random.randint(0, 59)
        random_date = now - timedelta(days=random_days)
        random_date = random_date.replace(hour=random_hours, minute=random_minutes)
        kudos_dates.append(random_date.strftime('%Y-%m-%dT%H:%M:%SZ'))
    
    kudos_dates.sort()

    fixtures = []
    
    # Check and add groups only if they don't exist
    existing_groups = {group.name: group.id for group in Group.objects.all()}
    group_fixtures = []
    next_group_id = 1

    for group_name in ['org_owner', 'org_member']:
        if group_name not in existing_groups:
            group_fixtures.append({
                "model": "auth.group",
                "pk": next_group_id,
                "fields": {
                    "name": group_name
                }
            })
            existing_groups[group_name] = next_group_id
            next_group_id += 1

    fixtures.extend(group_fixtures)

    # Add organization with created_by reference to admin user (will be set later)
    fixtures.append({
        "model": "accounts.organization",
        "pk": 1,
        "fields": {
            "name": "mitratech",
            "created_at": today,
            "updated_at": today,
            "is_active": True,

            "created_by": 1  # Will be the admin user
        }
    })

    # User fixtures with admin user first
    users = [
       
        {
            "username": "john@mitratech.com",
            "first_name": "John",
            "last_name": "Doe",
            "group_name": "org_owner",
            "is_staff": False,

            "is_superuser": False
        },
        {
            "username": "jane@mitratech.com",
            "first_name": "Jane",
            "last_name": "Smith",
            "group_name": "org_member",
            "is_staff": False,
            "is_superuser": False
        },
        {
            "username": "bob@mitratech.com",
            "first_name": "Bob",
            "last_name": "Wilson",
            "group_name": "org_member",
            "is_staff": False,
            "is_superuser": False
        },
        {
            "username": "alice@mitratech.com",
            "first_name": "Alice",
            "last_name": "Brown",
            "group_name": "org_member",
            "is_staff": False,
            "is_superuser": False
        }
    ]

    # Create users with admin user having ID 1
    for i, user in enumerate(users, 1):
        user_fixture = {
            "model": "accounts.user",
            "pk": i,
            "fields": {
                "password": make_password("password123"),
                "last_login": None,
                "is_superuser": user["is_superuser"],
                "username": user["username"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
                "email": user["username"],
                "is_staff": user["is_staff"],
                "is_active": True,
                "date_joined": today,
                "created_at": today,
                "updated_at": today,
                "organization": 1,
                "kudos_available": 3,
                "groups": [existing_groups[user["group_name"]]],
                "created_by": 1  # All users created by admin
            }
        }
        fixtures.append(user_fixture)

    # Kudos messages
    kudos_messages = [
        "Great work on the project presentation! Your attention to detail really made it stand out.",
        "Thanks for helping with the code review. Your thorough feedback helped improve the code quality significantly.",
        "Excellent debugging skills on that tricky production issue. You saved us hours of downtime!",
        "Thank you for mentoring the new team members. Your patience and guidance are truly appreciated.",
        "Outstanding work on the API documentation. It's so clear and comprehensive now.",
        "Great collaboration on the feature implementation. Your teamwork made this sprint a success!",
        "Thanks for the quick response to the urgent client issue. You really went above and beyond.",
        "Excellent presentation at the team meeting. You made complex concepts easy to understand.",
        "Great job optimizing those database queries. The performance improvement is remarkable!",
        "Thanks for organizing the team building event. It really helped boost team morale.",
        "Excellent work on implementing the security improvements. Your proactive approach to security is invaluable.",
        "Thanks for stepping up during the deployment process. Your leadership made it smooth and stress-free.",
        "Impressive problem-solving skills on the recent technical challenge!",
        "Thank you for your valuable contributions to the code base.",
        "Outstanding work on improving test coverage!",
        "Great initiative in streamlining our development process.",
        "Excellent mentorship to junior developers.",
        "Thanks for the thorough code documentation.",
        "Amazing work on the performance optimization!",
        "Great job leading the sprint planning.",
        "Thanks for sharing your knowledge in the tech talk.",
        "Excellent work on the UI/UX improvements.",
        "Outstanding contribution to the team's success.",
        "Thanks for your help in debugging the production issue.",
        "Great work on implementing the new feature set.",
        "Excellent job on the system architecture design.",
        "Thanks for maintaining high code quality standards.",
        "Outstanding work on the database optimization.",
        "Great collaboration with the product team.",
        "Thanks for your dedication to the project!"
    ]

    random.shuffle(kudos_messages)

    # Generate kudos with proper created_by attribution
    for i, (date, message) in enumerate(zip(kudos_dates, kudos_messages), 1):
        # Exclude admin from regular kudos exchange
        sender_id = random.randint(2, len(users))  # Start from 2 to skip admin
        receiver_id = random.randint(2, len(users))
        while receiver_id == sender_id:
            receiver_id = random.randint(2, len(users))

        fixtures.append({
            "model": "kudos_app.kudos",
            "pk": i,
            "fields": {
                "sender": sender_id,
                "receiver": receiver_id,
                "message": message,
                "created_at": date,
                "updated_at": date,
                "is_active": True,
                "created_by": sender_id,  # Kudos created by the sender

            }
        })

    # Write to file
    os.makedirs('fixtures', exist_ok=True)
    with open('fixtures/initial_data.json', 'w') as f:
        json.dump(fixtures, f, indent=2)
        print(f"Generated fixtures with {len(fixtures)} records")
        print(f"Admin user created with ID 1 and email: admin@mitratech.com")
        if group_fixtures:
            print(f"Created new groups: {[f['fields']['name'] for f in group_fixtures]}")
        else:
            print("No new groups needed - using existing groups")

if __name__ == "__main__":
    generate_fixtures() 