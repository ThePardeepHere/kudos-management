from django.urls import path

from kudos_app.views.kudos_views import (
    GiveKudosView,
    UserKudosHistoryView,
    OrganizationKudosLeaderboardView,
    ReceivedKudosView
)

urlpatterns = [
    path('give/', GiveKudosView.as_view(), name='give-kudos'),
    path('history/', UserKudosHistoryView.as_view(), name='kudos-history'),
    path('received/', ReceivedKudosView.as_view(), name='kudos-received'),
    path('leaderboard/', OrganizationKudosLeaderboardView.as_view(), name='kudos-leaderboard'),
]