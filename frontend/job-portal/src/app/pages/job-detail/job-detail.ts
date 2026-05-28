import { Component, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth';
import { JobService } from '../../services/job';
import { ApplicationService } from '../../services/application';
import { User } from '../../models/user';
import { JobOffer } from '../../models/job-offer';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TitleCasePipe, DatePipe],
  templateUrl: './job-detail.html',
  styleUrl: './job-detail.scss'
})
export class JobDetail implements OnInit {
  currentUser: User | null = null;
  job: JobOffer | null = null;
  isLoading = true;
  hasApplied = false;

  constructor(
    private authService: AuthService,
    private jobService: JobService,
    private applicationService: ApplicationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    const jobId = this.route.snapshot.paramMap.get('id');
    if (jobId) {
      this.jobService.getJobById(+jobId).subscribe({
        next: (job) => {
          this.job = job;
          this.isLoading = false;
          this.checkIfApplied(+jobId);
        },
        error: () => { this.isLoading = false; }
      });
    }
  }

  checkIfApplied(jobId: number) {
    if (this.currentUser?.role !== 'seeker') return;
    this.applicationService.getMyApplications().subscribe({
      next: (apps) => {
        this.hasApplied = apps.some(a => a.job_offer === jobId);
      }
    });
  }

  applyNow() {
    this.router.navigate(['/apply-job', this.job!.id]);
  }

  goBack() { this.router.navigate(['/seeker-dashboard']); }
}