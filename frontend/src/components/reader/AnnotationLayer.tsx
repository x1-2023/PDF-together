import React, { useRef, useEffect, useState } from 'react';
import { ToolType, Annotation, PathAnnotation, TextAnnotation } from '../../types';

interface AnnotationLayerProps {
    pageNumber: number;
    scale: number;
    activeTool: ToolType;
    annotations: Annotation[];
    onAnnotationAdd: (annotation: Annotation) => void;
    onAnnotationRemove: (annotationId: string) => void;
    userId: string;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
    pageNumber,
    scale,
    activeTool,
    annotations,
    onAnnotationAdd,
    onAnnotationRemove,
    userId
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

    // Text Tool State
    const [isDraggingText, setIsDraggingText] = useState(false);
    const [textStartPos, setTextStartPos] = useState<{ x: number; y: number } | null>(null);
    const [textCurrentPos, setTextCurrentPos] = useState<{ x: number; y: number } | null>(null);
    const [activeTextEditor, setActiveTextEditor] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);

    // Helper to get coordinates relative to canvas
    const getCoords = (e: React.MouseEvent | MouseEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale
        };
    };

    // Render annotations
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Scale context
        ctx.save();
        ctx.scale(scale, scale);

        // Render all annotations
        annotations.forEach(ann => {
            if (ann.page !== pageNumber) return;

            if (ann.type === 'path' || ann.type === 'highlight') {
                const pathAnn = ann as PathAnnotation;
                if (pathAnn.points.length < 2) return;

                ctx.beginPath();
                ctx.moveTo(pathAnn.points[0].x, pathAnn.points[0].y);
                pathAnn.points.forEach(p => ctx.lineTo(p.x, p.y));

                ctx.strokeStyle = pathAnn.color;
                ctx.lineWidth = pathAnn.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalAlpha = pathAnn.opacity;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            } else if (ann.type === 'text') {
                const textAnn = ann as TextAnnotation;
                ctx.font = `${textAnn.fontSize}px "${textAnn.fontFamily || 'Inter'}"`;
                ctx.fillStyle = textAnn.color;
                ctx.textBaseline = 'top';

                // Simple text wrapping
                const words = textAnn.text.split(' ');
                let line = '';
                let y = textAnn.y;
                const lineHeight = textAnn.fontSize * 1.2;
                const maxWidth = textAnn.width || 200;

                words.forEach(word => {
                    const testLine = line + word + ' ';
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && line !== '') {
                        ctx.fillText(line, textAnn.x, y);
                        line = word + ' ';
                        y += lineHeight;
                    } else {
                        line = testLine;
                    }
                });
                ctx.fillText(line, textAnn.x, y);
            }
        });

        // Render current drawing path
        if (isDrawing && currentPath.length > 0 && (activeTool === ToolType.PEN || activeTool === ToolType.HIGHLIGHT)) {
            ctx.beginPath();
            ctx.moveTo(currentPath[0].x, currentPath[0].y);
            currentPath.forEach(p => ctx.lineTo(p.x, p.y));

            ctx.strokeStyle = activeTool === ToolType.HIGHLIGHT ? '#FFFF00' : '#EF4444'; // Red for pen, Yellow for highlight
            ctx.lineWidth = activeTool === ToolType.HIGHLIGHT ? 20 : 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = activeTool === ToolType.HIGHLIGHT ? 0.4 : 1.0;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // Render text selection box
        if (isDraggingText && textStartPos && textCurrentPos) {
            const x = Math.min(textStartPos.x, textCurrentPos.x);
            const y = Math.min(textStartPos.y, textCurrentPos.y);
            const w = Math.abs(textCurrentPos.x - textStartPos.x);
            const h = Math.abs(textCurrentPos.y - textStartPos.y);

            ctx.strokeStyle = '#4F46E5';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, w, h);
            ctx.setLineDash([]);

            ctx.fillStyle = 'rgba(79, 70, 229, 0.1)';
            ctx.fillRect(x, y, w, h);
        }

        ctx.restore();
    }, [annotations, scale, pageNumber, isDrawing, currentPath, activeTool, isDraggingText, textStartPos, textCurrentPos]);

    // Mouse Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (activeTool === ToolType.MOVE) return;

        const coords = getCoords(e);

        if (activeTool === ToolType.PEN || activeTool === ToolType.HIGHLIGHT) {
            setIsDrawing(true);
            setCurrentPath([coords]);
        } else if (activeTool === ToolType.TEXT) {
            setIsDraggingText(true);
            setTextStartPos(coords);
            setTextCurrentPos(coords);
        } else if (activeTool === ToolType.ERASER) {
            // Eraser logic: find intersected annotation and remove
            // Simple bounding box check for now
            const hitRadius = 10 / scale;
            const hitAnnotation = annotations.find(ann => {
                if (ann.page !== pageNumber) return false;
                if (ann.type === 'path' || ann.type === 'highlight') {
                    const pathAnn = ann as PathAnnotation;
                    return pathAnn.points.some(p =>
                        Math.abs(p.x - coords.x) < hitRadius && Math.abs(p.y - coords.y) < hitRadius
                    );
                } else if (ann.type === 'text') {
                    const textAnn = ann as TextAnnotation;
                    return coords.x >= textAnn.x && coords.x <= textAnn.x + (textAnn.width || 100) &&
                        coords.y >= textAnn.y && coords.y <= textAnn.y + (textAnn.height || 20);
                }
                return false;
            });

            if (hitAnnotation) {
                onAnnotationRemove(hitAnnotation.id);
            }
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (activeTool === ToolType.MOVE) return;
        const coords = getCoords(e);

        if (isDrawing) {
            setCurrentPath(prev => [...prev, coords]);
        } else if (isDraggingText) {
            setTextCurrentPos(coords);
        } else if (activeTool === ToolType.ERASER && e.buttons === 1) {
            // Drag eraser
            handleMouseDown(e);
        }
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            if (currentPath.length > 1) {
                const newAnnotation: PathAnnotation = {
                    id: Date.now().toString(),
                    type: activeTool === ToolType.HIGHLIGHT ? 'highlight' : 'path',
                    page: pageNumber,
                    userId,
                    points: currentPath,
                    color: activeTool === ToolType.HIGHLIGHT ? '#FFFF00' : '#EF4444',
                    width: activeTool === ToolType.HIGHLIGHT ? 20 : 2,
                    opacity: activeTool === ToolType.HIGHLIGHT ? 0.4 : 1.0
                };
                onAnnotationAdd(newAnnotation);
            }
            setCurrentPath([]);
        } else if (isDraggingText && textStartPos && textCurrentPos) {
            setIsDraggingText(false);
            const width = Math.abs(textCurrentPos.x - textStartPos.x);
            const height = Math.abs(textCurrentPos.y - textStartPos.y);

            if (width > 10 && height > 10) {
                setActiveTextEditor({
                    x: Math.min(textStartPos.x, textCurrentPos.x),
                    y: Math.min(textStartPos.y, textCurrentPos.y),
                    width,
                    height
                });
            }
            setTextStartPos(null);
            setTextCurrentPos(null);
        }
    };

    const handleTextSubmit = (text: string) => {
        if (activeTextEditor && text.trim()) {
            const newAnnotation: TextAnnotation = {
                id: Date.now().toString(),
                type: 'text',
                page: pageNumber,
                userId,
                x: activeTextEditor.x,
                y: activeTextEditor.y,
                width: activeTextEditor.width,
                height: activeTextEditor.height,
                text,
                fontSize: 16,
                color: '#000000',
                fontFamily: 'Patrick Hand'
            };
            onAnnotationAdd(newAnnotation);
        }
        setActiveTextEditor(null);
    };

    return (
        <div
            ref={containerRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
        >
            <canvas
                ref={canvasRef}
                className={`w-full h-full ${activeTool !== ToolType.MOVE ? 'pointer-events-auto cursor-crosshair' : ''}`}
                width={containerRef.current?.clientWidth || 800}
                height={containerRef.current?.clientHeight || 1100}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />

            {activeTextEditor && (
                <div
                    className="absolute pointer-events-auto"
                    style={{
                        left: activeTextEditor.x * scale,
                        top: activeTextEditor.y * scale,
                        width: activeTextEditor.width * scale,
                        height: activeTextEditor.height * scale,
                    }}
                >
                    <textarea
                        autoFocus
                        className="w-full h-full bg-yellow-100/50 border border-blue-500 p-1 resize-none outline-none text-black"
                        style={{
                            fontFamily: '"Patrick Hand", cursive',
                            fontSize: `${16 * scale}px`,
                            lineHeight: 1.2
                        }}
                        onBlur={(e) => handleTextSubmit(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleTextSubmit(e.currentTarget.value);
                            }
                            if (e.key === 'Escape') {
                                setActiveTextEditor(null);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};
