import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {
  stats = [
    { number: '500+', label: 'Jobs Available', icon: 'fa-briefcase' },
    { number: '200+', label: 'Companies', icon: 'fa-building' },
    { number: '1000+', label: 'Job Seekers', icon: 'fa-users' },
    { number: '95%', label: 'Success Rate', icon: 'fa-chart-line' },
  ];

  categories = [
    { name: 'Information Technology', icon: 'fa-laptop-code', color: '#4f46e5', jobs: 120 },
    { name: 'Finance & Accounting', icon: 'fa-coins', color: '#059669', jobs: 85 },
    { name: 'Health & Medicine', icon: 'fa-heartbeat', color: '#dc2626', jobs: 96 },
    { name: 'Education & Training', icon: 'fa-graduation-cap', color: '#d97706', jobs: 74 },
    { name: 'Engineering', icon: 'fa-cogs', color: '#7c3aed', jobs: 110 },
    { name: 'Marketing', icon: 'fa-bullhorn', color: '#db2777', jobs: 65 },
  ];

  featuredJobs = [
    {
      title: 'Senior Software Engineer',
      company: 'TechCorp',
      location: 'Douala, Cameroon',
      salary: '500,000 - 800,000 FCFA',
      type: 'Full Time',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=200&fit=crop',
      category: 'IT'
    },
    {
      title: 'Financial Analyst',
      company: 'BankGroup',
      location: 'Yaoundé, Cameroon',
      salary: '400,000 - 600,000 FCFA',
      type: 'Full Time',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop',
      category: 'Finance'
    },
    {
      title: 'Medical Doctor',
      company: 'HealthPlus Clinic',
      location: 'Bafoussam, Cameroon',
      salary: '700,000 - 1,000,000 FCFA',
      type: 'Full Time',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop',
      category: 'Health'
    },
  ];

  steps = [
    { number: '01', title: 'Create Account', desc: 'Sign up as a Job Seeker or Recruiter in just 2 minutes.', icon: 'fa-user-plus' },
    { number: '02', title: 'Browse Jobs', desc: 'Explore hundreds of job offers filtered by category, location and salary.', icon: 'fa-search' },
    { number: '03', title: 'Apply & Get Hired', desc: 'Submit your CV and cover letter and wait for the recruiter response.', icon: 'fa-paper-plane' },
  ];

  constructor(private router: Router) {}

  goToRegister() { this.router.navigate(['/register']); }
  goToLogin() { this.router.navigate(['/login']); }
  goToJobs() { this.router.navigate(['/login']); }
}