from django.contrib.auth import get_user_model
from accounts.models import Organization
from django.core.exceptions import ValidationError
from .test_base import AccountsTestCase

User = get_user_model()

class UserModelTests(AccountsTestCase):
    def test_create_user(self):
        """Test creating a new user"""
        user = User.objects.get(email='test@example.com')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertEqual(user.kudos_available, 3)
        self.assertEqual(user.organization.name, 'Test Organization')
        self.assertTrue(user.groups.filter(name='org_owner').exists())

    def test_create_superuser(self):
        """Test superuser exists with correct permissions"""
        admin_user = User.objects.get(email='admin@example.com')
        self.assertTrue(admin_user.is_superuser)
        self.assertTrue(admin_user.is_staff)
        self.assertEqual(admin_user.organization.name, 'Test Organization')
        self.assertTrue(admin_user.groups.filter(name='org_owner').exists())

    def test_user_email_normalized(self):
        """Test email is normalized when creating user"""
        email = 'NEW_USER@EXAMPLE.com'
        user = User.objects.create_user(
            email=email,
            password='test123',
            first_name='New',
            organization_id=1
        )
        self.assertEqual(user.email, email.lower())
        self.assertEqual(user.username, email.lower())

    def test_user_invalid_email(self):
        """Test creating user with no email raises error"""
        with self.assertRaises(ValueError):
            User.objects.create_user(email=None, password='test123')

    def test_duplicate_email(self):
        """Test that duplicate emails are not allowed"""
        with self.assertRaises(Exception):  # Could be IntegrityError or ValidationError
            User.objects.create_user(
                email='test@example.com',  # This email already exists in fixtures
                password='test123',
                first_name='Test',
                organization_id=1
            )

class OrganizationModelTests(AccountsTestCase):
    def test_organization_exists(self):
        """Test organization exists with correct data"""
        org = Organization.objects.get(name='Test Organization')
        self.assertTrue(org.is_active)
        self.assertFalse(org.is_deleted)
        self.assertTrue(org.users.filter(email='test@example.com').exists())

    def test_organization_str(self):
        """Test the organization string representation"""
        org = Organization.objects.get(name='Test Organization')
        self.assertEqual(str(org), org.name) 