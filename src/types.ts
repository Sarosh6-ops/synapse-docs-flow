import { Timestamp } from "firebase/firestore";

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

export interface Document {
    id: string;
    title: string;
    type: string;
    size: number;
    uploadedAt: Timestamp;
    status: 'analyzed' | 'processing' | 'error';
    insights: number;
    downloadURL: string;
    aiScore: number | null;
  }
