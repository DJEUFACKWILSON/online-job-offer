export interface Application {
  id: number;
  job_offer: number;
  job_title: string;
  applicant: number;
  applicant_name: string;
  full_name: string;
  email: string;
  phone: string;
  cover_letter?: string;
  cv: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  applied_at: string;
}

export interface ApplicationRequest {
  job_offer: number;
  full_name: string;
  email: string;
  phone: string;
  cover_letter?: string;
  cv: File;
}