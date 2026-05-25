export interface Message {
  id: number;
  application: number;
  sender: number;
  content: string;
  is_positive: boolean;
  sent_at: string;
}

export interface MessageRequest {
  application: number;
  content: string;
  is_positive: boolean;
}