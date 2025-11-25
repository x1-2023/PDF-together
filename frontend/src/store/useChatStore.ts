import { create } from 'zustand';

export interface User {
    id: string;
    name: string;
    avatar?: string;
    color: string;
    status: 'online' | 'away' | 'offline';
}

export interface Message {
    id: string;
    userId: string;
    content: string;
    timestamp: string;
}

interface ChatState {
    users: User[];
    messages: Message[];
    isConnected: boolean;
    currentUser: User | null;

    setUsers: (users: User[]) => void;
    addMessage: (message: Message) => void;
    setConnected: (connected: boolean) => void;
    setCurrentUser: (user: User) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    users: [],
    messages: [],
    isConnected: false,
    currentUser: null,

    setUsers: (users) => set({ users }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
    setConnected: (connected) => set({ isConnected: connected }),
    setCurrentUser: (user) => set({ currentUser: user }),
}));
