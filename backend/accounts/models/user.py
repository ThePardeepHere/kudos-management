from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
from accounts.models.organization import Organization
from utils_app.models.base_model import BaseModel
from django.core.exceptions import ValidationError
from django.contrib.auth.models import UserManager

class CustomUserManager(UserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if 'first_name' not in extra_fields:
            raise ValueError('The First name field must be set')
            
        email = self.normalize_email(email)
        # Don't set username in extra_fields since we pass it explicitly
        if 'username' in extra_fields:
            del extra_fields['username']
        user = super().create_user(
            username=email,
            email=email,
            password=password,
            **extra_fields
        )
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser, BaseModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="users", null=True, blank=True)
    kudos_available = models.PositiveIntegerField(default=3)  # Reset every week
    last_kudos_reset = models.DateTimeField(default=timezone.now)
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']

    def __str__(self):
        return self.email

    def clean(self):
        """Clean the model fields"""
        super().clean()
        if not self.email:
            raise ValidationError({'email': 'Email is required'})
        if not self.first_name:
            raise ValidationError({'first_name': 'First name is required'})
            
        self.email = self.email.lower()
        self.username = self.email

    def validate_required_fields(self):
        """Validate that all required fields are present"""
        if not self.email:
            raise ValidationError({'email': 'Email is required'})
        if not self.first_name:
            raise ValidationError({'first_name': 'First name is required'})

    def save(self, *args, **kwargs):
        """Override save to ensure email normalization and validation"""
        self.clean()
        self.validate_required_fields()
        super().save(*args, **kwargs)


    class Meta:
        ordering = ['-id']
        indexes = [
            models.Index(fields=['last_kudos_reset']),
        ]
