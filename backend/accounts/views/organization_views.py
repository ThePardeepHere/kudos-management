from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from accounts.models import Organization, User
from accounts.serializers.organization_serializers import (
    OrganizationListSerializer,
    AddOrganizationUserSerializer
)
from accounts.serializers.user_serializers import UserListSerializer
from utils_app.utils import (
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    api_response,
    CustomPagination,
    IsOrganizationOwner
)

class OrganizationListView(APIView):
    """
    API view for listing organization and its users
    """
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            # Get the organization of the logged-in user
            organization = request.user.organization
            org_serializer = OrganizationListSerializer(organization)
            
            # Use the get_all_users method instead of direct filtering
            users = organization.get_all_users()
            
            paginator = self.pagination_class()
            paginated_users = paginator.paginate_queryset(users, request)
            user_serializer = UserListSerializer(paginated_users, many=True)
            
            return paginator.get_paginated_response(user_serializer.data)
            
        except Exception as e:
            return api_response(
                ERROR_MESSAGES["SERVER_ERROR"],
                errors={"detail": str(e)}
            )

class AddOrganizationUserView(APIView):
    """
    API view for adding new users to the organization
    """
    permission_classes = [IsAuthenticated, IsOrganizationOwner]

    def post(self, request):
        serializer = AddOrganizationUserSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            try:
                user = serializer.save()
                # Use the organization's add_user method
                request.user.organization.add_user(user)
                
                user_serializer = UserListSerializer(user)
                return api_response(
                    SUCCESS_MESSAGES["CREATE"],
                    data=user_serializer.data
                )
            except Exception as e:
                return api_response(
                    ERROR_MESSAGES["SERVER_ERROR"],
                    errors={"detail": str(e)}
                )
        
        return api_response(
            ERROR_MESSAGES["VALIDATION"],
            errors=serializer.errors
        ) 