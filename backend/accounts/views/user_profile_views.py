from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User
from accounts.serializers.user_serializers import (
    UserProfileRetrieveSerializer, 
    UserProfileSerializer,
    ChangePasswordSerializer
)
from utils_app.utils.custom_api_response import api_response
from utils_app.utils.custom_messages import (
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    AUTH_MESSAGES
)


class UserProfileView(APIView):
    """
    API view for retrieving and updating user profile information
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get the current user's profile information"""
        try:
            serializer = UserProfileRetrieveSerializer(request.user)
            print(f"serializer {serializer.data}")
            return api_response(
                SUCCESS_MESSAGES["RETRIEVE"],
                data={"profile": serializer.data}
            )
        except Exception as e:
            return api_response(
                ERROR_MESSAGES["SERVER_ERROR"],
                errors={"detail": str(e)}
            )

    def patch(self, request):
        """Update the current user's profile information"""
        serializer = UserProfileSerializer(
            request.user, 
            data=request.data, 
            partial=True,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return api_response(
                ERROR_MESSAGES["VALIDATION"],
                errors=serializer.errors
            )
        
        try:
            serializer.save()
            return api_response(
                SUCCESS_MESSAGES["UPDATE"],
                data={"profile": serializer.data}
            )
        except Exception as e:
            return api_response(
                ERROR_MESSAGES["SERVER_ERROR"],
                errors={"detail": str(e)}
            )


class ChangePasswordView(APIView):
    """
    API view for changing user password
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Change the current user's password"""
        serializer = ChangePasswordSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return api_response(
                ERROR_MESSAGES["VALIDATION"],
                errors=serializer.errors
            )

        try:
            user = request.user
            
            # Check if current password is correct
            if not user.check_password(serializer.validated_data['current_password']):
                return api_response(
                    ERROR_MESSAGES["UNAUTHORIZED"],
                    errors={'current_password': ['Current password is incorrect']}
                )
            
            # Validate new password
            try:
                validate_password(serializer.validated_data['new_password'], user)
            except ValidationError as e:
                return api_response(
                    ERROR_MESSAGES["VALIDATION"],
                    errors={'new_password': list(e)}
                )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            # Blacklist all tokens for this user to force logout
            try:
                for token in RefreshToken.for_user(user):
                    token.blacklist()
            except Exception as e:
                # Log the error but continue with the password change
                pass
            
            return api_response(
                AUTH_MESSAGES["LOGOUT_SUCCESS"],
                data={
                    "detail": "Password changed successfully. Please log in again with your new password.",
                    "require_login": True
                }
            )
            
        except Exception as e:
            return api_response(
                ERROR_MESSAGES["SERVER_ERROR"],
                errors={"detail": str(e)}
            )


