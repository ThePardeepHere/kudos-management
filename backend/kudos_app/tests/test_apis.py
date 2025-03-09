from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from kudos_app.models import Kudos
from accounts.models import User
from django.utils import timezone
from datetime import timedelta

class KudosAPITests(APITestCase):
    fixtures = ['fixtures/test_data.json']

    def setUp(self):
        self.client = APIClient()
        # Get users from fixtures
        self.sender = User.objects.get(email="test@example.com")  # org_owner
        self.receiver = User.objects.get(email="member@example.com")  # org_member
        self.admin = User.objects.get(email="admin@example.com")  # admin
        self.other_org_user = User.objects.get(email="other@example.com")  # different org

        self.client.force_authenticate(user=self.sender)

        # API endpoints
        self.give_kudos_url = reverse('give-kudos')
        self.history_url = reverse('kudos-history')
        self.received_url = reverse('kudos-received')
        self.leaderboard_url = reverse('kudos-leaderboard')

    def test_give_kudos_api(self):
        """Test giving kudos API"""
        # Test successful kudos giving
        data = {
            'receiver': self.receiver.id,
            'message': 'Great work on the project implementation!'
        }
        response = self.client.post(self.give_kudos_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

      
        self.assertEqual(response.data['data']['sender']['id'], self.sender.id)
        self.assertEqual(response.data['data']['receiver']['id'], self.receiver.id)
        self.assertEqual(response.data['data']['message'], data['message'])

        # Test validation errors
     

    def test_kudos_history_api(self):
        """Test kudos history API"""
        # Create test kudos
       

        # Test history listing
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']),2)

        # Test history with date filters
        today = timezone.now().date()
        response = self.client.get(
            f"{self.history_url}?start_date={today}&end_date={today}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 2)

      

    def test_received_kudos_api(self):
        """Test received kudos API"""
        # Create test kudos received by sender
        kudos1 = Kudos.objects.create(
            sender=self.receiver,
            receiver=self.sender,
            message="Thanks for the help!",
            created_by=self.receiver
        )
        kudos2 = Kudos.objects.create(
            sender=self.admin,
            receiver=self.sender,
            message="Great leadership!",
            created_by=self.admin
        )

        # Test received kudos listing
        response = self.client.get(self.received_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']),4)

        # Test with date filters
        today = timezone.now().date()
        response = self.client.get(
            f"{self.received_url}?start_date={today}&end_date={today}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 4)

     

    def test_kudos_leaderboard_api(self):
        """Test kudos leaderboard API"""
        # Create multiple kudos for leaderboard
        for _ in range(3):
            Kudos.objects.create(
                sender=self.sender,
                receiver=self.receiver,
                message="Great work!",
                created_by=self.sender
            )
        
        for _ in range(2):
            Kudos.objects.create(
                sender=self.admin,
                receiver=self.sender,
                message="Excellent job!",
                created_by=self.admin
            )

        response = self.client.get(self.leaderboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
      
        # Verify leaderboard structure and data
        self.assertIn('Data retrieved successfully', response.data.get('message'))
        self.assertEqual(3, response.data.get('count'))
      
        # Verify leaderboard order
        leader_board_list = response.data['data']
        print(f"leader_board_list: {leader_board_list}")
        self.assertEqual(leader_board_list[0]['id'], 1)
        self.assertEqual(leader_board_list[0]['kudos_received_count'],4)

       
        self.assertEqual(leader_board_list[1]['id'],4)
        self.assertEqual(leader_board_list[1]['kudos_received_count'],4)

        self.assertEqual(leader_board_list[2]['id'],2)
        self.assertEqual(leader_board_list[2]['kudos_received_count'],2)


    def test_api_authentication(self):
        """Test API authentication requirements"""
        self.client.force_authenticate(user=None)

        # Test give kudos without auth
        response = self.client.post(self.give_kudos_url, {
            'receiver': self.receiver.id,
            'message': 'Test message'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test history without auth
        response = self.client.get(self.history_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test received without auth
        response = self.client.get(self.received_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Test leaderboard without auth
        response = self.client.get(self.leaderboard_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_organization_isolation(self):
        """Test organization data isolation"""
        # Switch to other organization user
        self.client.force_authenticate(user=self.other_org_user)

        # Test leaderboard shows only own organization
        response = self.client.get(self.leaderboard_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify no data from other organization is visible
        top_receivers = response.data['data']
        receiver_ids = [user['id'] for user in top_receivers]
        self.assertNotIn(self.receiver.id, receiver_ids)
        self.assertNotIn(self.sender.id, receiver_ids)

    def test_kudos_history_filters(self):
        """Test kudos history filters"""
        # Create kudos with different dates
        past_date = timezone.now() - timedelta(days=7)
        
        kudos_past = Kudos.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            message="Past message",
            created_by=self.sender,
            created_at=past_date
        )

        kudos_present = Kudos.objects.create(
            sender=self.sender,
            receiver=self.receiver,
            message="Present message",
            created_by=self.sender
        )

        # Test date filtering
        past_date_str = past_date.date().isoformat()
        today_str = timezone.now().date().isoformat()

        # Test past date
        response = self.client.get(f"{self.history_url}?start_date={past_date_str}&end_date={past_date_str}")
        self.assertEqual(len(response.data['data']), 4)
     

        # Test present date
        response = self.client.get(f"{self.history_url}?start_date={today_str}&end_date={today_str}")
        self.assertEqual(len(response.data['data']), 4)
   