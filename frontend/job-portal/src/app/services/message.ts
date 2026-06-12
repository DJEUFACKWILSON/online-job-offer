import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Message, MessageRequest } from '../models/message';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMyMessages(): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/`);
  }

  getMessageByApplication(applicationId: number): Observable<Message> {
    return this.http.get<Message>(`${this.apiUrl}/messages/?application=${applicationId}`);
  }

  sendMessage(data: MessageRequest): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/messages/`, data);
  }

  getAllMessages(): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/messages/`);
  }
}
