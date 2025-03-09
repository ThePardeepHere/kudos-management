from rest_framework import serializers

from accounts.models import User
from kudos_app.models import Kudos
from accounts.serializers.user_serializers import UserListSerializer

class KudosCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Kudos
        fields = ['receiver', 'message']

    def validate_receiver(self, value):
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required")
        
        # Check if receiver is from same organization
        if value.organization != request.user.organization:
            raise serializers.ValidationError("Can only give kudos to users in your organization")
        
        # Check if sender has kudos available
        if request.user.kudos_available <= 0:
            raise serializers.ValidationError("No kudos available to give")
            
        # Prevent self-kudos
        if value == request.user:
            raise serializers.ValidationError("Cannot give kudos to yourself")
            
        return value

class KudosDetailSerializer(serializers.ModelSerializer):
    sender = UserListSerializer(read_only=True)
    receiver = UserListSerializer(read_only=True)
    
    class Meta:
        model = Kudos
        fields = ['id', 'sender', 'receiver', 'message', 'created_at']


class KudosLeaderboardSerializer(serializers.ModelSerializer):
    kudos_received_count = serializers.IntegerField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'kudos_received_count']


    
 