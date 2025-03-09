from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from .test_base import AccountsTestCase

User = get_user_model()

class UserProfileViewsTests(AccountsTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.user = User.objects.get(email='test@example.com')
        self.client.force_authenticate(user=self.user)
        self.profile_url = reverse('user-profile')
     

    def test_retrieve_profile(self):
        """Test retrieving user profile"""
        response = self.client.get(self.profile_url)
      
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['profile']['email'], 'test@example.com')
        self.assertEqual(response.data['data']['profile']['first_name'], 'Test')

    def test_update_profile(self):
        """Test updating user profile"""
        payload = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        response = self.client.patch(self.profile_url, payload)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, payload['first_name'])
        self.assertEqual(self.user.last_name, payload['last_name'])

    def test_unauthorized_profile_access(self):
        """Test unauthorized access to profile"""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) 