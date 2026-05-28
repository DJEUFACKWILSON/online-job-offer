import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { JobService } from '../../services/job';
import { ApplicationService } from '../../services/application';
import { User } from '../../models/user';
import { JobOffer } from '../../models/job-offer';
import { Application } from '../../models/application';

@Component({
  selector: 'app-seeker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './seeker-dashboard.html',
  styleUrl: './seeker-dashboard.scss'
})
export class SeekerDashboard implements OnInit {
  currentUser: User | null = null;
  jobs: JobOffer[] = [];
  filteredJobs: JobOffer[] = [];
  myApplications: Application[] = [];
  isLoadingJobs = true;
  isLoadingSidebar = true;
  searchKeyword = '';
  selectedCategory = '';
  selectedLocation = '';
  selectedJobType = '';
  sidebarOpen = false;
  activeTab = 'jobs';

  categories = [
    { value: '', label: 'All Categories' },
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
    { value: '', label: 'All Types' },
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'contract', label: 'Contract' },
  ];

  constructor(
    private authService: AuthService,
    private jobService: JobService,
    private applicationService: ApplicationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadJobs();
    this.loadMyApplications();
  }

  loadJobs() {
    this.isLoadingJobs = true;
    this.jobService.getActiveJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.filteredJobs = jobs;
        this.isLoadingJobs = false;
      },
      error: () => { this.isLoadingJobs = false; }
    });
  }

  loadMyApplications() {
    this.isLoadingSidebar = true;
    this.applicationService.getMyApplications().subscribe({
      next: (apps) => {
        this.myApplications = apps;
        this.isLoadingSidebar = false;
      },
      error: () => { this.isLoadingSidebar = false; }
    });
  }

  filterJobs() {
    this.filteredJobs = this.jobs.filter(job => {
      const matchesKeyword = !this.searchKeyword ||
        job.title.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        job.description.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
        job.recruiter_name.toLowerCase().includes(this.searchKeyword.toLowerCase());
      const matchesCategory = !this.selectedCategory || job.category === this.selectedCategory;
      const matchesLocation = !this.selectedLocation ||
        job.location.toLowerCase().includes(this.selectedLocation.toLowerCase());
      const matchesType = !this.selectedJobType || job.job_type === this.selectedJobType;
      return matchesKeyword && matchesCategory && matchesLocation && matchesType;
    });
  }

  clearFilters() {
    this.searchKeyword = '';
    this.selectedCategory = '';
    this.selectedLocation = '';
    this.selectedJobType = '';
    this.filteredJobs = this.jobs;
  }

  hasApplied(jobId: number): boolean {
    return this.myApplications.some(app => app.job_offer === jobId);
  }

  getApplicationStatus(jobId: number): string {
    const app = this.myApplications.find(a => a.job_offer === jobId);
    return app ? app.status : '';
  }
viewJob(jobId: number) { this.router.navigate(['/job-detail', jobId]); }
applyJob(jobId: number) { this.router.navigate(['/apply-job', jobId]); }
  goToProfile() { this.router.navigate(['/profile']); }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar() { this.sidebarOpen = !this.sidebarOpen; }

  getStatusClass(status: string): string {
    const classes: any = {
      'pending': 'badge-pending',
      'reviewed': 'badge-reviewed',
      'accepted': 'badge-accepted',
      'rejected': 'badge-rejected'
    };
    return classes[status] || 'badge-pending';
  }

  get pendingCount() { return this.myApplications.filter(a => a.status === 'pending').length; }
  get acceptedCount() { return this.myApplications.filter(a => a.status === 'accepted').length; }
  get rejectedCount() { return this.myApplications.filter(a => a.status === 'rejected').length; }
}