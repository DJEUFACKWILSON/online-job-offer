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
import { environment } from '../../../environments/environment';
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
  allUsers: any[] = [];
  allJobs: JobOffer[] = [];
  allApplications: Application[] = [];
  isLoadingUsers = false;
  isLoadingJobs = true;
  isLoadingApplications = true;
  activeTab = 'overview';
  sidebarOpen = false;
  searchUser = '';
  searchJob = '';
  showDeleteModal = false;
  jobToDelete: JobOffer | null = null;
  deleteReason = '';
  showDeleteUserModal = false;
  userToDelete: any = null;
  deleteUserReason = '';
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
    this.loadUsers();
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
  loadUsers() {
  this.isLoadingUsers = true;
  this.http.get<any[]>(`${environment.apiUrl}/users/`).subscribe({
    next: (users) => {
      this.allUsers = users;
      this.isLoadingUsers = false;
    },
    error: () => { this.isLoadingUsers = false; }
  });
}
  cancelJob(jobId: number) {
  if (confirm('Are you sure you want to cancel this job?')) {
    this.jobService.cancelJob(jobId).subscribe({
      next: () => this.loadJobs(),
      error: (err) => {
        if (err.status === 403) {
          alert('Session expired. Please login again.');
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          alert('Failed to cancel job. Please try again.');
        }
      }
    });
  }
}

enableJob(jobId: number) {
  this.jobService.enableJob(jobId).subscribe({
    next: () => this.loadJobs(),
    error: (err) => {
      if (err.status === 403) {
        alert('Session expired. Please login again.');
        this.authService.logout();
        this.router.navigate(['/login']);
      } else {
        alert('Failed to enable job. Please try again.');
      }
    }
  });
}

    deleteJob(jobId: number) {
  const job = this.allJobs.find(j => j.id === jobId);
  if (job) {
    this.jobToDelete = job;
    this.deleteReason = '';
    this.showDeleteModal = true;
  }
}
   confirmDelete() {
  if (!this.jobToDelete || !this.deleteReason.trim()) return;
  this.http.delete(`${environment.apiUrl}/jobs/${this.jobToDelete.id}/`, {
    body: { reason: this.deleteReason }
  }).subscribe({
    next: () => {
      this.showDeleteModal = false;
      this.jobToDelete = null;
      this.deleteReason = '';
      this.loadJobs();
      this.loadStats();
    },
    error: () => alert('Failed to delete job.')
  });
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
get filteredUsers() {
  if (!this.searchUser) return this.allUsers;
  return this.allUsers.filter(u =>
    u.username.toLowerCase().includes(this.searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(this.searchUser.toLowerCase())
  );
}

toggleUser(user: any) {
  const action = user.is_active ? 'disable' : 'enable';
  if (confirm(`Are you sure you want to ${action} ${user.username}?`)) {
    this.http.patch(`${environment.apiUrl}/users/${user.id}/toggle/`, {}).subscribe({
      next: () => this.loadUsers(),
      error: () => alert('Failed to update user status.')
    });
  }
}
deleteUser(user: any) {
  console.log('deleteUser called', user);
  this.userToDelete = user;
  this.deleteUserReason = '';
  this.showDeleteUserModal = true;
  console.log('showDeleteUserModal', this.showDeleteUserModal);
}
confirmDeleteUser() {
  if (!this.userToDelete || !this.deleteUserReason.trim()) return;
  this.http.delete(`${environment.apiUrl}/users/${this.userToDelete.id}/`, {
    body: { reason: this.deleteUserReason }
  }).subscribe({
    next: () => {
      this.showDeleteUserModal = false;
      this.userToDelete = null;
      this.deleteUserReason = '';
      this.loadUsers();
      this.loadStats();
    },
    error: () => alert('Failed to delete user.')
  });
}
  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }
  goToProfile() { this.router.navigate(['/profile']); }
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
