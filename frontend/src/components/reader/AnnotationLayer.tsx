import React, { useRef, useEffect, useState } from 'react';
import { ToolType, Annotation, PathAnnotation, TextAnnotation } from '@/types';
import { usePDFStore } from '@/store/usePDFStore';
import { useUIStore } from '@/store/useUIStore';

interface AnnotationLayerProps {
    pageNumber: number;
    scale: number;
    userId?: string;
    onAnnotationCreate?: (annotation: Annotation) => void;
}

export const AnnotationLayer: React.FC<AnnotationLayerProps> = ({
    pageNumber,
    scale,
    userId = 'user-1',
    onAnnotationCreate
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Stores
    const { annotations, addAnnotation, updateAnnotation } = usePDFStore();
    const {
        activeTool,
        activeColor,
        brushSize,
        highlighterSize,
        fontSize,
        textAlignment,
        stickyColor
    } = useUIStore();

    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);

    // Move tool state
    const [isMoving, setIsMoving] = useState(false);
    const [movingAnnotationId, setMovingAnnotationId] = useState<string | null>(null);
    const [moveStartPos, setMoveStartPos] = useState<{ x: number; y: number } | null>(null);

    // Text editor state
    const [activeTextEditor, setActiveTextEditor] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
        annotationId?: string;
        isSticky?: boolean; // Track if editing a sticky note
    } | null>(null);
    const [editingText, setEditingText] = useState("");

    const [forceRender, setForceRender] = useState(0);

    // Filter annotations for this page, excluding currently editing text
    const pageAnnotations = annotations.filter(a =>
        a.page === pageNumber &&
        (activeTextEditor?.annotationId !== a.id)
    );

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

            document.fonts.ready.then(() => {
                setForceRender(prev => prev + 1);
            });
        }
    }, []);

    // Update canvas size
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        const updateSize = () => {
            if (containerRef.current && canvasRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                if (clientWidth > 0 && clientHeight > 0) {
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
            pageAnnotations.forEach(ann => {
                if (ann.type === 'path' || ann.type === 'highlight' || ann.type === 'eraser') {
                    const pathAnn = ann as PathAnnotation;
                    if (pathAnn.points.length < 2) return;

                    ctx.save();
                    if (ann.type === 'eraser') {
                        ctx.globalCompositeOperation = 'destination-out';
                    }

                    ctx.beginPath();
                    ctx.moveTo(pathAnn.points[0].x, pathAnn.points[0].y);
                    pathAnn.points.forEach(p => ctx.lineTo(p.x, p.y));

                    ctx.strokeStyle = pathAnn.color;
                    ctx.lineWidth = pathAnn.width;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.globalAlpha = pathAnn.opacity;
                    ctx.stroke();

                    ctx.restore();
                } else if (ann.type === 'text') {
                    const textAnn = ann as TextAnnotation;
                    const fontFamily = textAnn.fontFamily || 'Dancing Script';
                    const textFontSize = textAnn.fontSize || 20;

                    ctx.font = `${textFontSize}px "${fontFamily}", cursive`;

                    if (fontFamily === 'Arial') {
                        // Sticky note rendering
                        ctx.font = `${textFontSize}px Arial, sans-serif`;

                        const padding = 10;
                        const width = textAnn.width || 200;
                        const height = textAnn.height || 100;

                        // Get sticky color from annotation or use default
                        const bgColor = textAnn.color === '#000000' ? stickyColor : textAnn.color;

                        ctx.save();
                        ctx.fillStyle = bgColor;
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                        ctx.shadowBlur = 10;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 4;
                        ctx.fillRect(textAnn.x, textAnn.y, width, height);

                        // Border
                        ctx.strokeStyle = bgColor === '#FEF3C7' ? '#FBBF24' : '#999';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(textAnn.x, textAnn.y, width, height);
                        ctx.restore();

                        // Text
                        ctx.fillStyle = '#000000';
                        ctx.textBaseline = 'top';

                        // Simple text wrapping
                        const words = textAnn.text.split(' ');
                        let line = '';
                        let y = textAnn.y + padding;
                        const lineHeight = textFontSize * 1.2;
                        const maxWidth = width - (padding * 2);

                        for (let n = 0; n < words.length; n++) {
                            const testLine = line + words[n] + ' ';
                            const metrics = ctx.measureText(testLine);
                            if (metrics.width > maxWidth && n > 0) {
                                ctx.fillText(line, textAnn.x + padding, y);
                                line = words[n] + ' ';
                                y += lineHeight;
                            } else {
                                line = testLine;
                            }
                        }
                        ctx.fillText(line, textAnn.x + padding, y);

                    } else {
                        // Regular text rendering
                        ctx.fillStyle = textAnn.color;
                        ctx.textBaseline = 'top';

                        // Apply text alignment
                        if (textAlignment === 'center') {
                            ctx.textAlign = 'center';
                            ctx.fillText(textAnn.text, textAnn.x + (textAnn.width || 0) / 2, textAnn.y);
                        } else if (textAlignment === 'right') {
                            ctx.textAlign = 'right';
                            ctx.fillText(textAnn.text, textAnn.x + (textAnn.width || 0), textAnn.y);
                        } else {
                            ctx.textAlign = 'left';
                            ctx.fillText(textAnn.text, textAnn.x, textAnn.y);
                        }
                    }
                }
            });

            // Render current drawing path
            if (isDrawing && currentPath.length > 0) {
                ctx.save();
                if (activeTool === ToolType.ERASER) {
                    ctx.globalCompositeOperation = 'destination-out';
                }

                ctx.beginPath();
                ctx.moveTo(currentPath[0].x, currentPath[0].y);
                currentPath.forEach(p => ctx.lineTo(p.x, p.y));

                ctx.strokeStyle = activeTool === ToolType.HIGHLIGHT ? activeColor : (activeTool === ToolType.ERASER ? '#000000' : activeColor);
                ctx.lineWidth = activeTool === ToolType.HIGHLIGHT ? highlighterSize : (activeTool === ToolType.ERASER ? 20 : brushSize);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalAlpha = activeTool === ToolType.HIGHLIGHT ? 0.4 : 1.0;
                ctx.stroke();

                ctx.restore();
            }

            ctx.restore();
        };

        const rAF = requestAnimationFrame(render);
        return () => cancelAnimationFrame(rAF);

    }, [pageAnnotations, scale, isDrawing, currentPath, activeTool, activeColor, brushSize, highlighterSize, canvasSize, forceRender, textAlignment, stickyColor]);

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        const coords = getCoords(e);

        if (activeTool === ToolType.MOVE) {
            const hitAnnotation = [...pageAnnotations].reverse().find(ann => {
                if (ann.type !== 'text') return false;
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

        if (activeTool === ToolType.PEN || activeTool === ToolType.HIGHLIGHT || activeTool === ToolType.ERASER) {
            setIsDrawing(true);
            setCurrentPath([coords]);
        } else if (activeTool === ToolType.TEXT) {
            // TEXT tool: Click to create text editor
            console.log('Creating TEXT editor at:', coords);
            setActiveTextEditor({
                x: coords.x,
                y: coords.y,
                width: 200,
                height: 30,
                isSticky: false,
            });
            setEditingText("");
        } else if (activeTool === ToolType.STICKY) {
            // STICKY tool: Click to create sticky note immediately
            const newSticky: TextAnnotation = {
                id: Date.now().toString(),
                type: 'text',
                page: pageNumber,
                userId,
                text: 'Double click to edit',
                x: coords.x,
                y: coords.y,
                fontSize: 16,
                fontFamily: 'Arial',
                color: stickyColor,
                width: 200,
                height: 150
            };
            addAnnotation(newSticky);
            if (onAnnotationCreate) {
                onAnnotationCreate(newSticky);
            }
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
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        const coords = getCoords(e);

        if (isMoving && moveStartPos && movingAnnotationId) {
            const dx = coords.x - moveStartPos.x;
            const dy = coords.y - moveStartPos.y;

            const ann = pageAnnotations.find(a => a.id === movingAnnotationId);
            if (ann && ann.type === 'text') {
                const textAnn = ann as TextAnnotation;
                const updatedAnn: TextAnnotation = {
                    ...textAnn,
                    x: textAnn.x + dx,
                    y: textAnn.y + dy
                };
                updateAnnotation(updatedAnn);
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
                    type: activeTool === ToolType.HIGHLIGHT ? 'highlight' : (activeTool === ToolType.ERASER ? 'eraser' : 'path'),
                    page: pageNumber,
                    userId,
                    points: currentPath,
                    color: activeTool === ToolType.HIGHLIGHT ? activeColor : (activeTool === ToolType.ERASER ? '#000000' : activeColor),
                    width: activeTool === ToolType.HIGHLIGHT ? highlighterSize : (activeTool === ToolType.ERASER ? 20 : brushSize),
                    opacity: activeTool === ToolType.HIGHLIGHT ? 0.4 : 1.0
                };
                addAnnotation(newAnnotation);
                if (onAnnotationCreate) {
                    onAnnotationCreate(newAnnotation);
                }
            }
            setCurrentPath([]);
        }
    };

    // Double-click to edit existing text
    const handleDoubleClick = (e: React.MouseEvent) => {
        const coords = getCoords(e);

        const hitAnnotation = [...pageAnnotations].reverse().find(ann => {
            if (ann.type !== 'text') return false;
            const textAnn = ann as TextAnnotation;
            return coords.x >= textAnn.x && coords.x <= textAnn.x + (textAnn.width || 100) &&
                coords.y >= textAnn.y && coords.y <= textAnn.y + (textAnn.height || 30);
        });

        if (hitAnnotation) {
            const textAnn = hitAnnotation as TextAnnotation;
            const isSticky = textAnn.fontFamily === 'Arial';
            console.log('Double-click edit:', textAnn, 'isSticky:', isSticky);
            setActiveTextEditor({
                x: textAnn.x,
                y: textAnn.y,
                width: textAnn.width || 200,
                height: textAnn.height || 50,
                annotationId: textAnn.id,
                isSticky: isSticky,
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
                fontSize: activeTool === ToolType.STICKY ? 16 : fontSize,
                fontFamily: activeTool === ToolType.STICKY ? 'Arial' : 'Dancing Script',
                color: activeTool === ToolType.STICKY ? stickyColor : activeColor,
                width: activeTextEditor.width,
                height: activeTextEditor.height
            };

            const exists = annotations.some(a => a.id === newAnnotation.id);
            if (exists) {
                updateAnnotation(newAnnotation);
            } else {
                addAnnotation(newAnnotation);
            }

            if (onAnnotationCreate) {
                onAnnotationCreate(newAnnotation);
            }
        }
        setActiveTextEditor(null);
        setEditingText("");
    };

    // Handle real-time text updates with auto-expand for text (not sticky)
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setEditingText(newText);

        if (activeTextEditor) {
            const annotationId = activeTextEditor.annotationId || Date.now().toString();

            if (!activeTextEditor.annotationId) {
                setActiveTextEditor(prev => prev ? { ...prev, annotationId } : null);
            }

            // Auto-expand width for TEXT tool only (not sticky)
            let newWidth = activeTextEditor.width;
            if (activeTool === ToolType.TEXT) {
                const estimatedWidth = Math.max(200, newText.length * (fontSize * 0.6));
                newWidth = Math.min(estimatedWidth, 800);

                if (newWidth !== activeTextEditor.width) {
                    setActiveTextEditor(prev => prev ? { ...prev, width: newWidth } : null);
                }
            }

            const textAnn: TextAnnotation = {
                id: annotationId,
                type: 'text',
                page: pageNumber,
                userId,
                text: newText,
                x: activeTextEditor.x,
                y: activeTextEditor.y,
                fontSize: activeTool === ToolType.STICKY ? 16 : fontSize,
                fontFamily: activeTool === ToolType.STICKY ? 'Arial' : 'Dancing Script',
                color: activeTool === ToolType.STICKY ? stickyColor : activeColor,
                width: newWidth,
                height: activeTextEditor.height
            };

            const exists = annotations.some(a => a.id === annotationId);
            if (exists) {
                updateAnnotation(textAnn);
            } else {
                addAnnotation(textAnn);
            }

            if (onAnnotationCreate) {
                onAnnotationCreate(textAnn);
            }
        }
    };

    // Update cursor based on tool
    useEffect(() => {
        if (canvasRef.current) {
            if (activeTool === ToolType.CURSOR) {
                canvasRef.current.style.cursor = 'default';
            } else if (activeTool === ToolType.MOVE) {
                canvasRef.current.style.cursor = isMoving ? 'grabbing' : 'grab';
            } else if (activeTool === ToolType.PEN) {
                canvasRef.current.style.cursor = 'crosshair';
            } else if (activeTool === ToolType.HIGHLIGHT) {
                canvasRef.current.style.cursor = 'cell';
            } else if (activeTool === ToolType.ERASER) {
                canvasRef.current.style.cursor = 'not-allowed';
            } else if (activeTool === ToolType.TEXT || activeTool === ToolType.STICKY) {
                canvasRef.current.style.cursor = 'text';
            } else {
                canvasRef.current.style.cursor = 'crosshair';
            }
        }
    }, [activeTool, isMoving]);

    // Debug: Log activeTextEditor state changes
    useEffect(() => {
        console.log('activeTextEditor state:', activeTextEditor);
    }, [activeTextEditor]);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full pointer-events-auto"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
                style={{ pointerEvents: activeTool === 'cursor' ? 'none' : 'auto' }}
            />

            {/* Text Editor Overlay */}
            {activeTextEditor && (
                <div
                    className="absolute pointer-events-auto"
                    style={{
                        left: `${activeTextEditor.x * scale}px`,
                        top: `${activeTextEditor.y * scale}px`,
                        width: `${activeTextEditor.width * scale}px`,
                        height: `${activeTextEditor.height * scale}px`,
                        backgroundColor: activeTextEditor.isSticky ? stickyColor : 'transparent',
                        zIndex: 50,
                    }}
                >
                    <textarea
                        autoFocus
                        value={editingText}
                        onChange={handleTextChange}
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
                            ? 'border-gray-400'
                            : 'bg-transparent border-primary'
                            }`}
                        style={{
                            fontFamily: activeTool === ToolType.STICKY ? 'Arial, sans-serif' : '"Dancing Script", cursive',
                            fontSize: activeTool === ToolType.STICKY ? `${16 * scale}px` : `${fontSize * scale}px`,
                            color: activeTool === ToolType.STICKY ? '#000000' : activeColor,
                            textAlign: textAlignment,
                            backgroundColor: activeTool === ToolType.STICKY ? 'transparent' : 'transparent',
                        }}
                        placeholder={activeTool === ToolType.STICKY ? "Sticky note..." : "Type text... (Ctrl+Enter to save)"}
                    />
                </div>
            )}
        </div>
    );
};
