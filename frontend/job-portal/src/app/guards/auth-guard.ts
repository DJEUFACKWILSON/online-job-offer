import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Check role-based access
  const expectedRole = route.data?.['role'];
  if (expectedRole) {
    const userRole = authService.getUserRole();
    if (userRole !== expectedRole) {
      // Redirect to their correct dashboard
      if (userRole === 'admin') router.navigate(['/admin-dashboard']);
      else if (userRole === 'recruiter') router.navigate(['/recruiter-dashboard']);
      else router.navigate(['/seeker-dashboard']);
      return false;
    }
  }

  return true;
};