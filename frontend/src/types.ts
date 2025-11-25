export interface User {
    id: string;
    username: string;
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

export type AnnotationType = 'path' | 'text' | 'highlight';

export interface BaseAnnotation {
    id: string;
    type: AnnotationType;
    page: number;
    userId: string;
}

export interface PathAnnotation extends BaseAnnotation {
    type: 'path' | 'highlight';
    points: { x: number; y: number }[];
    color: string;
    width: number;
    opacity: number;
}

export interface TextAnnotation extends BaseAnnotation {
    type: 'text';
    x: number;
    y: number;
    width?: number;
    height?: number;
    text: string;
    fontSize: number;
    color: string;
    fontFamily?: string;
}

export type Annotation = PathAnnotation | TextAnnotation;
