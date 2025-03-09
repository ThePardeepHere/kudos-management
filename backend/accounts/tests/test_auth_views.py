from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from .test_base import AccountsTestCase

User = get_user_model()

class AuthViewsTests(AccountsTestCase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.login_url = reverse('user-login')
        self.register_url = reverse('user-signup')

    def test_user_login_success(self):
        """Test successful user login"""
        payload = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data.get('data'))

    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        payload = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, payload)
        self.assertEqual(response.status_code, 400)

    def test_user_registration_success(self):
        """Test successful user registration"""
        payload = {
            'email': 'JohnNew@gmail.com',
            'password': 'newpass@123',
            'password_confirm': 'newpass@123',
            'first_name': 'John',
            'last_name': 'New',
            'organization_name': 'New Test Organization'
        }
      
        response = self.client.post(self.register_url, payload)
       
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email=payload['email'].lower()).exists())
        user = User.objects.get(email=payload['email'].lower())
        self.assertEqual(user.first_name, payload['first_name'])
        self.assertEqual(user.organization.name, payload['organization_name'].lower())

    def test_user_registration_missing_required_fields(self):
        """Test registration with missing required fields"""
        payload = {
            'email': 'newuser@example.com',
            'password': 'newpass123'
            # missing first_name which is required
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('errors', response.data)

    def test_user_registration_existing_email(self):
        """Test registration with existing email"""
        payload = {
            'email': 'test@example.com',  # Email from fixture
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_registration_invalid_data(self):
        """Test registration with invalid data"""
        payload = {
            'email': 'invalid-email',
            'password': 'short',
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST) 