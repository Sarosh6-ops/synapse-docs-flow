import { Timestamp } from "firebase/firestore";

export interface Document {
  id: string;
  title: string;
  type: string;
  uploadedAt: Timestamp;
  status: "analyzed" | "processing" | "failed";
  aiScore: number | null;
  size: number;
  insights: number;
  uid: string;
  downloadUrl: string;
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
