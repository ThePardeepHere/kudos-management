from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from accounts.models import Organization
from .test_base import AccountsTestCase

User = get_user_model()

class OrganizationViewsTests(AccountsTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.user = User.objects.get(email='test@example.com')
        self.client.force_authenticate(user=self.user)
        self.org_list_url = reverse('organization-list')
        self.org_user_add_url = reverse('add-organization-user')
        self.org_data = {
            'name': 'new organization',
            'is_active': True
        }

  

    def test_add_organization_user(self):
        """Test adding a user to an organization"""
        user_data = {   
            'email': 'testPardeep@gmail.com',
            'first_name': 'test',
            'password': 'testpass@123',
            'password_confirm': 'testpass@123',
           
        }
        response = self.client.post(self.org_user_add_url, user_data)
    
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
       
    def test_add_organization_user_invalid_data(self):
        """Test adding a user to an organization with invalid data"""
        user_data = {
            'email': 'test@example.com',
            'password': 'testpass@123',
            'password_confirm': 'testpass@123',
            'first_name': 'test',
            'last_name': 'test',
        }
        response = self.client.post(self.org_user_add_url, user_data)

      
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)
    