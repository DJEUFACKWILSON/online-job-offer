from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'jobs', views.JobOfferViewSet, basename='jobs')
router.register(r'applications', views.ApplicationViewSet, basename='applications')
router.register(r'messages', views.RecruitmentMessageViewSet, basename='messages')

urlpatterns = [
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/verify/<uuid:token>/', views.VerifyEmailView.as_view(), name='verify-email'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('admin-stats/', views.AdminStatsView.as_view(), name='admin-stats'),
    path('notifications/', views.NotificationsView.as_view(), name='notifications'),
    path('', include(router.urls)),
    path('auth/verify-code/', views.VerifyCodeView.as_view(), name='verify-code'),
    
]