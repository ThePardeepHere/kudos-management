from django.db import models
from utils_app.models.base_model import BaseModel
from django.core.cache import cache

class Organization(BaseModel):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

    def get_all_users(self):
        """
        Returns all active users associated with the organization.
        """
        return self.users.filter(is_active=True)

    def add_user(self, user):
        """
        Helper method to add a user to the organization
        """
        user.organization = self
        user.save()

    class Meta:
        ordering = ['-id']
