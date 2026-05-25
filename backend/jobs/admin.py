from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, JobOffer, Application, RecruitmentMessage, AdminConfig


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_verified', 'is_active', 'date_joined')
    list_filter = ('role', 'is_verified', 'is_active')
    search_fields = ('username', 'email', 'company_name')
    ordering = ('-date_joined',)
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Info', {'fields': ('role', 'profile_picture', 'phone', 'location', 'bio', 'company_name', 'is_verified', 'totp_secret', 'totp_verified')}),
    )


@admin.register(JobOffer)
class JobOfferAdmin(admin.ModelAdmin):
    list_display = ('title', 'recruiter', 'location', 'status', 'created_at')
    list_filter = ('status', 'job_type')
    search_fields = ('title', 'recruiter__username', 'location')
    ordering = ('-created_at',)
    actions = ['cancel_jobs', 'activate_jobs']

    def cancel_jobs(self, request, queryset):
        queryset.update(status='cancelled')
    cancel_jobs.short_description = 'Cancel selected jobs'

    def activate_jobs(self, request, queryset):
        queryset.update(status='active')
    activate_jobs.short_description = 'Activate selected jobs'


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('applicant', 'job_offer', 'status', 'applied_at')
    list_filter = ('status',)
    search_fields = ('applicant__username', 'job_offer__title')
    ordering = ('-applied_at',)


@admin.register(RecruitmentMessage)
class RecruitmentMessageAdmin(admin.ModelAdmin):
    list_display = ('application', 'sender', 'is_positive', 'sent_at')
    list_filter = ('is_positive',)
    ordering = ('-sent_at',)


@admin.register(AdminConfig)
class AdminConfigAdmin(admin.ModelAdmin):
    list_display = ('secret_key', 'created_at')