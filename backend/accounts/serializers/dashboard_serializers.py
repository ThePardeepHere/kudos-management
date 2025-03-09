from rest_framework import serializers

class DashboardStatsSerializer(serializers.Serializer):
    total_team_members = serializers.IntegerField()
    total_kudos_received = serializers.IntegerField()
    total_kudos_sent = serializers.IntegerField()