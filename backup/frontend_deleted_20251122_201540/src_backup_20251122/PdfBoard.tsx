import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Text, Circle, Rect, Group } from 'react-konva';
import * as pdfjsLib from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid';
import { DrawOp, TextOp, StickyOp, Tool, UserProfile } from './types';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface Point {
  x: number;
  y: number;
}

interface PdfBoardProps {
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

export const PdfBoard: React.FC<PdfBoardProps> = ({
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
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

      {/* Canvas area */}
      <div style={{
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        background: '#fff',
        width: dimensions.width,
        height: dimensions.height
      }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleStageClick}
          style={{ position: 'absolute', top: 0, left: 0, cursor: currentTool === 'text' || currentTool === 'sticky' ? 'text' : currentTool === 'eraser' ? 'crosshair' : 'crosshair' }}
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
                  shadowBlur={5}
                  shadowOpacity={0.2}
                  shadowOffset={{ x: 2, y: 2 }}
                />
                <Text
                  x={10}
                  y={10}
                  width={130}
                  text={op.text}
                  fontSize={16}
                  fill="#000"
                  fontFamily="'Caveat', cursive"
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
                fontFamily="'Caveat', cursive"
                fontStyle="700"
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
                    radius={5}
                    fill={cursor.color}
                  />
                  <Text
                    x={cursor.x + 8}
                    y={cursor.y - 8}
                    text={displayName}
                    fontSize={12}
                    fill={cursor.color}
                    fontFamily="Arial"
                    fontStyle="bold"
                  />
                </React.Fragment>
              );
            })}
          </Layer>
        </Stage>
      </div>

      {/* Text Input Modal */}
      {editingText && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#FFFFFF',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 1000,
            border: '1px solid #E0E0E0',
          }}
        >
          <h3 style={{ color: '#2C3E50', marginTop: 0, fontFamily: "'Merriweather', serif" }}>Enter Text</h3>
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
            style={{
              width: '300px',
              padding: '12px',
              fontSize: '16px',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              background: '#F9F7F1',
              color: '#2C3E50',
              fontFamily: "'Inter', sans-serif",
              outline: 'none',
            }}
          />
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setEditingText(null);
                setTextInput('');
                setEditingTextId(null);
              }}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#7F8C8D',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleTextSubmit}
              style={{
                padding: '8px 16px',
                background: '#E67E22',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
              }}
            >
              Add Text
            </button>
          </div>
        </div>
      )}

      {/* Sticky Note Input Modal */}
      {editingSticky && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#fef3c7',
            padding: '24px',
            borderRadius: '2px', /* Sticky note look */
            boxShadow: '5px 5px 15px rgba(0,0,0,0.15)',
            zIndex: 1000,
            color: '#000',
            transform: 'rotate(-1deg)',
          }}
        >
          <h3 style={{ marginTop: 0, color: '#d97706', fontFamily: "'Caveat', cursive", fontSize: '1.5rem' }}>Sticky Note</h3>
          <textarea
            value={stickyInput}
            onChange={(e) => setStickyInput(e.target.value)}
            placeholder="Write something..."
            autoFocus
            style={{
              width: '220px',
              height: '180px',
              padding: '12px',
              fontSize: '18px',
              border: 'none',
              background: 'transparent',
              color: '#2C3E50',
              fontFamily: "'Caveat', cursive",
              resize: 'none',
              outline: 'none',
            }}
          />
          <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setEditingSticky(null);
                setStickyInput('');
                setEditingStickyId(null);
              }}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                color: '#d97706',
                border: '1px solid #d97706',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.9rem',
              }}
            >
              Discard
            </button>
            <button
              onClick={handleStickySubmit}
              style={{
                padding: '6px 16px',
                background: '#d97706',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
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
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
};
