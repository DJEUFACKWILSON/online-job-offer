import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  registerForm: FormGroup;
  qrCode = '';
totpSecret = '';
showQrCode = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showPassword2 = false;
  selectedRole = 'seeker';
  requiresVerification = false;
  verificationCode = '';
  registeredUsername = '';
  isVerifying = false;
  verificationError = '';
  roles = [
    { value: 'seeker', label: 'Job Seeker', icon: 'fa-user-tie', desc: 'Looking for a job' },
    { value: 'recruiter', label: 'Recruiter', icon: 'fa-building', desc: 'Hiring talent' },
    { value: 'admin', label: 'Admin', icon: 'fa-shield-alt', desc: 'Platform manager' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public router: Router,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password2: ['', [Validators.required]],
      role: ['seeker', Validators.required],
      phone: [''],
      location: [''],
      company_name: [''],
      admin_key: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const password2 = form.get('password2')?.value;
    return password === password2 ? null : { passwordMismatch: true };
  }
   
  get username() { return this.registerForm.get('username'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get password2() { return this.registerForm.get('password2'); }
  get phone() { return this.registerForm.get('phone'); }
  get location() { return this.registerForm.get('location'); }
  get company_name() { return this.registerForm.get('company_name'); }
  get admin_key() { return this.registerForm.get('admin_key'); }

  selectRole(role: string) {
    this.selectedRole = role;
    this.registerForm.patchValue({ role });
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  togglePassword2() { this.showPassword2 = !this.showPassword2; }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.registerForm.value).subscribe({
     next: (response: any) => {
  this.isLoading = false;
  if (response.requires_verification) {
    this.registeredUsername = response.username;
    this.requiresVerification = true;
  } else if (response.qr_code) {
    // Admin - show QR code
    this.qrCode = response.qr_code;
    this.totpSecret = response.totp_secret;
    this.showQrCode = true;
  } else {
    this.successMessage = 'Account created!';
    setTimeout(() => this.router.navigate(['/login']), 2000);
  }
},
      error: (err) => {
        this.isLoading = false;
        const errors = err.error;
        if (typeof errors === 'object') {
          this.errorMessage = Object.values(errors).flat().join(' ');
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      }
    });
  }
  verifyCode() {
  if (!this.verificationCode.trim()) return;
  this.isVerifying = true;
  this.verificationError = '';
  
  this.http.post(`${environment.apiUrl}/auth/verify-code/`, {
    username: this.registeredUsername,
    code: this.verificationCode
  }).subscribe({
    next: () => {
      this.isVerifying = false;
      this.successMessage = 'Email verified! Redirecting to login...';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    },
    error: (err) => {
      this.isVerifying = false;
      this.verificationError = err.error?.error || 'Invalid code. Please try again.';
    }
  });
}
  goToLanding() { this.router.navigate(['/']); }
}
