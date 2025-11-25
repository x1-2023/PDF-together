import { useEffect, useRef, useCallback } from 'react';
import { usePDFStore } from '@/store/usePDFStore';
import { useUIStore } from '@/store/useUIStore';
import { Annotation, PathAnnotation, TextAnnotation } from '@/types';

const WS_URL = 'ws://localhost:3001';

export const useWebSocket = (channelId: string, userId: string, username: string) => {
    const ws = useRef<WebSocket | null>(null);
    const { addAnnotation, removeAnnotation, updateAnnotation, setAnnotations } = usePDFStore();

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
                // Assuming message.data.annotations exists and is compatible
                // We might need to map backend types to frontend types if they differ
                // For now, let's assume they are close enough or we just handle ops
                break;

            case 'draw_broadcast':
                // Convert backend DrawOp to frontend PathAnnotation
                const drawOp = message.op;
                const pathAnn: PathAnnotation = {
                    id: drawOp.id,
                    type: 'path', // or highlight based on opacity/width? Backend doesn't distinguish?
                    // Wait, backend has 'draw' type. Frontend has 'path' | 'highlight' | 'eraser'
                    // We need to map this.
                    // For now let's assume standard path
                    page: drawOp.page,
                    userId: drawOp.userId,
                    points: drawOp.path,
                    color: drawOp.color,
                    width: drawOp.size,
                    opacity: drawOp.opacity
                };
                // Check if highlight based on opacity/width heuristic if needed, 
                // or better, update backend to store type.
                // For now, trust the incoming data.
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
                // If it exists, update it, otherwise add it
                // We can use updateAnnotation which usually handles both if we modify store
                // But store has separate add/update.
                // Let's check if it exists
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

    useEffect(() => {
        connect();
        return () => {
            ws.current?.close();
        };
    }, [connect]);

    return { sendAnnotation, deleteAnnotation };
};
