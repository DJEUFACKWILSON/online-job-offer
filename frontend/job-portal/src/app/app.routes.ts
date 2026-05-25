import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing/landing').then(m => m.Landing)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then(m => m.Register)
  },
  {
    path: 'seeker-dashboard',
    loadComponent: () => import('./pages/seeker-dashboard/seeker-dashboard').then(m => m.SeekerDashboard),
    canActivate: [authGuard],
    data: { role: 'seeker' }
  },
  {
    path: 'job/:id',
    loadComponent: () => import('./pages/job-detail/job-detail').then(m => m.JobDetail),
    canActivate: [authGuard]
  },
  {
    path: 'apply/:id',
    loadComponent: () => import('./pages/apply-job/apply-job').then(m => m.ApplyJob),
    canActivate: [authGuard],
    data: { role: 'seeker' }
  },
  {
    path: 'recruiter-dashboard',
    loadComponent: () => import('./pages/recruiter-dashboard/recruiter-dashboard').then(m => m.RecruiterDashboard),
    canActivate: [authGuard],
    data: { role: 'recruiter' }
  },
  {
    path: 'job/:id/applications',
    loadComponent: () => import('./pages/job-applications/job-applications').then(m => m.JobApplications),
    canActivate: [authGuard],
    data: { role: 'recruiter' }
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
    canActivate: [authGuard],
    data: { role: 'admin' }
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then(m => m.Profile),
    canActivate: [authGuard]
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound)
  }
];