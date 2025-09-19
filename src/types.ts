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
