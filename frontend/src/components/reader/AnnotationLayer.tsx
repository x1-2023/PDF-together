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
    activeColor: string;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
    pageNumber,
    scale,
    activeTool,
    annotations,
    onAnnotationAdd,
    onAnnotationRemove,
    userId,
    activeColor
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

    // Move tool state
    const [isMoving, setIsMoving] = useState(false);
    const [movingAnnotationId, setMovingAnnotationId] = useState<string | null>(null);
    const [moveStartPos, setMoveStartPos] = useState<{ x: number; y: number } | null>(null);

    // Text tool state
    const [isDraggingText, setIsDraggingText] = useState(false);
    const [textStartPos, setTextStartPos] = useState<{ x: number; y: number } | null>(null);
    const [textCurrentPos, setTextCurrentPos] = useState<{ x: number; y: number } | null>(null);
    const [activeTextEditor, setActiveTextEditor] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
        annotationId?: string;
    } | null>(null);
    const [editingText, setEditingText] = useState("");

    const [forceRender, setForceRender] = useState(0);

    // Helper to get coordinates
    const getCoords = (e: React.MouseEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale
        };
    };

    // Load Dancing Script font
    useEffect(() => {
        if (document.fonts) {
            document.fonts.load('20px "Dancing Script"').then(() => {
                setForceRender(prev => prev + 1);
            }).catch(err => {
                console.error('Failed to load Dancing Script font:', err);
            });

            // Also listen for ready promise
            document.fonts.ready.then(() => {
                setForceRender(prev => prev + 1);
            });
        }
    }, []);

    // We need a state to track canvas size changes to trigger re-render
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Update canvas size with ResizeObserver
    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const updateSize = () => {
            if (containerRef.current && canvasRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                if (clientWidth > 0 && clientHeight > 0 && (canvasRef.current.width !== clientWidth || canvasRef.current.height !== clientHeight)) {
                    canvasRef.current.width = clientWidth;
                    canvasRef.current.height = clientHeight;
                    setCanvasSize({ width: clientWidth, height: clientHeight });
                }
            }
        };

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(containerRef.current);

        updateSize();

        return () => {
            resizeObserver.disconnect();
        };
    }, [scale]);

    // Render annotations
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const render = () => {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.scale(scale, scale);

            // Render existing annotations
            if (Array.isArray(annotations)) {
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
                        const fontFamily = textAnn.fontFamily || 'Dancing Script';
                        const fontSize = textAnn.fontSize || 20;

                        ctx.font = `${fontSize}px "${fontFamily}", cursive`;
                        if (fontFamily === 'Arial') {
                            ctx.font = `${fontSize}px Arial, sans-serif`;

                            // Draw sticky note background
                            const padding = 10;
                            const width = textAnn.width || 200;
                            const height = textAnn.height || 100;

                            ctx.save();
                            ctx.fillStyle = '#FEF3C7'; // yellow-100
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                            ctx.shadowBlur = 10;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 4;
                            ctx.fillRect(textAnn.x, textAnn.y, width, height);

                            // Draw border
                            ctx.strokeStyle = '#FBBF24'; // yellow-400
                            ctx.lineWidth = 1;
                            ctx.strokeRect(textAnn.x, textAnn.y, width, height);
                            ctx.restore();

                            // Adjust text position for padding
                            ctx.fillStyle = '#000000';
                            ctx.textBaseline = 'top';

                            // Simple text wrapping
                            const words = textAnn.text.split(' ');
                            let line = '';
                            let y = textAnn.y + padding;
                            const lineHeight = fontSize * 1.2;
                            const maxWidth = width - (padding * 2);

                            for (let n = 0; n < words.length; n++) {
                                const testLine = line + words[n] + ' ';
                                const metrics = ctx.measureText(testLine);
                                const testWidth = metrics.width;
                                if (testWidth > maxWidth && n > 0) {
                                    ctx.fillText(line, textAnn.x + padding, y);
                                    line = words[n] + ' ';
                                    y += lineHeight;
                                }
                                else {
                                    line = testLine;
                                }
                            }
                            ctx.fillText(line, textAnn.x + padding, y);

                        } else {
                            ctx.fillStyle = textAnn.color;
                            ctx.textBaseline = 'top';
                            ctx.fillText(textAnn.text, textAnn.x, textAnn.y);
                        }
                    }
                });
            }

            // Render current drawing path
            if (isDrawing && currentPath.length > 0) {
                ctx.beginPath();
                ctx.moveTo(currentPath[0].x, currentPath[0].y);
                currentPath.forEach(p => ctx.lineTo(p.x, p.y));

                ctx.strokeStyle = activeTool === ToolType.HIGHLIGHT ? '#FFFF00' : activeColor;
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
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(x, y, w, h);
                ctx.setLineDash([]);

                ctx.fillStyle = 'rgba(79, 70, 229, 0.1)';
                ctx.fillRect(x, y, w, h);
            }

            ctx.restore();
        };

        // Use requestAnimationFrame to ensure we draw after layout updates
        const rAF = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(rAF);
        };

    }, [annotations, scale, pageNumber, isDrawing, currentPath, activeTool, isDraggingText, textStartPos, textCurrentPos, activeColor, canvasSize, forceRender]);

    // Brush eraser helper
    const eraseAtPosition = (coords: { x: number; y: number }) => {
        const hitRadius = 15 / scale; // Brush size
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
                    coords.y >= textAnn.y && coords.y <= textAnn.y + (textAnn.height || 30);
            }
            return false;
        });

        if (hitAnnotation) {
            onAnnotationRemove(hitAnnotation.id);
        }
    };

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const coords = getCoords(e);

        if (activeTool === ToolType.MOVE) {
            const hitAnnotation = [...annotations].reverse().find(ann => {
                if (ann.page !== pageNumber || ann.type !== 'text') return false;
                const textAnn = ann as TextAnnotation;
                return coords.x >= textAnn.x && coords.x <= textAnn.x + (textAnn.width || 100) &&
                    coords.y >= textAnn.y && coords.y <= textAnn.y + (textAnn.height || 30);
            });

            if (hitAnnotation) {
                setIsMoving(true);
                setMovingAnnotationId(hitAnnotation.id);
                setMoveStartPos(coords);
            }
            return;
        }

        if (activeTool === ToolType.PEN || activeTool === ToolType.HIGHLIGHT) {
            setIsDrawing(true);
            setCurrentPath([coords]);
        } else if (activeTool === ToolType.TEXT || activeTool === ToolType.STICKY) {
            setIsDraggingText(true);
            setTextStartPos(coords);
            setTextCurrentPos(coords);
        } else if (activeTool === ToolType.ERASER) {
            eraseAtPosition(coords); // Brush eraser on mousedown
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const coords = getCoords(e);

        if (isMoving && moveStartPos && movingAnnotationId) {
            if (canvasRef.current) {
                canvasRef.current.style.cursor = 'grabbing';
            }
            return;
        }

        if (isDrawing) {
            setCurrentPath(prev => [...prev, coords]);
        } else if (isDraggingText && textStartPos) {
            setTextCurrentPos(coords);
        } else if (activeTool === ToolType.ERASER && e.buttons === 1) {
            eraseAtPosition(coords); // Continue erasing while dragging
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        const coords = getCoords(e);

        if (isMoving && moveStartPos && movingAnnotationId) {
            const dx = coords.x - moveStartPos.x;
            const dy = coords.y - moveStartPos.y;

            const ann = annotations.find(a => a.id === movingAnnotationId);
            if (ann && ann.type === 'text') {
                const textAnn = ann as TextAnnotation;
                const updatedAnn: TextAnnotation = {
                    ...textAnn,
                    x: textAnn.x + dx,
                    y: textAnn.y + dy
                };
                onAnnotationRemove(movingAnnotationId);
                onAnnotationAdd(updatedAnn);
            }

            setIsMoving(false);
            setMovingAnnotationId(null);
            setMoveStartPos(null);
            if (canvasRef.current) {
                canvasRef.current.style.cursor = activeTool === ToolType.MOVE ? 'grab' : 'crosshair';
            }
            return;
        }

        if (isDrawing) {
            setIsDrawing(false);
            if (currentPath.length > 1) {
                const newAnnotation: PathAnnotation = {
                    id: Date.now().toString(),
                    type: activeTool === ToolType.HIGHLIGHT ? 'highlight' : 'path',
                    page: pageNumber,
                    userId,
                    points: currentPath,
                    color: activeTool === ToolType.HIGHLIGHT ? '#FFFF00' : activeColor,
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

            if (width > 20 && height > 20) {
                const editorX = Math.min(textStartPos.x, textCurrentPos.x);
                const editorY = Math.min(textStartPos.y, textCurrentPos.y);
                setActiveTextEditor({
                    x: editorX,
                    y: editorY,
                    width,
                    height
                });
                setEditingText("");
            }
            setTextStartPos(null);
            setTextCurrentPos(null);
        }
    };

    // Double-click to edit existing text
    const handleDoubleClick = (e: React.MouseEvent) => {
        const coords = getCoords(e);

        const hitAnnotation = [...annotations].reverse().find(ann => {
            if (ann.page !== pageNumber || ann.type !== 'text') return false;
            const textAnn = ann as TextAnnotation;
            return coords.x >= textAnn.x && coords.x <= textAnn.x + (textAnn.width || 100) &&
                coords.y >= textAnn.y && coords.y <= textAnn.y + (textAnn.height || 30);
        });

        if (hitAnnotation) {
            const textAnn = hitAnnotation as TextAnnotation;
            onAnnotationRemove(textAnn.id);
            setActiveTextEditor({
                x: textAnn.x,
                y: textAnn.y,
                width: textAnn.width || 200,
                height: textAnn.height || 50,
                annotationId: textAnn.id
            });
            setEditingText(textAnn.text);
        }
    };

    const handleTextBlur = () => {
        if (activeTextEditor && editingText.trim()) {
            const newAnnotation: TextAnnotation = {
                id: activeTextEditor.annotationId || Date.now().toString(),
                type: 'text',
                page: pageNumber,
                userId,
                text: editingText,
                x: activeTextEditor.x,
                y: activeTextEditor.y,
                fontSize: activeTool === ToolType.STICKY ? 16 : 20,
                fontFamily: activeTool === ToolType.STICKY ? 'Arial' : 'Dancing Script',
                color: activeTool === ToolType.STICKY ? '#000000' : activeColor,
                width: activeTextEditor.width,
                height: activeTextEditor.height
            };
            onAnnotationAdd(newAnnotation);
        }
        setActiveTextEditor(null);
        setEditingText("");
    };

    // Update cursor based on tool
    useEffect(() => {
        if (canvasRef.current) {
            if (activeTool === ToolType.MOVE) {
                canvasRef.current.style.cursor = isMoving ? 'grabbing' : 'grab';
            } else {
                canvasRef.current.style.cursor = 'crosshair';
            }
        }
    }, [activeTool, isMoving]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full pointer-events-auto border-2 border-red-500/50"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
            />

            {/* Text Editor Overlay */}
            {activeTextEditor && (
                <div
                    className={`absolute pointer-events-auto ${activeTool === ToolType.STICKY ? 'bg-yellow-100 shadow-xl' : ''}`}
                    style={{
                        left: `${activeTextEditor.x * scale}px`,
                        top: `${activeTextEditor.y * scale}px`,
                        width: `${activeTextEditor.width * scale}px`,
                        height: `${activeTextEditor.height * scale}px`,
                    }}
                >
                    <textarea
                        autoFocus
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={handleTextBlur}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setActiveTextEditor(null);
                                setEditingText("");
                            } else if (e.key === 'Enter' && e.ctrlKey) {
                                handleTextBlur();
                            }
                        }}
                        className={`w-full h-full p-2 border-2 rounded resize-none outline-none shadow-lg ${activeTool === ToolType.STICKY
                            ? 'bg-yellow-100 border-yellow-400'
                            : 'bg-transparent border-primary'
                            }`}
                        style={{
                            fontFamily: activeTool === ToolType.STICKY ? 'Arial, sans-serif' : '"Dancing Script", cursive',
                            fontSize: activeTool === ToolType.STICKY ? `${16 * scale}px` : `${20 * scale}px`,
                            color: activeTool === ToolType.STICKY ? '#000000' : activeColor
                        }}
                        placeholder={activeTool === ToolType.STICKY ? "Sticky note..." : "Type text here... (Ctrl+Enter to save)"}
                    />
                </div>
            )}
        </div>
    );
};
