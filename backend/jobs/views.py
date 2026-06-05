from rest_framework import generics, viewsets, status, permissions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
import qrcode
import io
import base64
from .models import User, JobOffer, Application, RecruitmentMessage
from .serializers import (
    RegisterSerializer, UserSerializer, JobOfferSerializer,
    ApplicationSerializer, RecruitmentMessageSerializer, TOTPVerifySerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Send verification email for seekers and recruiters
        if user.role in ['seeker', 'recruiter']:
            verification_link = f"http://localhost:8000/api/auth/verify/{user.verification_token}/"
            send_mail(
                subject='Welcome to Online Job Offer Platform — Verify your email',
                message=f'Hi {user.username},\n\nPlease verify your email by clicking the link below:\n\n{verification_link}\n\nThank you!',
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[user.email],
                fail_silently=True,
            )
            return Response(
                {'message': 'Account created successfully. Please check your email to verify your account.'},
                status=status.HTTP_201_CREATED
            )
        # For admin, return QR code for TOTP setup
        if user.role == 'admin':
            totp_uri = user.get_totp_uri()
            qr = qrcode.make(totp_uri)
            buffer = io.BytesIO()
            qr.save(buffer, format='PNG')
            qr_base64 = base64.b64encode(buffer.getvalue()).decode()
            return Response({
                'message': 'Admin account created. Scan the QR code with your authenticator app.',
                'qr_code': f'data:image/png;base64,{qr_base64}',
                'totp_secret': user.totp_secret,
            }, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        try:
            user = User.objects.get(verification_token=token)
            if user.is_verified:
                return Response({'message': 'Email already verified.'})
            user.is_verified = True  # temporarily for testing
            user.save()
            return Response({'message': 'Email verified successfully. You can now log in.'})
        except User.DoesNotExist:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        totp_code = request.data.get('totp_code')

        user = authenticate(username=username, password=password)

        if not user:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'error': 'Your account has been disabled.'}, status=status.HTTP_403_FORBIDDEN)

        # Seekers and recruiters must verify email first
        if user.role in ['seeker', 'recruiter'] and not user.is_verified:
            return Response({'error': 'Please verify your email before logging in.'}, status=status.HTTP_403_FORBIDDEN)
# Admin must provide TOTP code (disabled for testing)
# if user.role == 'admin':
#     if not totp_code:
#         return Response({'error': 'TOTP code required for admin login.'}, status=status.HTTP_400_BAD_REQUEST)
#     if not user.verify_totp_code(totp_code):
#         return Response({'error': 'Invalid TOTP code.'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_object(self):
        return self.request.user


class JobOfferViewSet(viewsets.ModelViewSet):
    serializer_class = JobOfferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return JobOffer.objects.all()
        elif user.role == 'recruiter':
            return JobOffer.objects.filter(recruiter=user)
        else:
            # Seekers see all active jobs
            return JobOffer.objects.filter(status='active')

    def perform_create(self, serializer):
        if self.request.user.role != 'recruiter':
            raise permissions.PermissionDenied('Only recruiters can post jobs.')
        serializer.save(recruiter=self.request.user)

    @action(detail=False, methods=['get'], url_path='all-active')
    def all_active(self, request):
        jobs = JobOffer.objects.filter(status='active')
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)


class ApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Application.objects.all()

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Application.objects.all()
        elif user.role == 'recruiter':
            queryset = Application.objects.filter(job_offer__recruiter=user)
            job_offer_id = self.request.query_params.get('job_offer')
            if job_offer_id:
                queryset = queryset.filter(job_offer_id=job_offer_id)
            return queryset
        else:
            return Application.objects.filter(applicant=user)

    def perform_create(self, serializer):
        if self.request.user.role != 'seeker':
            raise permissions.PermissionDenied('Only job seekers can apply.')
        serializer.save(applicant=self.request.user)
class RecruitmentMessageViewSet(viewsets.ModelViewSet):
    serializer_class = RecruitmentMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return RecruitmentMessage.objects.all()
        elif user.role == 'recruiter':
            return RecruitmentMessage.objects.filter(
                application__job_offer__recruiter=user
            )
        else:
            return RecruitmentMessage.objects.filter(
                application__applicant=user
            )

    def create(self, request, *args, **kwargs):
        if request.user.role != 'recruiter':
            return Response({'error': 'Only recruiters can send messages.'}, status=status.HTTP_403_FORBIDDEN)

        application_id = request.data.get('application')
        content = request.data.get('content')
        is_positive = request.data.get('is_positive')

        try:
            application = Application.objects.get(id=application_id)
        except Application.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)

        if str(is_positive).lower() in ['true', '1']:
            application.status = 'accepted'
        else:
            application.status = 'rejected'
        application.save()

        msg = RecruitmentMessage.objects.create(
            application=application,
            sender=request.user,
            content=content,
            is_positive=is_positive
        )

        serializer = self.get_serializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AdminStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)
        return Response({
            'total_users': User.objects.count(),
            'total_seekers': User.objects.filter(role='seeker').count(),
            'total_recruiters': User.objects.filter(role='recruiter').count(),
            'total_jobs': JobOffer.objects.count(),
            'active_jobs': JobOffer.objects.filter(status='active').count(),
            'cancelled_jobs': JobOffer.objects.filter(status='cancelled').count(),
            'total_applications': Application.objects.count(),
            
        })
    
class NotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        notifications = []

        if user.role == 'recruiter':
            applications = Application.objects.filter(
                job_offer__recruiter=user
            ).order_by('-applied_at')[:20]
            for app in applications:
                notifications.append({
                    'id': app.id,
                    'message': f'{app.full_name} applied for "{app.job_offer.title}"',
                    'time': app.applied_at.strftime('%b %d, %Y %H:%M'),
                    'type': 'application',
                    'is_positive': True
                })

        elif user.role == 'seeker':
            messages = RecruitmentMessage.objects.filter(
                application__applicant=user
            ).order_by('-sent_at')[:20]
            for msg in messages:
                notifications.append({
                    'id': msg.id,
                    'message': f'{"✅ Accepted" if msg.is_positive else "❌ Rejected"} for "{msg.application.job_offer.title}": {msg.content}',
                    'time': msg.sent_at.strftime('%b %d, %Y %H:%M'),
                    'type': 'message',
                    'is_positive': msg.is_positive
                })

        elif user.role == 'admin':
            recent_jobs = JobOffer.objects.order_by('-created_at')[:10]
            for job in recent_jobs:
                notifications.append({
                    'id': job.id,
                    'message': f'New job posted: "{job.title}" by {job.recruiter.username}',
                    'time': job.created_at.strftime('%b %d, %Y %H:%M'),
                    'type': 'job',
                    'is_positive': True
                })
            recent_users = User.objects.order_by('-date_joined')[:5]
            for u in recent_users:
                notifications.append({
                    'id': u.id,
                    'message': f'New {u.role} registered: {u.username}',
                    'time': u.date_joined.strftime('%b %d, %Y %H:%M'),
                    'type': 'registration',
                    'is_positive': True
                })

        return Response(notifications)