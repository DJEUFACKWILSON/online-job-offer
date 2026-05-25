from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, JobOffer, Application, RecruitmentMessage, AdminConfig
import pyotp


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    admin_key = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'role',
                  'phone', 'location', 'company_name', 'admin_key')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})

        role = attrs.get('role', 'seeker')

        if role == 'admin':
            admin_key = attrs.get('admin_key', '')
            if not AdminConfig.objects.filter(secret_key=admin_key).exists():
                raise serializers.ValidationError({'admin_key': 'Invalid admin secret key.'})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        validated_data.pop('admin_key', None)
        password = validated_data.pop('password')
        role = validated_data.get('role', 'seeker')

        user = User(**validated_data)
        user.set_password(password)

        if role == 'admin':
            user.is_verified = True
            user.totp_secret = pyotp.random_base32()
        else:
            user.is_verified = True

        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'profile_picture',
                  'phone', 'location', 'bio', 'company_name', 'is_verified',
                  'is_active', 'date_joined')
        read_only_fields = ('id', 'date_joined', 'is_verified')


class JobOfferSerializer(serializers.ModelSerializer):
    recruiter_name = serializers.SerializerMethodField()
    category_display = serializers.SerializerMethodField()
    experience_display = serializers.SerializerMethodField()
    job_type_display = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = JobOffer
        fields = (
            'id', 'recruiter', 'recruiter_name', 'title', 'description',
            'location', 'salary', 'skills_required', 'job_type', 'job_type_display',
            'category', 'category_display', 'experience_level', 'experience_display',
            'positions_available', 'deadline', 'photo', 'status',
            'created_at', 'updated_at', 'is_expired'
        )
        read_only_fields = ('id', 'recruiter', 'created_at', 'updated_at')

    def get_recruiter_name(self, obj):
        return obj.recruiter.company_name or obj.recruiter.username

    def get_category_display(self, obj):
        return obj.get_category_display()

    def get_experience_display(self, obj):
        return obj.get_experience_level_display()

    def get_job_type_display(self, obj):
        return obj.get_job_type_display()

    def get_is_expired(self, obj):
        from django.utils import timezone
        if obj.deadline:
            return obj.deadline < timezone.now().date()
        return False

    def validate_status(self, value):
        request = self.context.get('request')
        if request and request.user.role != 'admin' and value == 'cancelled':
            raise serializers.ValidationError('Only admin can cancel a job.')
        return value

class ApplicationSerializer(serializers.ModelSerializer):
    job_title = serializers.SerializerMethodField()
    applicant_name = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = ('id', 'job_offer', 'job_title', 'applicant', 'applicant_name',
                  'full_name', 'email', 'phone', 'cover_letter', 'cv',
                  'status', 'applied_at')
        read_only_fields = ('id', 'applicant', 'status', 'applied_at')

    def get_job_title(self, obj):
        return obj.job_offer.title

    def get_applicant_name(self, obj):
        return obj.applicant.username

    def validate(self, attrs):
        request = self.context.get('request')
        if request:
            already_applied = Application.objects.filter(
                job_offer=attrs['job_offer'],
                applicant=request.user
            ).exists()
            if already_applied:
                raise serializers.ValidationError(
                    'You have already applied to this job.'
                )
        return attrs


class RecruitmentMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecruitmentMessage
        fields = ('id', 'application', 'sender', 'content', 'is_positive', 'sent_at')
        read_only_fields = ('id', 'sender', 'sent_at')

    def validate(self, attrs):
        application = attrs['application']
        # Check if message already exists for this application
        if RecruitmentMessage.objects.filter(application=application).exists():
            raise serializers.ValidationError(
                'A message has already been sent for this application.'
            )
        # Check that the sender is the recruiter who posted the job
        request = self.context.get('request')
        if request and application.job_offer.recruiter != request.user:
            raise serializers.ValidationError(
                'Only the job recruiter can send a message.'
            )
        return attrs


class TOTPVerifySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)