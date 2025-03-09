from django.urls import path
from accounts.views.auth_views import UserSignupView, UserLoginView, CustomTokenRefreshView, LogoutAPIView
from accounts.views.user_profile_views import UserProfileView, ChangePasswordView
from accounts.views.organization_views import OrganizationListView, AddOrganizationUserView
from accounts.views.dashboard_views import DashboardStatsView
urlpatterns = [
    path('signup/', UserSignupView.as_view(), name='user-signup'),
    path('login/', UserLoginView.as_view(), name='user-login'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', LogoutAPIView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='user-profile'),
    path('profile/change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('organizations/', OrganizationListView.as_view(), name='organization-list'),
    path('organizations/users/add/', AddOrganizationUserView.as_view(), name='add-organization-user'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
