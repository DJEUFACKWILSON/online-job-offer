export interface JobOffer {
  id: number;
  recruiter: number;
  recruiter_name: string;
  title: string;
  description: string;
  location: string;
  salary?: string;
  skills_required: string;
  job_type: string;
  job_type_display: string;
  category: string;
  category_display: string;
  experience_level: string;
  experience_display: string;
  positions_available: number;
  deadline?: string;
  photo?: string;
  status: 'active' | 'cancelled' | 'closed';
  created_at: string;
  updated_at: string;
  is_expired: boolean;
}

export interface JobOfferRequest {
  title: string;
  description: string;
  location: string;
  salary?: string;
  skills_required: string;
  job_type: string;
  category: string;
  experience_level: string;
  positions_available: number;
  deadline?: string;
  photo?: File;
  status?: string;
}