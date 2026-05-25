import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {
  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showPassword2 = false;
  selectedRole = 'seeker';

  roles = [
    { value: 'seeker', label: 'Job Seeker', icon: 'fa-user-tie', desc: 'Looking for a job' },
    { value: 'recruiter', label: 'Recruiter', icon: 'fa-building', desc: 'Hiring talent' },
    { value: 'admin', label: 'Admin', icon: 'fa-shield-alt', desc: 'Platform manager' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
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
      next: (response) => {
        this.isLoading = false;
        if (this.selectedRole === 'admin') {
          this.successMessage = 'Admin account created! Scan the QR code with your authenticator app.';
        } else {
          this.successMessage = response.message || 'Account created! Please check your email to verify your account.';
        }
        setTimeout(() => this.router.navigate(['/login']), 4000);
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

  goToLanding() { this.router.navigate(['/']); }
}