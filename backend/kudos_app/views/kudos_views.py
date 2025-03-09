from django.db import transaction
from django.db.models import Count, Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from accounts.models import User
from accounts.serializers.user_serializers import UserListSerializer
from kudos_app.models import Kudos
from kudos_app.serializers.kudos_serializers import (
    KudosCreateSerializer,
    KudosDetailSerializer, KudosLeaderboardSerializer
)
from utils_app.utils import (
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    api_response,
    CustomPagination
)


class GiveKudosView(APIView):
    """
    API view for giving kudos to another user
    """
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = KudosCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            try:
                kudos = serializer.save(
                    sender=request.user,
                    created_by=request.user
                )
                request.user.kudos_available -= 1
                request.user.save()
                
                detail_serializer = KudosDetailSerializer(kudos)
                return api_response(
                    SUCCESS_MESSAGES["CREATE"],
                    data=detail_serializer.data
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

class UserKudosHistoryView(APIView):
    """
    API view for viewing kudos history of the logged-in user
    """
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            kudos_given = Kudos.objects.filter(
                sender=request.user,
                is_active=True
            ).select_related('sender', 'receiver').order_by('-created_at')
            
            paginator = self.pagination_class()
            paginated_kudos = paginator.paginate_queryset(kudos_given, request)
            serializer = KudosDetailSerializer(paginated_kudos, many=True)
            
            return paginator.get_paginated_response(serializer.data)
            
        except Exception as e:
            return api_response(
                ERROR_MESSAGES["SERVER_ERROR"],
                errors={"detail": str(e)}
            )

class OrganizationKudosLeaderboardView(APIView):
    """
    API view for viewing organization users sorted by kudos received
    """
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            users = User.objects.filter(
                organization=request.user.organization,
                is_active=True
            ).annotate(
                kudos_received_count=Count(
                    'received_kudos',
                    filter=Q(received_kudos__is_active=True)
                )
            ).order_by('-kudos_received_count')

            paginator = self.pagination_class()
            paginated_users = paginator.paginate_queryset(users, request)
            serializer = KudosLeaderboardSerializer(paginated_users, many=True)
            
            return paginator.get_paginated_response(serializer.data)
            
        except Exception as e:
            return api_response(
                ERROR_MESSAGES["SERVER_ERROR"],
                errors={"detail": str(e)}
            )

class ReceivedKudosView(APIView):
    """
    API view for viewing kudos received by the logged-in user
    """
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination

    def get(self, request):
        try:
            kudos_received = Kudos.objects.filter(
                receiver=request.user,
                is_active=True
            ).select_related('sender', 'receiver').order_by('-created_at')
            
            paginator = self.pagination_class()
            paginated_kudos = paginator.paginate_queryset(kudos_received, request)
            serializer = KudosDetailSerializer(paginated_kudos, many=True)
            
            return paginator.get_paginated_response(serializer.data)
            
        except Exception as e:
            return api_response(
                ERROR_MESSAGES["SERVER_ERROR"],
                errors={"detail": str(e)}
            ) 