import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { JobOffer, JobOfferRequest } from '../models/job-offer';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllJobs(filters?: any): Observable<JobOffer[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get<JobOffer[]>(`${this.apiUrl}/jobs/`, { params });
  }

  getJobById(id: number): Observable<JobOffer> {
    return this.http.get<JobOffer>(`${this.apiUrl}/jobs/${id}/`);
  }

  createJob(data: FormData): Observable<JobOffer> {
    return this.http.post<JobOffer>(`${this.apiUrl}/jobs/`, data);
  }

  updateJob(id: number, data: FormData): Observable<JobOffer> {
    return this.http.patch<JobOffer>(`${this.apiUrl}/jobs/${id}/`, data);
  }

  deleteJob(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/jobs/${id}/`);
  }

  cancelJob(id: number): Observable<any> {
  return this.http.patch(`${this.apiUrl}/jobs/${id}/cancel/`, {});
}
  enableJob(id: number): Observable<any> {
  return this.http.patch(`${this.apiUrl}/jobs/${id}/enable/`, {});
  }
  getActiveJobs(): Observable<JobOffer[]> {
    return this.http.get<JobOffer[]>(`${this.apiUrl}/jobs/all-active/`);
  }
}