from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from accounts.models.user import User
from utils_app.models.base_model import BaseModel

class Kudos(BaseModel):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_kudos")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_kudos")
    message = models.TextField()
    
    def __str__(self):
        return f"{self.sender} → {self.receiver}: {self.message[:20]}"

    def clean(self):
        if self.sender == self.receiver:
            raise ValidationError({
                "receiver": "Users cannot give kudos to themselves"
            })
        
        if not self.sender.kudos_available or self.sender.kudos_available <= 0:
            raise ValidationError({
                "sender": "You don't have any kudos available to give"
            })

        # Ensure kudos_available won't go negative
        if self.sender.kudos_available - 1 < 0:
            raise ValidationError({
                "sender": "Insufficient kudos available"
            })

    def save(self, *args, **kwargs):
        if not self.pk:  # Only on creation
            self.full_clean()
            # Get a fresh instance of the sender to avoid race conditions
            sender = User.objects.select_for_update().get(pk=self.sender.pk)
            if sender.kudos_available <= 0:
                raise ValidationError({
                    "sender": "Insufficient kudos available"
                })
            # Decrease available kudos
            sender.kudos_available -= 1
            sender.save(update_fields=['kudos_available'])
        super().save(*args, **kwargs)

    def total_kudos_received(self):
        return self.receiver.received_kudos.count()

    class Meta:
        indexes = [
            models.Index(fields=['sender', 'created_at']),
            models.Index(fields=['receiver', 'created_at']),
        ]

