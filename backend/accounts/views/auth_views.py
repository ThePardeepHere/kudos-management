from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.serializers.auth_serializers import UserSignupSerializer, UserLoginSerializer, \
    CustomTokenRefreshSerializer, LogoutSerializer
from accounts.serializers.user_serializers import UserProfileRetrieveSerializer
from utils_app.utils import (
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    AUTH_MESSAGES,
    api_response
)

User = get_user_model()

class UserSignupView(APIView):
    """
    API view for user registration
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Create a new user account
        """

        serializer = UserSignupSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                user = serializer.save()
                # Use the profile serializer to return user data without password
                profile_serializer = UserProfileRetrieveSerializer(user)
                
                return api_response(
                    AUTH_MESSAGES["SIGNUP_SUCCESS"],
                    data=profile_serializer.data
                )
            except Exception as e:
                # Handle any errors during user creation
                error_detail = str(e)

                return api_response(
                    ERROR_MESSAGES["SERVER_ERROR"],
                    errors={"detail": error_detail}
                )
        else:
            # Format validation errors properly
            error_detail = serializer.errors

            return api_response(
                ERROR_MESSAGES["VALIDATION"],
                errors={"detail": error_detail}
            )

class UserLoginView(APIView):
    """
    API view for user login with JWT authentication
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Authenticate user and return tokens with user details
        """
        serializer = UserLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Get user profile data
            profile_serializer = UserProfileRetrieveSerializer(user)
            
            # Prepare response data with tokens and user details
            response_data = {
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'expires_in':settings.ACCESS_TOKEN_LIFETIME_SECONDS,
                'user': profile_serializer.data
            }
            
            return api_response(
                AUTH_MESSAGES["LOGIN_SUCCESS"],
                data=response_data
            )
        else:
            # Format validation errors properly
            errors = serializer.errors
            
            # Handle non_field_errors specially if present
            if 'non_field_errors' in errors:
                non_field_errors = errors.pop('non_field_errors')
                formatted_errors = {
                    "detail": non_field_errors[0] if isinstance(non_field_errors, list) else non_field_errors
                }
                # Add remaining field errors
                formatted_errors.update(errors)
            else:
                formatted_errors = errors
                
            return api_response(
                ERROR_MESSAGES["VALIDATION"],
                errors=formatted_errors
            )

class CustomTokenRefreshView(APIView):
    """
    Custom implementation of token refresh that uses our standardized API response format
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Check if refresh_token is missing
        if 'refresh_token' not in request.data:
            return api_response(
                ERROR_MESSAGES["VALIDATION"],
                errors={"detail": "Refresh token is required"}
            )
            
        serializer = CustomTokenRefreshSerializer(data=request.data)
        
        try:
            if serializer.is_valid(raise_exception=True):
                # Get the new tokens from our custom serializer
                return api_response(
                    SUCCESS_MESSAGES["UPDATE"],
                    data=serializer.validated_data
                )
            
            else:
              
                return api_response(
                    ERROR_MESSAGES["VALIDATION"],
                    errors=serializer.errors
                )
        except (TokenError, InvalidToken, ValidationError) as e:
            return api_response(
                ERROR_MESSAGES["TOKEN_INVALID"],
                errors={"detail": "Invalid or expired refresh token"}
            )
        except Exception as e:
            return api_response(
                ERROR_MESSAGES["TOKEN_INVALID"], 
                errors={"detail": str(e)}
            )

class LogoutAPIView(APIView):
    """
    API view for user logout - blacklists the refresh token
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return api_response(AUTH_MESSAGES["LOGOUT_SUCCESS"])
            except Exception as e:
                return api_response(
                    ERROR_MESSAGES["SERVER_ERROR"],
                    errors={"detail": str(e)}
                )
        else:
            return api_response(
                ERROR_MESSAGES["VALIDATION"],
                errors=serializer.errors
            )
