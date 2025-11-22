export interface DrawOp {
  id: string;
  type: 'draw';
  page: number;
  path: { x: number; y: number }[];
  color: string;
  size: number;
  userId: string;
  ts: number;
}

export interface TextOp {
  id: string;
  type: 'text';
  page: number;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  userId: string;
  ts: number;
}

export interface StickyOp {
  id: string;
  type: 'sticky';
  page: number;
  x: number;
  y: number;
  text: string;
  color: string; // Background color
  userId: string;
  ts: number;
}

export interface RoomState {
  channelId: string;
  currentPdfId: string | null;
  currentPage: number;
  drawOps: DrawOp[];
  textOps: TextOp[];
  stickyOps: StickyOp[];
}

export interface UserProfile {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

export type WSMessage =
  | { type: 'set_pdf'; pdfId: string | null }
  | { type: 'change_page'; page: number }
  | { type: 'snapshot'; data: RoomState }
  | { type: 'draw_broadcast'; op: DrawOp }
  | { type: 'text_broadcast'; op: TextOp }
  | { type: 'sticky_broadcast'; op: StickyOp }
  | { type: 'clear_page_broadcast'; page: number }
  | { type: 'delete_annotation_broadcast'; id: string }
  | {
    type: 'cursor';
    userId: string;
    x: number;
    y: number;
    color: string;
  }
  | { type: 'pdf_deleted'; pdfId: string }
  | { type: 'user_joined'; user: UserProfile }
  | { type: 'user_left'; userId: string };

export interface DiscordInfo {
  userId: string;
  channelId: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

export type Tool = 'draw' | 'text' | 'sticky' | 'eraser';

