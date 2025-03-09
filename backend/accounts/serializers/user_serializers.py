from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from datetime import timedelta
from accounts.models import User
from accounts.serializers.group_serializers import GroupMinimalSerializer
from accounts.serializers.organization_serializers import OrganizationDetailSerializer


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving user profile information
    """
    kudos_available = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
   
    def validate_email(self, value):
        """
        Check if email is unique
        """
        user = self.context.get('request').user
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("This email is already in use.")
        return value

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'kudos_available', 'is_active']


class UserProfileRetrieveSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving user profile information
    """
    role = serializers.SerializerMethodField()
    organization = OrganizationDetailSerializer(read_only=True)
    groups = serializers.SerializerMethodField()
    next_kudos_reset = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'organization', 'role', 'kudos_available', 'is_active', 'groups','next_kudos_reset'
        ]
        read_only_fields = ['id', 'username', 'organization', 'role', 'kudos_available']

    def get_role(self, obj):
        """Get the user's role (first group)"""
        group = obj.groups.first()
        if group:
            return group.name

        return None
    def get_next_kudos_reset(self, obj):
        """Get the next kudos reset date"""
        return obj.last_kudos_reset + timedelta(days=7)

    def get_groups(self, obj):
        return GroupMinimalSerializer(obj.groups.first(), many=False).data


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change endpoint
    """
    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        """
        Validate that the new password and confirm password match
        """
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": ["New password and confirm password do not match."]
            })

        # Get the user from the context
        user = self.context.get('request').user

        # Validate password complexity using Django's password validators
        try:
            validate_password(data['new_password'], user)
        except ValidationError as e:
            raise serializers.ValidationError({
                "new_password": list(e)
            })

        return data


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing users with essential information
    """
    organization = serializers.CharField(source='organization.name', read_only=True)
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'organization', 'role', 'is_active']

    def get_role(self, obj):
        group = obj.groups.first()
        return group.name if group else None
