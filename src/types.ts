import { Timestamp } from "firebase/firestore";

export interface Document {
  id: string;
  uid: string;
  title: string;
  type: string;
  size: number;
  downloadUrl: string;
  uploadedAt: Timestamp;
  status: 'processing' | 'analyzed' | 'failed';
  aiSummary?: string;
  aiScore?: number | null;
  insights?: number;
  content?: string;
}

export interface AiInsights {
  summary: string;
  keyPoints: string[];
  actionItems: {
    priority: 'high' | 'medium' | 'low';
    item: string;
    department: string;
  }[];
  alerts: {
    type: 'warning' | 'info';
    message: string;
  }[];
  confidence: number;
  processingTime: string;
}

export interface Message {
  id: string;
  sender: string;
  senderId: string;
  content: string;
  timestamp: Timestamp;
  isBot?: boolean;
  isSystem?: boolean;
}
