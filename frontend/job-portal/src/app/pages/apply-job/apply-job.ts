import { Component, OnInit } from '@angular/core';

import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { JobService } from '../../services/job';
import { ApplicationService } from '../../services/application';
import { User } from '../../models/user';
import { JobOffer } from '../../models/job-offer';

@Component({
  selector: 'app-apply-job',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, TitleCasePipe, DatePipe],
  templateUrl: './apply-job.html',
  styleUrl: './apply-job.scss'
})
export class ApplyJob implements OnInit {
  currentUser: User | null = null;
  job: JobOffer | null = null;
  isLoadingJob = true;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  selectedCV: File | null = null;
  applyForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private jobService: JobService,
    private applicationService: ApplicationService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.applyForm = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      cover_letter: [''],
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.applyForm.patchValue({
        full_name: this.currentUser.username,
        email: this.currentUser.email,
      });
    }
    const jobId = this.route.snapshot.paramMap.get('id');
    if (jobId) {
      this.jobService.getJobById(+jobId).subscribe({
        next: (job) => {
          this.job = job;
          this.isLoadingJob = false;
        },
        error: () => { this.isLoadingJob = false; }
      });
    }
  }

  onCVSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.selectedCV = file;
  }

  onSubmit() {
    if (this.applyForm.invalid) {
      this.applyForm.markAllAsTouched();
      return;
    }
    if (!this.selectedCV) {
      this.errorMessage = 'Please upload your CV.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('job_offer', this.job!.id.toString());
    formData.append('full_name', this.applyForm.value.full_name);
    formData.append('email', this.applyForm.value.email);
    formData.append('phone', this.applyForm.value.phone);
    formData.append('cover_letter', this.applyForm.value.cover_letter || '');
    formData.append('cv', this.selectedCV);

    this.applicationService.applyToJob(formData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = 'Application submitted! Redirecting...';
        setTimeout(() => this.router.navigate(['/seeker-dashboard']), 3000);
      },
      error: (err) => {
        this.isSubmitting = false;
        const errors = err.error;
        if (typeof errors === 'object') {
          this.errorMessage = Object.values(errors).flat().join(' ');
        } else {
          this.errorMessage = 'Failed to submit. Please try again.';
        }
      }
    });
  }

  goBack() { this.router.navigate(['/seeker-dashboard']); }
}