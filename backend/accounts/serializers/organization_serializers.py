from django.contrib.auth.models import Group
from django.db import transaction
from rest_framework import serializers

from accounts.models import User, Organization
from accounts.serializers.auth_serializers import UserMinimalSerializer


class OrganizationDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for retrieving detailed organization information
    """
    created_by = UserMinimalSerializer(read_only=True)
    updated_by = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'created_at', 'updated_at',
            'is_active', 'created_by', 'updated_by',
        ]


class OrganizationListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing organizations with minimal information
    """
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = ['id', 'name', 'created_at', 'is_active', 'user_count']

    def get_user_count(self, obj):
        return obj.users.count()


class AddOrganizationUserSerializer(serializers.Serializer):
    """
    Serializer for adding new users to the organization
    """
    first_name = serializers.CharField(required=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        # Check if passwords match
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords don't match"})

        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists"})

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        organization = request.user.organization
        email = validated_data.get('email')

        try:
            with transaction.atomic():
                # Create the user
                user = User.objects.create_user(
                    first_name=validated_data.get('first_name'),
                    username=email,
                    email=email,
                    password=validated_data['password'],
                    created_by=request.user
                )

                # Use the organization's add_user method
                organization.add_user(user)

                # Assign the org_member role to the user
                member_group = Group.objects.get(name='org_member')
                user.groups.add(member_group)

                return user

        except Group.DoesNotExist:
            raise serializers.ValidationError(
                {"non_field_errors": "Required user role group does not exist"}
            )
        except Exception as e:
            raise serializers.ValidationError(
                {"non_field_errors": f"User creation failed: {str(e)}"}
            )
