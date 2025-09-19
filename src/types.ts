import { Timestamp } from "firebase/firestore";

export interface Document {
  id: string;
  title: string;
  storagePath: string;
  status: 'processing' | 'analyzed' | 'archived' | 'failed';
  uploadedAt: Timestamp;
  userId: string;
  size: number;
  type: string;
  aiScore?: number;
  insights?: number;
  summary?: string;
  keyPoints?: string[];
  actionItems?: any[];
  alerts?: any[];
}

export interface Message {
  id: string;
  sender: string;
  senderId: string;
  content: string;
  timestamp: Timestamp;
  isBot?: boolean;
  isSystem?: boolean;
  chatId?: string;
  participants?: string[];
}
