import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Text, Circle, Rect, Group } from 'react-konva';
import * as pdfjsLib from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid';
import { DrawOp, TextOp, StickyOp, Tool, UserProfile } from '../../types';
import { Button } from '../UI/Button';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface Point {
    x: number;
    y: number;
}

interface PdfViewerProps {
    pdfId: string | null;
    currentPage: number;
    drawOps: DrawOp[];
    textOps: TextOp[];
    stickyOps: StickyOp[];
    currentTool: Tool;
    currentColor: string;
    currentSize: number;
    currentFontSize: number;
    cursors: Record<string, { x: number; y: number; color: string }>;
    users: Record<string, UserProfile>;
    onDraw: (op: Omit<DrawOp, 'userId' | 'ts'>) => void;
    onText: (op: Omit<TextOp, 'userId' | 'ts'>) => void;
    onSticky: (op: Omit<StickyOp, 'userId' | 'ts'>) => void;
    onDeleteAnnotation: (id: string) => void;
    onCursorMove: (x: number, y: number, color: string) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
    pdfId,
    currentPage,
    drawOps,
    textOps,
    stickyOps,
    currentTool,
    currentColor,
    currentSize,
    currentFontSize,
    cursors,
    users,
    onDraw,
    onText,
    onSticky,
    onDeleteAnnotation,
    onCursorMove,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<Point[]>([]);

    // Text Editing State
    const [editingText, setEditingText] = useState<{ x: number; y: number } | null>(null);
    const [editingTextId, setEditingTextId] = useState<string | null>(null);
    const [textInput, setTextInput] = useState('');

    // Sticky Note Editing State
    const [editingSticky, setEditingSticky] = useState<{ x: number; y: number } | null>(null);
    const [editingStickyId, setEditingStickyId] = useState<string | null>(null);
    const [stickyInput, setStickyInput] = useState('');

    // Load PDF
    useEffect(() => {
        if (!pdfId) {
            setPdf(null);
            return;
        }

        const loadPdf = async () => {
            try {
                const loadingTask = pdfjsLib.getDocument(`/pdf/${pdfId}`);
                const pdfDoc = await loadingTask.promise;
                setPdf(pdfDoc);
            } catch (error) {
                console.error('Error loading PDF:', error);
            }
        };

        loadPdf();
    }, [pdfId]);

    // Render current page
    useEffect(() => {
        if (!pdf || !canvasRef.current) return;

        const renderPage = async () => {
            try {
                const page = await pdf.getPage(currentPage);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = canvasRef.current!;
                const context = canvas.getContext('2d')!;

                canvas.width = viewport.width;
                canvas.height = viewport.height;
                setDimensions({ width: viewport.width, height: viewport.height });

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                await page.render(renderContext).promise;
            } catch (error) {
                console.error('Error rendering page:', error);
            }
        };

        renderPage();
    }, [pdf, currentPage]);

    // Filter ops for current page
    const currentPageDrawOps = drawOps.filter((op) => op.page === currentPage);
    const currentPageTextOps = textOps.filter((op) => op.page === currentPage);
    const currentPageStickyOps = (stickyOps || []).filter((op) => op.page === currentPage);

    const handleStageClick = (e: any) => {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();

        if (currentTool === 'text') {
            setEditingText({ x: pos.x, y: pos.y });
            setTextInput('');
            setEditingTextId(null); // New text
        } else if (currentTool === 'sticky') {
            setEditingSticky({ x: pos.x, y: pos.y });
            setStickyInput('');
            setEditingStickyId(null); // New sticky
        } else if (currentTool === 'eraser') {
            // Check text annotations
            for (const textOp of currentPageTextOps) {
                const textWidth = textOp.text.length * (textOp.fontSize * 0.6);
                const textHeight = textOp.fontSize;
                if (
                    pos.x >= textOp.x &&
                    pos.x <= textOp.x + textWidth &&
                    pos.y >= textOp.y - textHeight &&
                    pos.y <= textOp.y
                ) {
                    onDeleteAnnotation(textOp.id);
                    return;
                }
            }
            // Check sticky notes
            for (const stickyOp of currentPageStickyOps) {
                if (
                    pos.x >= stickyOp.x &&
                    pos.x <= stickyOp.x + 150 &&
                    pos.y >= stickyOp.y &&
                    pos.y <= stickyOp.y + 150
                ) {
                    onDeleteAnnotation(stickyOp.id);
                    return;
                }
            }
        }
    };

    const handleMouseDown = (e: any) => {
        if (currentTool !== 'draw') return;
        setIsDrawing(true);
        const pos = e.target.getStage().getPointerPosition();
        setCurrentPath([pos]);
    };

    const lastCursorUpdate = useRef(0);

    const handleMouseMove = (e: any) => {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();

        // Send cursor update (throttled to 50ms)
        const now = Date.now();
        if (now - lastCursorUpdate.current > 50) {
            onCursorMove(pos.x, pos.y, currentColor);
            lastCursorUpdate.current = now;
        }

        if (!isDrawing || currentTool !== 'draw') return;
        setCurrentPath([...currentPath, pos]);
    };

    const handleMouseUp = () => {
        if (!isDrawing || currentTool !== 'draw') return;
        setIsDrawing(false);

        if (currentPath.length > 1) {
            const drawOp: Omit<DrawOp, 'userId' | 'ts'> = {
                id: uuidv4(),
                type: 'draw',
                page: currentPage,
                path: currentPath,
                color: currentColor,
                size: currentSize,
            };
            onDraw(drawOp);
        }

        setCurrentPath([]);
    };

    const handleTextSubmit = () => {
        if (!editingText || !textInput.trim()) {
            setEditingText(null);
            setTextInput('');
            setEditingTextId(null);
            return;
        }

        const textOp: Omit<TextOp, 'userId' | 'ts'> = {
            id: editingTextId || uuidv4(),
            type: 'text',
            page: currentPage,
            x: editingText.x,
            y: editingText.y,
            text: textInput,
            color: currentColor,
            fontSize: currentFontSize,
        };

        onText(textOp);
        setEditingText(null);
        setTextInput('');
        setEditingTextId(null);
    };

    const handleStickySubmit = () => {
        if (!editingSticky || !stickyInput.trim()) {
            setEditingSticky(null);
            setStickyInput('');
            setEditingStickyId(null);
            return;
        }

        const stickyOp: Omit<StickyOp, 'userId' | 'ts'> = {
            id: editingStickyId || uuidv4(),
            type: 'sticky',
            page: currentPage,
            x: editingSticky.x,
            y: editingSticky.y,
            text: stickyInput,
            color: '#fef3c7', // Default yellow sticky color
        };

        onSticky(stickyOp);
        setEditingSticky(null);
        setStickyInput('');
        setEditingStickyId(null);
    };

    return (
        <div className="flex-1 flex justify-center p-8 overflow-auto bg-[var(--color-bg-cream)] relative">

            {/* Canvas area */}
            <div className="relative shadow-[0_4px_20px_rgba(0,0,0,0.08)] bg-white rounded-sm overflow-hidden"
                style={{ width: dimensions.width, height: dimensions.height }}>
                <canvas ref={canvasRef} className="absolute top-0 left-0" />
                <Stage
                    width={dimensions.width}
                    height={dimensions.height}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onClick={handleStageClick}
                    className="absolute top-0 left-0"
                    style={{ cursor: currentTool === 'text' || currentTool === 'sticky' ? 'text' : currentTool === 'eraser' ? 'crosshair' : 'crosshair' }}
                >
                    <Layer>
                        {/* Render existing strokes */}
                        {currentPageDrawOps.map((op) => (
                            <Line
                                key={op.id}
                                points={op.path.flatMap((p) => [p.x, p.y])}
                                stroke={op.color}
                                strokeWidth={op.size}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                                opacity={0.8}
                            />
                        ))}

                        {/* Render Sticky Notes */}
                        {currentPageStickyOps.map((op) => (
                            <Group
                                key={op.id}
                                x={op.x}
                                y={op.y}
                                onClick={(e) => {
                                    if (currentTool === 'sticky') {
                                        e.cancelBubble = true;
                                        setEditingSticky({ x: op.x, y: op.y });
                                        setStickyInput(op.text);
                                        setEditingStickyId(op.id);
                                    }
                                }}
                            >
                                <Rect
                                    width={150}
                                    height={150}
                                    fill={op.color}
                                    shadowColor="black"
                                    shadowBlur={10}
                                    shadowOpacity={0.1}
                                    shadowOffset={{ x: 4, y: 4 }}
                                    cornerRadius={2}
                                />
                                <Text
                                    x={15}
                                    y={15}
                                    width={120}
                                    text={op.text}
                                    fontSize={16}
                                    fill="#2C3E50"
                                    fontFamily="'Inter', sans-serif"
                                    lineHeight={1.4}
                                />
                            </Group>
                        ))}

                        {/* Render existing text annotations */}
                        {currentPageTextOps.map((op) => (
                            <Text
                                key={op.id}
                                x={op.x}
                                y={op.y}
                                text={op.text}
                                fontSize={op.fontSize}
                                fill={op.color}
                                fontFamily="'Inter', sans-serif"
                                fontStyle="500"
                                onClick={(e) => {
                                    if (currentTool === 'text') {
                                        e.cancelBubble = true;
                                        setEditingText({ x: op.x, y: op.y });
                                        setTextInput(op.text);
                                        setEditingTextId(op.id);
                                    }
                                }}
                            />
                        ))}

                        {/* Render current drawing */}
                        {isDrawing && currentPath.length > 1 && (
                            <Line
                                points={currentPath.flatMap((p) => [p.x, p.y])}
                                stroke={currentColor}
                                strokeWidth={currentSize}
                                tension={0.5}
                                lineCap="round"
                                lineJoin="round"
                            />
                        )}

                        {/* Render other users' cursors */}
                        {Object.entries(cursors).map(([userId, cursor]) => {
                            const user = users[userId];
                            const displayName = user ? user.username : 'User';
                            return (
                                <React.Fragment key={userId}>
                                    <Circle
                                        x={cursor.x}
                                        y={cursor.y}
                                        radius={6}
                                        fill={cursor.color}
                                        stroke="white"
                                        strokeWidth={2}
                                    />
                                    <Group x={cursor.x + 10} y={cursor.y - 10}>
                                        <Rect
                                            width={displayName.length * 8 + 10}
                                            height={20}
                                            fill={cursor.color}
                                            cornerRadius={4}
                                        />
                                        <Text
                                            x={5}
                                            y={4}
                                            text={displayName}
                                            fontSize={11}
                                            fill="white"
                                            fontFamily="'Inter', sans-serif"
                                            fontStyle="bold"
                                        />
                                    </Group>
                                </React.Fragment>
                            );
                        })}
                    </Layer>
                </Stage>
            </div>

            {/* Text Input Modal */}
            {editingText && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-[var(--radius-lg)] shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-[1000] border border-[var(--color-gray-100)] w-[320px]">
                    <h3 className="text-lg font-display font-bold text-[var(--color-text-dark)] mb-4">Add Text</h3>
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleTextSubmit();
                            }
                        }}
                        placeholder="Type your text..."
                        autoFocus
                        className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] text-[var(--color-text-dark)] focus:ring-2 focus:ring-[var(--color-accent-orange)] focus:border-[var(--color-accent-orange)] outline-none transition-all mb-6"
                    />
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setEditingText(null);
                                setTextInput('');
                                setEditingTextId(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleTextSubmit}>
                            Save
                        </Button>
                    </div>
                </div>
            )}

            {/* Sticky Note Input Modal */}
            {editingSticky && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#fef3c7] p-6 rounded-sm shadow-[5px_5px_20px_rgba(0,0,0,0.15)] z-[1000] -rotate-1 w-[280px]">
                    <h3 className="text-xl font-display font-bold text-[#d97706] mb-4">Sticky Note</h3>
                    <textarea
                        value={stickyInput}
                        onChange={(e) => setStickyInput(e.target.value)}
                        placeholder="Write something..."
                        autoFocus
                        className="w-full h-32 bg-transparent border-none text-[var(--color-text-dark)] text-lg font-sans resize-none outline-none placeholder-[#d97706]/50"
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={() => {
                                setEditingSticky(null);
                                setStickyInput('');
                                setEditingStickyId(null);
                            }}
                            className="px-3 py-1.5 text-sm text-[#d97706] hover:bg-[#d97706]/10 rounded transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleStickySubmit}
                            className="px-4 py-1.5 text-sm bg-[#d97706] text-white rounded shadow-sm hover:bg-[#b45309] transition-colors font-medium"
                        >
                            Stick It
                        </button>
                    </div>
                </div>
            )}

            {/* Overlay for modal */}
            {(editingText || editingSticky) && (
                <div
                    onClick={() => {
                        setEditingText(null);
                        setTextInput('');
                        setEditingTextId(null);
                        setEditingSticky(null);
                        setStickyInput('');
                        setEditingStickyId(null);
                    }}
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[999]"
                />
            )}
        </div>
    );
};
