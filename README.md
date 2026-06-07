# Online Job Offer Platform

A full-stack job portal platform built with Django REST Framework and Angular 17, developed as an end-of-semester project at Institut Universitaire Saint Jean.

**Instructor:** Mr. KINKEU Daniel  
**Deadline:** June 8, 2026

---

## 🚀 Features

### For Job Seekers
- Register and create a profile
- Browse and filter job offers by category, type, and location
- View detailed job descriptions
- Apply for jobs with CV upload and cover letter
- Track application status (Pending, Accepted, Rejected)
- Receive notifications when recruiters respond

### For Recruiters
- Post and manage job offers
- View and manage applications for each job
- Accept or reject applicants with personalized messages
- Notification system for new applications

### For Administrators
- Dashboard with platform statistics
- Manage all job offers (cancel/delete)
- View all applications
- Notification system for new registrations and job posts

---

## 🛠️ Tech Stack

**Backend:**
- Python 3.14
- Django 6.0
- Django REST Framework
- SimpleJWT (authentication)
- SQLite (development) / PostgreSQL (production)
- PyOTP (2FA for admin)

**Frontend:**
- Angular 17
- Bootstrap 5.3
- FontAwesome 6.4
- TypeScript

---

## ⚙️ Installation

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create a `.env` file in the backend folder:
Run migrations and start server:
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend/job-portal
npm install
ng serve
```

---

## 🔐 User Roles

| Role | Access |
|------|--------|
| **Seeker** | Browse jobs, apply, track applications |
| **Recruiter** | Post jobs, manage applications, send messages |
| **Admin** | Full platform access, statistics, moderation |

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register/` | POST | Register new user |
| `/api/auth/login/` | POST | Login and get JWT token |
| `/api/jobs/` | GET/POST | List/create jobs |
| `/api/applications/` | GET/POST | List/create applications |
| `/api/messages/` | GET/POST | Recruitment messages |
| `/api/notifications/` | GET | User notifications |
| `/api/admin-stats/` | GET | Platform statistics |
| `/api/profile/` | GET/PATCH | User profile |

---

## 🌐 Deployment

- **Backend:** Render.com
- **Frontend:** Vercel.com

---

## 👨‍💻 Developer

**DJEUFACK WILSON**  
Institut Universitaire Saint Jean  
GitHub: [DJEUFACKWILSON](https://github.com/DJEUFACKWILSON)