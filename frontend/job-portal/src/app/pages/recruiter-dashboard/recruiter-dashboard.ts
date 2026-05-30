import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { JobService } from '../../services/job';
import { ApplicationService } from '../../services/application';
import { MessageService } from '../../services/message';
import { User } from '../../models/user';
import { JobOffer } from '../../models/job-offer';
import { Application } from '../../models/application';
import { NotificationService, Notification } from '../../services/notification';

@Component({
  selector: 'app-recruiter-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './recruiter-dashboard.html',
  styleUrl: './recruiter-dashboard.scss'
})
export class RecruiterDashboard implements OnInit {
  currentUser: User | null = null;
  myJobs: JobOffer[] = [];
  selectedJobApplications: Application[] = [];
  selectedJob: JobOffer | null = null;
  isLoadingJobs = true;
  isLoadingApplications = false;
  isSubmittingJob = false;
  activeTab = 'jobs';
  showJobForm = false;
  editingJob: JobOffer | null = null;
  sidebarOpen = false;
messageContent = '';
messagePositive = true;
sendingMessageTo: number | null = null;
successMessage = '';
errorMessage = '';
  jobForm: FormGroup;
  notifications: Notification[] = [];
showNotifications = false;
unreadCount = 0;

  categories = [
    { value: 'it', label: 'Information Technology' },
    { value: 'finance', label: 'Finance & Accounting' },
    { value: 'health', label: 'Health & Medicine' },
    { value: 'education', label: 'Education & Training' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'law', label: 'Law & Legal' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'sales', label: 'Sales' },
    { value: 'other', label: 'Other' },
  ];

  jobTypes = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'contract', label: 'Contract' },
  ];

  experienceLevels = [
    { value: 'junior', label: 'Junior (0-2 years)' },
    { value: 'mid', label: 'Mid-level (2-5 years)' },
    { value: 'senior', label: 'Senior (5+ years)' },
    { value: 'any', label: 'Any Level' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private jobService: JobService,
    private applicationService: ApplicationService,
    private messageService: MessageService,
    private notificationService: NotificationService,
    private router: Router
    
  ) {
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      location: ['', Validators.required],
      salary: [''],
      skills_required: ['', Validators.required],
      job_type: ['full_time', Validators.required],
      category: ['other', Validators.required],
      experience_level: ['any', Validators.required],
      positions_available: [1, [Validators.required, Validators.min(1)]],
      deadline: [''],
    });
  }

  ngOnInit() {
    this.loadNotifications();
    this.currentUser = this.authService.getCurrentUser();
    this.loadMyJobs();
  
  }

  loadMyJobs() {
    this.isLoadingJobs = true;
    this.jobService.getAllJobs().subscribe({
      next: (jobs) => {
        this.myJobs = jobs;
        this.isLoadingJobs = false;
      },
      error: () => { this.isLoadingJobs = false; }
    });
  }

  viewApplications(job: JobOffer) {
    this.selectedJob = job;
    this.isLoadingApplications = true;
    this.activeTab = 'applications';
    this.applicationService.getJobApplications(job.id).subscribe({
      next: (apps) => {
        this.selectedJobApplications = apps;
        this.isLoadingApplications = false;
      },
      error: () => { this.isLoadingApplications = false; }
    });
  }

  openJobForm(job?: JobOffer) {
    this.editingJob = job || null;
    if (job) {
      this.jobForm.patchValue({
        title: job.title,
        description: job.description,
        location: job.location,
        salary: job.salary,
        skills_required: job.skills_required,
        job_type: job.job_type,
        category: job.category,
        experience_level: job.experience_level,
        positions_available: job.positions_available,
        deadline: job.deadline,
      });
    } else {
      this.jobForm.reset({
        job_type: 'full_time',
        category: 'other',
        experience_level: 'any',
        positions_available: 1
      });
    }
    this.showJobForm = true;
    this.activeTab = 'post';
  }

  submitJob() {
    if (this.jobForm.invalid) {
      this.jobForm.markAllAsTouched();
      return;
    }
    this.isSubmittingJob = true;
    const formData = new FormData();
    Object.keys(this.jobForm.value).forEach(key => {
      if (this.jobForm.value[key] !== null && this.jobForm.value[key] !== '') {
        formData.append(key, this.jobForm.value[key]);
      }
    });

    const request = this.editingJob
      ? this.jobService.updateJob(this.editingJob.id, formData)
      : this.jobService.createJob(formData);

    request.subscribe({
      next: () => {
        this.isSubmittingJob = false;
        this.showJobForm = false;
        this.activeTab = 'jobs';
        this.loadMyJobs();
      },
      error: () => { this.isSubmittingJob = false; }
    });
  }

  deleteJob(jobId: number) {
    if (confirm('Are you sure you want to delete this job?')) {
      this.jobService.deleteJob(jobId).subscribe({
        next: () => this.loadMyJobs()
      });
    }
  }
sendMessage(applicationId: number, isPositive: boolean) {
  console.log('sendMessage called', applicationId, isPositive, this.messageContent);
  if (!this.messageContent.trim()) {
    this.errorMessage = 'Please enter a message before sending.';
    return;
  }

  this.messageService.sendMessage({
    application: applicationId,
    content: this.messageContent,
    is_positive: isPositive
  }).subscribe({
next: () => {
  this.messageContent = '';
  this.sendingMessageTo = null;
  this.errorMessage = '';
  this.successMessage = isPositive ? 'Acceptance message sent successfully!' : 'Rejection message sent successfully!';
  setTimeout(() => this.successMessage = '', 3000);
  // Refresh auth token to avoid stale user data
  this.authService.getProfile().subscribe();
  this.viewApplications(this.selectedJob!);
},
    error: (err) => {
      this.errorMessage = err.error?.detail || 'Failed to send message. Try again.';
    }
  });
}

  getStatusClass(status: string): string {
    const classes: any = {
      'pending': 'badge-pending',
      'reviewed': 'badge-reviewed',
      'accepted': 'badge-accepted',
      'rejected': 'badge-rejected'
    };
    return classes[status] || 'badge-pending';
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  goToProfile() { this.router.navigate(['/profile']); }
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  loadNotifications() {
  this.notificationService.getNotifications().subscribe({
    next: (data) => {
      this.notifications = data;
      this.unreadCount = data.length;
    }
  });
}

toggleNotifications() {
  this.showNotifications = !this.showNotifications;
  if (this.showNotifications) {
    this.unreadCount = 0;
  }
}
dismissNotification(notification: any, event: Event) {
  event.stopPropagation();
  this.notificationService.dismissNotification(notification);
  this.notifications = this.notifications.filter(
    n => !(n.type === notification.type && n.id === notification.id)
  );
  this.unreadCount = this.notifications.length;
}

clearAllNotifications(event: Event) {
  event.stopPropagation();
  this.notificationService.clearAll(this.notifications);
  this.notifications = [];
  this.unreadCount = 0;
}
  get activeJobsCount() { return this.myJobs.filter(j => j.status === 'active').length; }
  get totalApplicationsCount() { return this.selectedJobApplications.length; }
}