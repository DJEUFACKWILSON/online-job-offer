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

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Application.objects.all()
        elif user.role == 'recruiter':
            return Application.objects.filter(job_offer__recruiter=user)
        else:
            return Application.objects.filter(applicant=user)

    def perform_create(self, serializer):
        if self.request.user.role != 'seeker':
            raise permissions.PermissionDenied('Only job seekers can apply.')
        serializer.save(applicant=self.request.user)


class RecruitmentMessageViewSet(viewsets.ModelViewSet):
    serializer_class = RecruitmentMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post']  # no update or delete allowed

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

    def perform_create(self, serializer):
        if self.request.user.role != 'recruiter':
            raise permissions.PermissionDenied('Only recruiters can send messages.')
        serializer.save(sender=self.request.user)


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