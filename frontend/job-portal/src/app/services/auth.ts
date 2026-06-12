import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  constructor(private http: HttpClient) {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    if (user.profile_picture && !user.profile_picture.startsWith('http')) {
      user.profile_picture = `https://online-job-offer-backend.onrender.com${user.profile_picture}`;
    }
    this.currentUserSubject.next(user);
  }
}
  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register/`, data);
  }
  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login/`, data).pipe(
   tap(response => {
  if (response.user.profile_picture && !response.user.profile_picture.startsWith('http')) {
    response.user.profile_picture = `https://online-job-offer-backend.onrender.com${response.user.profile_picture}`;
  }
  localStorage.setItem('access_token', response.access);
  localStorage.setItem('refresh_token', response.refresh);
  localStorage.setItem('user', JSON.stringify(response.user));
  this.currentUserSubject.next(response.user);
})
    );
  }
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }
  updateProfile(data: FormData): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/profile/`, data).pipe(
  tap(user => {
  if (user.profile_picture && !user.profile_picture.startsWith('http')) {
    user.profile_picture = `https://online-job-offer-backend.onrender.com${user.profile_picture}`;
  }
  localStorage.setItem('user', JSON.stringify(user));
  this.currentUserSubject.next(user);
})
    );
  }
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile/`).pipe(
      tap(user => {
  if (user.profile_picture && !user.profile_picture.startsWith('http')) {
    user.profile_picture = `https://online-job-offer-backend.onrender.com${user.profile_picture}`;
  }
  localStorage.setItem('user', JSON.stringify(user));
  this.currentUserSubject.next(user);
})
    )
  }
}
