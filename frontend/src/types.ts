export interface User {
  id: string;
  name: string;
  avatar: string;
}

export type SessionStatus = 'active' | 'upcoming' | 'completed';

export interface Session {
  id: string;
  title: string;
  thumbnail: string;
  userCount: number;
  status: SessionStatus;
  users: User[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: string; // e.g. "8 hours ago" or "10m"
  isSystem?: boolean;
}

export enum ToolType {
  MOVE = 'move',
  PEN = 'pen',
  HIGHLIGHT = 'highlight',
  TEXT = 'text',
  STICKY = 'sticky',
  ERASER = 'eraser',
  AI = 'ai'
}

export interface Page {
  id: number;
  thumbnailUrl: string;
  fullUrl: string;
}