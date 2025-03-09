from django.contrib import admin
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin
from django.apps import apps

# Get all models from all installed apps
app_models = apps.get_models()

# Register all models that aren't already registered
for model in app_models:
    try:
        # Skip models from token_blacklist app and already registered models
        if model._meta.app_label == 'token_blacklist':
            continue
        if not admin.site.is_registered(model):
            # Get all fields with max_length attribute less than 10
            list_display_fields = [field.name for field in model._meta.fields 
                                 if hasattr(field, 'max_length') and 
                                 field.max_length is not None and 
                                 field.max_length < 10]
            
            # Create a custom ModelAdmin class
            class CustomModelAdmin(admin.ModelAdmin):
                list_per_page = 10
                list_display = list_display_fields or ['__str__']  # Fallback to __str__ if no fields found
            
            admin.site.register(model, CustomModelAdmin)
    except admin.sites.AlreadyRegistered:
        pass
