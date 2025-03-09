from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction
from rest_framework import serializers

from accounts.models import Organization

User = get_user_model()
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
import logging
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken
from core.settings import ACCESS_TOKEN_LIFETIME_SECONDS
from rest_framework_simplejwt.exceptions import TokenError

logger = logging.getLogger(__name__)


class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})
    username = serializers.CharField(required=False)
    organization_name = serializers.CharField(required=True, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'organization_name']
        extra_kwargs = {
            'first_name': {'required': True},
            'email': {'required': True}
        }

    def validate(self, data):
        # Check if passwords match
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match"})
        # Validate email format
        email = data.get('email', '')
        if not email or '@' not in email or '.' not in email:
            raise serializers.ValidationError({"email": "Enter a valid email address"})
        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists"})
        if Organization.objects.filter(name=data["organization_name"].lower()).exists():
            raise serializers.ValidationError({"organization_name": "Organization already exists"})
        # Set username to be the same as email
        data['username'] = data['email']

        return data

    def create(self, validated_data):
        organization_name = validated_data.pop('organization_name')
        validated_data.pop('password_confirm')

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=validated_data['username'],
                    email=validated_data['email'],
                    first_name=validated_data['first_name'],
                    last_name=validated_data['last_name'],
                    password=validated_data['password']
                )

                # Create organization
                organization = Organization.objects.create(
                    name=organization_name.lower(),
                    created_by=user
                )

                # Use the organization's add_user method
                organization.add_user(user)

                # Assign the org_owner role
                owner_group = Group.objects.get(name='org_owner')
                user.groups.add(owner_group)

                return user

        except Exception as e:
            logger.error(f"Registration failed with unexpected error: {str(e)}", exc_info=True)
            raise serializers.ValidationError({"non_field_errors": "User registration failed. Please try again later."})


class UserMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal user information for nested serialization
    """

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        email = data.get('email', '')
        password = data.get('password', '')

        if not email or not password:
            raise serializers.ValidationError(
                {"non_field_errors": "Please provide both email and password."}
            )

        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"non_field_errors": "Invalid credentials. Please try again."}
            )

        # Check password
        if not user.check_password(password):
            raise serializers.ValidationError(
                {"non_field_errors": "Invalid credentials. Please try again."}
            )

        # Check if user is active
        if not user.is_active:
            raise serializers.ValidationError(
                {"non_field_errors": "This account has been deactivated. Please contact support."}
            )

        # Invalidate all previous refresh tokens for this user
        try:
            # Get the outstandingToken model from SimpleJWT

            # Blacklist all outstanding tokens for this user
            tokens = OutstandingToken.objects.filter(user=user)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)
            logger.info(f"Previous tokens blacklisted for user: {user.email}")
        except Exception as e:
            # Log the error but don't prevent login
            logger.error(f"Failed to blacklist previous tokens: {str(e)}", exc_info=True)

        # Add user to validated data for later use
        data['user'] = user
        return data


class CustomTokenRefreshSerializer(serializers.Serializer):
    """
    Custom token refresh serializer that uses refresh_token as the field name
    """
    refresh_token = serializers.CharField(required=True)

    def validate(self, attrs):
        # Create a new dict with the field name expected by SimpleJWT
        refresh_data = {'refresh': attrs['refresh_token']}

        try:
            # Use the TokenRefreshSerializer to validate and get a new access token
            serializer = TokenRefreshSerializer(data=refresh_data)
            serializer.is_valid(raise_exception=True)

            # Get the validated data with the new access token
            data = serializer.validated_data

            # Rename access token field for consistency
            data['access_token'] = data.pop('access')

            # Add the refresh token to the response with consistent naming
            data['refresh_token'] = attrs['refresh_token']

            # Add token expiry information from settings
            data['expires_in'] = ACCESS_TOKEN_LIFETIME_SECONDS

            return data

        except InvalidToken as e:
            raise serializers.ValidationError(
                {"refresh_token": "Invalid or expired refresh token"}
            )
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}", exc_info=True)
            raise serializers.ValidationError(
                {"refresh_token": "Invalid or expired refresh token"}
            )


class LogoutSerializer(serializers.Serializer):
    """
    Serializer for user logout - blacklists the refresh token
    """
    refresh_token = serializers.CharField(required=True)

    def validate(self, attrs):
        self.refresh_token = attrs['refresh_token']
        return attrs

    def save(self, **kwargs):
        try:
            # Attempt to create a RefreshToken object
            refresh = RefreshToken(self.refresh_token)
            # Blacklist the token
            refresh.blacklist()
            return True
        except TokenError as e:
            # Check if the token is already blacklisted
            if "blacklisted" in str(e).lower():
                # Token is already blacklisted, which is fine for logout
                logger.info(f"Token already blacklisted during logout: {str(e)}")
                return True
            else:
                # Other token errors (invalid, expired, etc.)
                logger.error(f"Token error during logout: {str(e)}")
                raise serializers.ValidationError({"refresh_token": "Invalid or expired token"})
        except Exception as e:
            # Log any other unexpected errors
            logger.error(f"Logout error: {str(e)}", exc_info=True)
            raise serializers.ValidationError({"refresh_token": "Invalid token"})
