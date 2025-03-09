from django.contrib.auth.models import Group
from rest_framework import serializers


class GroupMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal serializer for group information
    """

    class Meta:
        model = Group
        fields = ['id', 'name']
