import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface Notification {
  id: number;
  message: string;
  time: string;
  type: string;
  is_positive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications/`).pipe(
      map(notifications => {
        const dismissed = this.getDismissed();
        return notifications.filter(n => !dismissed.includes(`${n.type}-${n.id}`));
      })
    );
  }

  dismissNotification(notification: Notification) {
    const dismissed = this.getDismissed();
    const key = `${notification.type}-${notification.id}`;
    if (!dismissed.includes(key)) {
      dismissed.push(key);
      localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
    }
  }

  clearAll(notifications: Notification[]) {
    const dismissed = this.getDismissed();
    notifications.forEach(n => {
      const key = `${n.type}-${n.id}`;
      if (!dismissed.includes(key)) dismissed.push(key);
    });
    localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));
  }

  private getDismissed(): string[] {
    const raw = localStorage.getItem('dismissed_notifications');
    return raw ? JSON.parse(raw) : [];
  }
}