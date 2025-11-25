import { useEffect, useRef, useCallback, useState } from 'react';
import { usePDFStore } from '@/store/usePDFStore';
import { useUIStore } from '@/store/useUIStore';
import { Annotation, PathAnnotation, TextAnnotation } from '@/types';

const WS_URL = 'ws://localhost:3001';

export interface ChatMessage {
    id: string;
    userId: string;
    text: string;
    timestamp: string;
    isSystem?: boolean;
    user?: string; // Optional username for display
    color?: string; // Optional color for display
}

export const useWebSocket = (channelId: string, userId: string, username: string) => {
    const ws = useRef<WebSocket | null>(null);
    const { addAnnotation, removeAnnotation, updateAnnotation, setAnnotations } = usePDFStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const connect = useCallback(() => {
        if (ws.current?.readyState === WebSocket.OPEN) return;

        const url = `${WS_URL}?channelId=${channelId}&userId=${userId}&username=${username}`;
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
            console.log('Connected to WebSocket');
        };

        ws.current.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleMessage(message);
            } catch (err) {
                console.error('Error parsing WS message:', err);
            }
        };

        ws.current.onclose = () => {
            console.log('Disconnected from WebSocket');
            // Reconnect logic could go here
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }, [channelId, userId, username]);

    const handleMessage = (message: any) => {
        switch (message.type) {
            case 'snapshot':
                // Load initial state
                break;

            case 'draw_broadcast':
                const drawOp = message.op;
                const pathAnn: PathAnnotation = {
                    id: drawOp.id,
                    type: 'path',
                    page: drawOp.page,
                    userId: drawOp.userId,
                    points: drawOp.path,
                    color: drawOp.color,
                    width: drawOp.size,
                    opacity: drawOp.opacity
                };
                if (drawOp.opacity < 1) pathAnn.type = 'highlight';
                addAnnotation(pathAnn);
                break;

            case 'text_broadcast':
                const textOp = message.op;
                const textAnn: TextAnnotation = {
                    id: textOp.id,
                    type: 'text',
                    page: textOp.page,
                    userId: textOp.userId,
                    x: textOp.x,
                    y: textOp.y,
                    width: textOp.width,
                    height: textOp.height,
                    text: textOp.text,
                    color: textOp.color,
                    fontSize: textOp.fontSize,
                    fontFamily: textOp.fontFamily
                };
                const exists = usePDFStore.getState().annotations.some(a => a.id === textAnn.id);
                if (exists) {
                    updateAnnotation(textAnn);
                } else {
                    addAnnotation(textAnn);
                }
                break;

            case 'delete_annotation_broadcast':
                removeAnnotation(message.id);
                break;

            case 'chat':
                setMessages(prev => [...prev, message.data]);
                break;
        }
    };

    const sendAnnotation = (annotation: Annotation) => {
        if (ws.current?.readyState !== WebSocket.OPEN) return;

        if (annotation.type === 'text') {
            const textAnn = annotation as TextAnnotation;
            ws.current.send(JSON.stringify({
                type: 'text',
                id: textAnn.id,
                page: textAnn.page,
                x: textAnn.x,
                y: textAnn.y,
                width: textAnn.width,
                height: textAnn.height,
                text: textAnn.text,
                color: textAnn.color,
                fontSize: textAnn.fontSize,
                fontFamily: textAnn.fontFamily
            }));
        } else if (annotation.type === 'path' || annotation.type === 'highlight' || annotation.type === 'eraser') {
            const pathAnn = annotation as PathAnnotation;
            ws.current.send(JSON.stringify({
                type: 'draw',
                id: pathAnn.id,
                page: pathAnn.page,
                path: pathAnn.points,
                color: pathAnn.color,
                size: pathAnn.width,
                opacity: pathAnn.opacity
            }));
        }
    };

    const deleteAnnotation = (id: string) => {
        if (ws.current?.readyState !== WebSocket.OPEN) return;
        ws.current.send(JSON.stringify({
            type: 'delete_annotation',
            id
        }));
    };

    const sendMessage = (text: string) => {
        if (ws.current?.readyState !== WebSocket.OPEN) return;

        const messageData: ChatMessage = {
            id: Date.now().toString(),
            userId,
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            user: username,
            color: 'bg-primary' // Default color, could be randomized or from user profile
        };

        // Optimistic update
        setMessages(prev => [...prev, messageData]);

        ws.current.send(JSON.stringify({
            type: 'chat',
            data: messageData
        }));
    };

    useEffect(() => {
        connect();
        return () => {
            ws.current?.close();
        };
    }, [connect]);

    return { sendAnnotation, deleteAnnotation, sendMessage, messages };
};
