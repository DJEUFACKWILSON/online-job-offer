import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);
  const token = authService.getToken();

  const authReq = token ? req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          return http.post<any>(`${environment.apiUrl}/auth/token/refresh/`, {
            refresh: refreshToken
          }).pipe(
            switchMap((response) => {
              localStorage.setItem('access_token', response.access);
              const retryReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${response.access}`)
              });
              return next(retryReq);
            }),
            catchError(() => {
              authService.logout();
              router.navigate(['/login']);
              return throwError(() => error);
            })
          );
        } else {
          authService.logout();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};