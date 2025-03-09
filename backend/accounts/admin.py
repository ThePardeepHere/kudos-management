# from django.contrib import admin
# from accounts.models import User, Organization
# from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

# # Unregister the OutstandingToken model to prevent the "already registered" error
# try:
#     from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
#     from django.contrib.admin.sites import site
    
#     # Check if models are registered before attempting to unregister
#     if OutstandingToken in site._registry:
#         site.unregister(OutstandingToken)
#     if BlacklistedToken in site._registry:
#         site.unregister(BlacklistedToken)
# except Exception as e:
#     # Just log the error but don't prevent the app from loading
#     import logging
#     logger = logging.getLogger(__name__)
#     logger.warning(f"Error handling token blacklist admin: {str(e)}")

# # Register your models here
# @admin.register(User)
# class UserAdmin(BaseUserAdmin):
#     list_display = ('email', 'first_name', 'last_name', 'is_active', 'is_staff', 'organization')
#     list_filter = ('is_active', 'is_staff', 'organization')
#     search_fields = ('email', 'first_name', 'last_name')
#     ordering = ('email',)
    
#     fieldsets = (
#         (None, {'fields': ('email', 'password')}),
#         ('Personal info', {'fields': ('first_name', 'last_name', 'username')}),
#         ('Organization', {'fields': ('organization',)}),
#         ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
#         ('Important dates', {'fields': ('last_login', 'date_joined')}),
#     )
    
#     add_fieldsets = (
#         (None, {
#             'classes': ('wide',),
#             'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'organization'),
#         }),
#     )

# @admin.register(Organization)
# class OrganizationAdmin(admin.ModelAdmin):
#     list_display = ('name', 'created_by', 'created_at')
#     search_fields = ('name',)
#     ordering = ('name',)
