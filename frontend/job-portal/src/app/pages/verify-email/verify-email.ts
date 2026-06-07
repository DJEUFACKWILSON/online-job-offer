import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="verify-page">
      <div class="verify-card">
        <div class="brand">
          <div class="brand-icon"><i class="fas fa-briefcase"></i></div>
          <span class="brand-text">Job<span class="accent">Portal</span></span>
        </div>
        <div *ngIf="isLoading" class="state loading">
          <div class="spinner-border text-primary"></div>
          <p>Verifying your email...</p>
        </div>
        <div *ngIf="success" class="state success">
          <i class="fas fa-check-circle"></i>
          <h4>Email Verified!</h4>
          <p>Your account has been verified successfully. You can now login.</p>
          <button class="btn btn-primary" (click)="goToLogin()">Go to Login</button>
        </div>
        <div *ngIf="error" class="state error">
          <i class="fas fa-times-circle"></i>
          <h4>Verification Failed</h4>
          <p>{{error}}</p>
          <button class="btn btn-outline-primary" (click)="goToLogin()">Go to Login</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-page {
      min-height: 100vh;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Poppins', sans-serif;
    }
    .verify-card {
      background: white;
      border-radius: 20px;
      padding: 48px 40px;
      text-align: center;
      max-width: 440px;
      width: 90%;
    }
    .brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 32px;
      .brand-icon {
        width: 40px; height: 40px;
        background: #4f46e5;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        color: white; font-size: 16px;
      }
      .brand-text { font-weight: 800; font-size: 1.3rem; color: #0f172a; }
      .accent { color: #f59e0b; }
    }
    .state {
      i { font-size: 3rem; display: block; margin-bottom: 16px; }
      h4 { font-weight: 700; margin-bottom: 8px; }
      p { color: #64748b; margin-bottom: 24px; }
      .btn { border-radius: 12px; padding: 12px 32px; font-weight: 600; }
    }
    .success i { color: #10b981; }
    .error i { color: #ef4444; }
  `]
})
export class VerifyEmail implements OnInit {
  isLoading = true;
  success = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.http.get(`${environment.apiUrl}/auth/verify/${token}/`).subscribe({
        next: () => {
          this.isLoading = false;
          this.success = true;
        },
        error: () => {
          this.isLoading = false;
          this.error = 'This verification link is invalid or has expired.';
        }
      });
    }
  }

  goToLogin() { this.router.navigate(['/login']); }
}