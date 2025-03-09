from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from kudos_app.models import Kudos
from accounts.models import User

class KudosModelTests(TestCase):
    fixtures = ['fixtures/test_data.json']

    def setUp(self):
        # Get users from fixtures
        self.sender = User.objects.get(email="test@example.com")  # org_owner
        self.receiver = User.objects.get(email="member@example.com")  # org_member
        self.other_org_user = User.objects.get(email="other@example.com")  # different org
        self.admin_user = User.objects.get(email="admin@example.com")  # admin

        self.kudos_data = {
            'sender': self.sender,
            'receiver': self.receiver,
            'message': 'Test kudos message for great work on the project!',
            'created_by': self.sender
        }

    def test_kudos_creation_success(self):
        """Test successful kudos creation with valid data"""
        initial_kudos = self.sender.kudos_available
        kudos = Kudos.objects.create(**self.kudos_data)
        
        self.sender.refresh_from_db()
        self.assertEqual(kudos.sender, self.sender)
        self.assertEqual(kudos.receiver, self.receiver)
        self.assertEqual(kudos.message, self.kudos_data['message'])
        self.assertTrue(kudos.is_active)
        self.assertEqual(self.sender.kudos_available, initial_kudos - 1)

    def test_kudos_str_representation(self):
        """Test the string representation of kudos"""
        kudos = Kudos.objects.create(**self.kudos_data)
        expected = f"{self.sender} → {self.receiver}: {self.kudos_data['message'][:20]}"
        self.assertEqual(str(kudos), expected)

    def test_self_kudos_validation(self):
        """Test validation prevents self-kudos"""
        self.kudos_data['receiver'] = self.sender
        with self.assertRaises(ValidationError) as context:
            Kudos.objects.create(**self.kudos_data)
        self.assertIn('cannot give kudos to themselves', str(context.exception))


    def test_kudos_availability_validation(self):
        """Test validation when sender has no kudos available"""
        self.sender.kudos_available = 0
        self.sender.save()
        
        with self.assertRaises(ValidationError) as context:
            Kudos.objects.create(**self.kudos_data)
        self.assertIn( '{\'sender\': ["You don\'t have any kudos available to give"]}', str(context.exception))



 
    def test_kudos_counts(self):
        """Test kudos counting methods"""
        # Create some test kudos
     
        
        # Create an inactive kudos
        inactive_kudos = Kudos.objects.create(**self.kudos_data)
        inactive_kudos.is_active = False
        inactive_kudos.save()

        kudos = Kudos.objects.first()
        self.assertEqual(kudos.total_kudos_received(), 2)  
       

  
        """Test kudos modification time limit"""
        kudos = Kudos.objects.create(**self.kudos_data)
       

        # Set created_at to 25 hours ago
        kudos.created_at = timezone.now() - timedelta(hours=25)
        kudos.save()
     

    def test_kudos_indexes(self):
        """Test that indexes are properly set up"""
        indexes = [index.fields for index in Kudos._meta.indexes]
        self.assertIn(['sender', 'created_at'], indexes)
        self.assertIn(['receiver', 'created_at'], indexes) 