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
        return notifications.filter(n => !dismissed.includes(this.getKey(n)));
      })
    );
  }

  dismissNotification(notification: Notification) {
    const dismissed = this.getDismissed();
    const key = this.getKey(notification);
    if (!dismissed.includes(key)) {
      dismissed.push(key);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(dismissed));
    }
  }

  clearAll(notifications: Notification[]) {
    const dismissed = this.getDismissed();
    notifications.forEach(n => {
      const key = this.getKey(n);
      if (!dismissed.includes(key)) dismissed.push(key);
    });
    localStorage.setItem(this.getStorageKey(), JSON.stringify(dismissed));
  }

  private getKey(n: Notification): string {
    return `${n.type}-${n.id}-${n.time}`;
  }

  private getStorageKey(): string {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      return `dismissed_notifications_${parsed.id}`;
    }
    return 'dismissed_notifications';
  }

  private getDismissed(): string[] {
    const raw = localStorage.getItem(this.getStorageKey());
    return raw ? JSON.parse(raw) : [];
  }
}