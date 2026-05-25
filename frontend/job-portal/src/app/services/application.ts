import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Application, ApplicationRequest } from '../models/application';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMyApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}/applications/`);
  }

  getApplicationById(id: number): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/applications/${id}/`);
  }

  applyToJob(data: FormData): Observable<Application> {
    return this.http.post<Application>(`${this.apiUrl}/applications/`, data);
  }

  getJobApplications(jobId: number): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}/applications/?job_offer=${jobId}`);
  }

  updateApplicationStatus(id: number, status: string): Observable<Application> {
    return this.http.patch<Application>(`${this.apiUrl}/applications/${id}/`, { status });
  }

  getAllApplications(): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}/applications/`);
  }
}