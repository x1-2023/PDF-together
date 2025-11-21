import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Stage, Layer, Line, Text, Circle } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { DrawOp, TextOp, UserProfile, Tool } from './types';

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PdfBoardProps {
  pdfId: string | null;
  currentPage: number;
  drawOps: DrawOp[];
  textOps: TextOp[];
  cursors: Record<string, { x: number; y: number; color: string }>;
  users: Record<string, UserProfile>;
  // Tool Props
  currentTool: Tool;
  currentColor: string;
  currentSize: number;
  currentFontSize: number;

  onDraw: (drawOp: Omit<DrawOp, 'userId' | 'ts'>) => void;
  onText: (textOp: Omit<TextOp, 'userId' | 'ts'>) => void;

  onDeleteAnnotation: (id: string) => void;
  onCursorMove: (x: number, y: number, color: string) => void;
}

interface Point {
  x: number;
  y: number;
}

export const PdfBoard: React.FC<PdfBoardProps> = ({
  pdfId,
  currentPage,
  drawOps,
  textOps,
  cursors,
  users,
  currentTool,
  currentColor,
  currentSize,
  currentFontSize,

  onDraw,
  onText,

  onDeleteAnnotation,
  onCursorMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [editingText, setEditingText] = useState<{ x: number; y: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');

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

  const handleStageClick = (e: any) => {
    if (currentTool === 'text') {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      setEditingText({ x: pos.x, y: pos.y });
      setTextInput('');
      setEditingTextId(null); // New text
    } else if (currentTool === 'eraser') {
      // Check if clicked on any annotation to delete
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();

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

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

      {/* Canvas area */}
      <div style={{
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        background: '#fff',
        // Simulate paper look
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
          style={{ position: 'absolute', top: 0, left: 0, cursor: currentTool === 'text' ? 'text' : currentTool === 'eraser' ? 'crosshair' : 'crosshair' }}
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

            {/* Render existing text annotations */}
            {currentPageTextOps.map((op) => (
              <Text
                key={op.id}
                x={op.x}
                y={op.y}
                text={op.text}
                fontSize={op.fontSize}
                fill={op.color}
                fontFamily="Arial"
                onClick={(e) => {
                  if (currentTool === 'text') {
                    e.cancelBubble = true;
                    setEditingText({ x: op.x, y: op.y });
                    setTextInput(op.text);
                    setEditingTextId(op.id);
                  }
                }}
                onTap={(e) => {
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
            background: '#2c2f33',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
        >
          <h3 style={{ color: '#fff', marginTop: 0 }}>Enter Text</h3>
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
              padding: '10px',
              fontSize: '16px',
              border: '1px solid #40444b',
              borderRadius: '4px',
              background: '#40444b',
              color: '#fff',
            }}
          />
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button
              onClick={handleTextSubmit}
              style={{
                padding: '8px 16px',
                background: '#5865f2',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Add Text
            </button>
            <button
              onClick={() => {
                setEditingText(null);
                setTextInput('');
                setEditingTextId(null);
              }}
              style={{
                padding: '8px 16px',
                background: '#ed4245',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Overlay for modal */}
      {editingText && (
        <div
          onClick={() => {
            setEditingText(null);
            setTextInput('');
            setEditingTextId(null);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 999,
          }}
        />
      )}
    </div>
  );
};
