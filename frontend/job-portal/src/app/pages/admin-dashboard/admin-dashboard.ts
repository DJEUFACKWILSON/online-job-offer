import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { JobService } from '../../services/job';
import { ApplicationService } from '../../services/application';
import { User } from '../../models/user';
import { JobOffer } from '../../models/job-offer';
import { Application } from '../../models/application';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { NotificationService, Notification } from '../../services/notification';


@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TitleCasePipe, DatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  currentUser: User | null = null;
  allUsers: User[] = [];
  allJobs: JobOffer[] = [];
  allApplications: Application[] = [];
  isLoadingUsers = true;
  isLoadingJobs = true;
  isLoadingApplications = true;
  activeTab = 'overview';
  sidebarOpen = false;
  searchUser = '';
  searchJob = '';
  notifications: Notification[] = [];
showNotifications = false;
unreadCount = 0;

  stats = {
    total_users: 0,
    total_seekers: 0,
    total_recruiters: 0,
    total_jobs: 0,
    active_jobs: 0,
    cancelled_jobs: 0,
    total_applications: 0,
  };

  constructor(
    private authService: AuthService,
    private jobService: JobService,
    private applicationService: ApplicationService,
    private http: HttpClient,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadStats();
    this.loadJobs();
    this.loadNotifications();
    this.loadApplications();
  }

  loadStats() {
    this.http.get<any>(`${environment.apiUrl}/admin-stats/`).subscribe({
      next: (data) => { this.stats = data; },
      error: () => {}
    });
  }

  loadJobs() {
    this.isLoadingJobs = true;
    this.jobService.getAllJobs().subscribe({
      next: (jobs) => {
        this.allJobs = jobs;
        this.isLoadingJobs = false;
      },
      error: () => { this.isLoadingJobs = false; }
    });
  }

  loadApplications() {
    this.isLoadingApplications = true;
    this.applicationService.getAllApplications().subscribe({
      next: (apps) => {
        this.allApplications = apps;
        this.isLoadingApplications = false;
      },
      error: () => { this.isLoadingApplications = false; }
    });
  }

  cancelJob(jobId: number) {
    if (confirm('Are you sure you want to cancel this job?')) {
      this.jobService.cancelJob(jobId).subscribe({
        next: () => this.loadJobs()
      });
    }
  }

  deleteJob(jobId: number) {
    if (confirm('Are you sure you want to DELETE this job?')) {
      this.jobService.deleteJob(jobId).subscribe({
        next: () => this.loadJobs()
      });
    }
  }

  toggleUserStatus(user: User) {
    const action = user.is_active ? 'disable' : 'enable';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      this.loadStats();
    }
  }

  get filteredJobs() {
    if (!this.searchJob) return this.allJobs;
    return this.allJobs.filter(j =>
      j.title.toLowerCase().includes(this.searchJob.toLowerCase()) ||
      j.recruiter_name.toLowerCase().includes(this.searchJob.toLowerCase())
    );
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
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  goToProfile() { this.router.navigate(['/profile']); }
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
