from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from kudos_app.models import Kudos

User = get_user_model()

class AccountsTestCase(TestCase):
    fixtures = ['fixtures/test_data.json']

    @classmethod
    def setUpTestData(cls):
        # Hash the passwords in the fixture data
        for user in User.objects.all():
            user.password = make_password(user.password)
            user.save()

