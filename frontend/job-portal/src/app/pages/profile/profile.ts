import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { User } from '../../models/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  currentUser: User | null = null;
  profileForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      location: [''],
      bio: [''],
      company_name: [''],
    });
  }

  ngOnInit() {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.profileForm.patchValue({
          username: user.username,
          email: user.email,
          phone: user.phone || '',
          location: user.location || '',
          bio: user.bio || '',
          company_name: user.company_name || '',
        });
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

onSubmit() {
  console.log('Form valid:', this.profileForm.valid);
  console.log('Form values:', this.profileForm.value);
  console.log('Form errors:', this.profileForm.errors);
  
  if (this.profileForm.invalid) {
    this.profileForm.markAllAsTouched();
    return;
  }

  this.isSubmitting = true;
  this.successMessage = '';
  this.errorMessage = '';

  const formData = new FormData();
  Object.keys(this.profileForm.value).forEach(key => {
    if (this.profileForm.value[key] !== null && this.profileForm.value[key] !== '') {
      formData.append(key, this.profileForm.value[key]);
    }
  });

  if (this.selectedFile) {
    formData.append('profile_picture', this.selectedFile);
  }

  this.authService.updateProfile(formData).subscribe({
    next: (user) => {
      this.isSubmitting = false;
      this.successMessage = 'Profile updated successfully!';
      setTimeout(() => this.successMessage = '', 3000);
    },
    error: (err) => {
     this.isSubmitting = false;
    if (err.error && typeof err.error === 'object') {
    const errors = Object.values(err.error).flat();
    this.errorMessage = errors.join(' ');
  } else {
    this.errorMessage = 'Failed to update profile. Please try again.';
  }
}
  });
}

  goBack() {
    const role = this.currentUser?.role;
    if (role === 'admin') this.router.navigate(['/admin-dashboard']);
    else if (role === 'recruiter') this.router.navigate(['/recruiter-dashboard']);
    else this.router.navigate(['/seeker-dashboard']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}