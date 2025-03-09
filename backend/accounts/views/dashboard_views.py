from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count

from accounts.serializers.dashboard_serializers import DashboardStatsSerializer
from kudos_app.models import Kudos
from accounts.models import User
from utils_app.utils import (
    SUCCESS_MESSAGES,
    ERROR_MESSAGES,
    api_response
)

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Get user's organization
            organization = request.user.organization

            # Calculate stats
            stats = {
                'total_team_members': User.objects.filter(organization=organization).count(),
                'total_kudos_received': Kudos.objects.filter(receiver=request.user).count(),
                'total_kudos_sent': Kudos.objects.filter(sender=request.user).count(),
            }

            serializer = DashboardStatsSerializer(stats)
            return api_response(
                SUCCESS_MESSAGES["RETRIEVE"],
                data=serializer.data
            )
        except Exception as e:
            return api_response(
                ERROR_MESSAGES["SERVER_ERROR"],
                errors={"detail": str(e)}
            )