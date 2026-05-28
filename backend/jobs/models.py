from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
import pyotp


class AdminConfig(models.Model):
    """Stores the secret key required to register as admin."""
    secret_key = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Admin Secret Key (created {self.created_at.date()})"

    class Meta:
        verbose_name = "Admin Configuration"
        verbose_name_plural = "Admin Configurations"


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('recruiter', 'Recruiter'),
        ('seeker', 'Job Seeker'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='seeker')
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    company_name = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    # Email verification (for recruiters and seekers)
    is_verified = models.BooleanField(default=False)
    verification_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    # TOTP 2FA (for admins only)
    totp_secret = models.CharField(max_length=32, blank=True, null=True)
    totp_verified = models.BooleanField(default=False)  # True after first QR scan confirmed

    def generate_totp_secret(self):
        """Generate a new TOTP secret for this admin."""
        self.totp_secret = pyotp.random_base32()
        self.save()
        return self.totp_secret

    def get_totp_uri(self):
        """Returns the URI used to generate the QR code."""
        return pyotp.totp.TOTP(self.totp_secret).provisioning_uri(
            name=self.email,
            issuer_name="Online Job Offer Platform"
        )

    def verify_totp_code(self, code):
        """Verify a 6-digit code from the authenticator app."""
        if not self.totp_secret:
            return False
        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(code)

    def __str__(self):
        return f"{self.username} ({self.role})"


class JobOffer(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('cancelled', 'Cancelled'),
        ('closed', 'Closed'),
    ]
    CATEGORY_CHOICES = [
        ('it', 'Information Technology'),
        ('finance', 'Finance & Accounting'),
        ('health', 'Health & Medicine'),
        ('education', 'Education & Training'),
        ('engineering', 'Engineering'),
        ('marketing', 'Marketing & Communication'),
        ('law', 'Law & Legal Services'),
        ('hr', 'Human Resources'),
        ('sales', 'Sales & Business Development'),
        ('other', 'Other'),
    ]
    EXPERIENCE_CHOICES = [
        ('junior', 'Junior (0-2 years)'),
        ('mid', 'Mid-level (2-5 years)'),
        ('senior', 'Senior (5+ years)'),
        ('any', 'Any Level'),
    ]
    JOB_TYPE_CHOICES = [
        ('full_time', 'Full Time'),
        ('part_time', 'Part Time'),
        ('internship', 'Internship'),
        ('freelance', 'Freelance'),
        ('contract', 'Contract'),
    ]

    recruiter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_offers')
    title = models.CharField(max_length=200)
    description = models.TextField()
    location = models.CharField(max_length=100)
    salary = models.CharField(max_length=100, blank=True, null=True)
    skills_required = models.TextField()
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='full_time')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    experience_level = models.CharField(max_length=10, choices=EXPERIENCE_CHOICES, default='any')
    positions_available = models.PositiveIntegerField(default=1)
    deadline = models.DateField(blank=True, null=True)
    photo = models.ImageField(upload_to='job_photos/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} — {self.recruiter.company_name or self.recruiter.username}"

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} — {self.recruiter.company_name or self.recruiter.username}"


class Application(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    job_offer = models.ForeignKey(JobOffer, on_delete=models.CASCADE, related_name='applications')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    cover_letter = models.TextField(blank=True, null=True)
    cv = models.FileField(upload_to='cvs/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('job_offer', 'applicant')
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.applicant.username} → {self.job_offer.title}"
class RecruitmentMessage(models.Model):
    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name='messages'
    )
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    is_positive = models.BooleanField()
    sent_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        result = "Accepted" if self.is_positive else "Rejected"
        return f"{result} — {self.application}"