from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from accounts.models import User

@shared_task
def reset_weekly_kudos():
    """Reset kudos for users exactly after 7 days"""
    now = timezone.now()
    reset_before = now - timedelta(days=7)
    
    with transaction.atomic():
        # Reset kudos for users whose last reset was 7 or more days ago
        users_to_reset = User.objects.filter(
            is_active=True,
            last_kudos_reset__lte=reset_before
        ).select_for_update()
        
        updated = users_to_reset.update(
            kudos_available=3,
            last_kudos_reset=now
        )
    
    return f"Reset kudos for {updated} users" 