from rest_framework.permissions import BasePermission

class IsOrganizationOwner(BasePermission):
    """
    Custom permission to only allow organization owners to perform certain actions.
    """
    message = "Only organization owners can perform this action"

    def has_permission(self, request, view):
        return request.user.groups.filter(name='org_owner').exists() 