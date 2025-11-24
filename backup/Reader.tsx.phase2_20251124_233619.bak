import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import * as ReactWindow from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { motion, AnimatePresence } from 'framer-motion';
import { ToolType, ChatMessage, User, Annotation } from '../types';
import { AnnotationLayer } from '../components/reader/AnnotationLayer';
import CatLoader from '../components/ui/CatLoader';
import { useToast } from '../hooks/use-toast';
import { Toaster } from '../components/ui/toaster';
import { aiService } from '../services/ai';

// Setup PDF Worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

const Reader: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();

  // PDF State
  const [numPages, setNumPages] = useState<number>(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [visualScale, setVisualScale] = useState<number>(1.0);
  const [activePage, setActivePage] = useState(1);

  // UI State
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(250);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarView, setSidebarView] = useState<'list' | 'thumbnail'>('list');
  const [notesOpen, setNotesOpen] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.PEN);
  const [activeColor, setActiveColor] = useState<string>('#EF4444');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationHistory, setAnnotationHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Chat & User State
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const [myUserId] = useState(() => Math.random().toString(36).substr(2, 9));

  // Refs
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scaleTimeoutRef = useRef<NodeJS.Timeout | null>(null); // FIX: Move outside useEffect!

  // Load PDF URL
  useEffect(() => {
    if (id) {
      setPdfUrl(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/pdf/${id}`);
    }
  }, [id]);

  const [isLoading, setIsLoading] = useState(true);

  // WebSocket Connection
  useEffect(() => {
    if (!id) return;

    const wsUrl = `ws://${window.location.hostname}:3001/ws?channelId=${id}&userId=${myUserId}&username=User-${myUserId.substr(0, 4)}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Connected to WebSocket');
      toast.success("Đã kết nối vào phòng học");
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleWebSocketMessage(msg);
      } catch (e) {
        console.error("WS Parse Error", e);
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from WebSocket');
    };

    ws.current = socket;

    return () => {
      socket.close();
    };
  }, [id, myUserId]);

  const handleWebSocketMessage = (msg: any) => {
    switch (msg.type) {
      case 'chat':
        setMessages(prev => [...prev, msg.data]);
        break;
      case 'user_joined':
        setOnlineUsers(prev => {
          if (prev.find(u => u.id === msg.user.id)) return prev;
          return [...prev, msg.user];
        });
        toast.success(`${msg.user.username} đã tham gia`);
        break;
      case 'snapshot':
        // Load initial state
        const { drawOps, textOps } = msg.data;
        const loadedAnnotations: Annotation[] = [];

        if (drawOps) {
          drawOps.forEach((op: any) => {
            loadedAnnotations.push({
              id: op.id,
              type: op.type === 'draw' ? 'path' : 'highlight', // Map 'draw' to 'path'
              page: op.page,
              userId: op.userId,
              points: op.path,
              color: op.color,
              width: op.size,
              opacity: op.opacity || 1
            } as any);
          });
        }

        if (textOps) {
          textOps.forEach((op: any) => {
            loadedAnnotations.push({
              id: op.id,
              type: 'text',
              page: op.page,
              userId: op.userId,
              x: op.x,
              y: op.y,
              width: op.width,
              height: op.height,
              text: op.text,
              color: op.color,
              fontSize: op.fontSize,
              fontFamily: op.fontFamily
            });
          });
        }

        setAnnotations(loadedAnnotations);
        break;
      case 'draw_broadcast':
        const drawOp = msg.op;
        setAnnotations(prev => [...prev, {
          id: drawOp.id,
          type: 'path',
          page: drawOp.page,
          userId: drawOp.userId,
          points: drawOp.path,
          color: drawOp.color,
          width: drawOp.size,
          opacity: drawOp.opacity || 1
        } as any]);
        break;
      case 'text_broadcast':
        const textOp = msg.op;
        setAnnotations(prev => [...prev, {
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
        }]);
        break;
      case 'delete_annotation_broadcast':
        setAnnotations(prev => prev.filter(a => a.id !== msg.id));
        break;
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Keep loader for a moment for smoothness
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !ws.current) return;

    const msgData: ChatMessage = {
      id: Date.now().toString(),
      userId: myUserId,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString(),
      isSystem: false
    };

    setMessages(prev => [...prev, msgData]);

    ws.current.send(JSON.stringify({
      type: 'chat',
      data: msgData
    }));

    const mentionsAI = /@(AI|ai|gemini|Gemini|GEMINI)\b/.test(chatInput);

    if (mentionsAI) {
      const question = chatInput.replace(/@(AI|ai|gemini|Gemini|GEMINI)\s*/g, '').trim();
      const loadingId = Date.now().toString() + 'loading';
      setMessages(prev => [...prev, {
        id: loadingId,
        userId: 'ai',
        text: '🤔 Đang suy nghĩ...',
        timestamp: new Date().toLocaleTimeString(),
        isSystem: true
      }]);

      try {
        const response = await aiService.askGemini(question);
        setMessages(prev => prev.map(m => m.id === loadingId ? {
          ...m,
          text: response,
          isSystem: false,
          userId: 'ai'
        } : m));
      } catch (error) {
        setMessages(prev => prev.map(m => m.id === loadingId ? {
          ...m,
          text: '❌ Xin lỗi, tôi gặp sự cố. Vui lòng thử lại.',
          isSystem: false,
          userId: 'ai'
        } : m));
      }
    }

    setChatInput("");
  };

  const handleToolClick = (tool: ToolType) => {
    setActiveTool(tool);
    const toolNames: Record<ToolType, string> = {
      [ToolType.MOVE]: 'Di chuyển',
      [ToolType.PEN]: 'Bút vẽ',
      [ToolType.HIGHLIGHT]: 'Đánh dấu',
      [ToolType.TEXT]: 'Văn bản',
      [ToolType.STICKY]: 'Ghi chú',
      [ToolType.ERASER]: 'Tẩy',
      [ToolType.AI]: 'AI'
    };
    toast.success(`Đã chọn công cụ: ${toolNames[tool]}`);
  };

  const startResizingLeft = () => setIsDraggingLeft(true);
  const startResizingRight = () => setIsDraggingRight(true);
  const stopResizing = () => { setIsDraggingLeft(false); setIsDraggingRight(false); };

  const resize = useCallback((e: MouseEvent) => {
    if (isDraggingLeft) setLeftSidebarWidth(Math.max(180, Math.min(500, e.clientX)));
    if (isDraggingRight) setRightSidebarWidth(Math.max(280, Math.min(600, document.body.clientWidth - e.clientX)));
  }, [isDraggingLeft, isDraggingRight]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize]);

  // Zoom with Ctrl+Scroll - FIX: preserve scroll position
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();

        const container = mainScrollRef.current;
        if (!container) return;

        // Save current scroll position before zoom
        const scrollTopBefore = container.scrollTop;
        const scrollLeftBefore = container.scrollLeft;
        const containerHeight = container.clientHeight;
        const scrollRatio = scrollTopBefore / (container.scrollHeight - containerHeight);

        const delta = e.deltaY * -0.001;
        setVisualScale(prev => {
          const newScale = Math.min(5.0, Math.max(0.5, prev + delta));

          // Restore scroll position after state update
          requestAnimationFrame(() => {
            if (container && container.scrollHeight > containerHeight) {
              const newScrollTop = scrollRatio * (container.scrollHeight - containerHeight);
              container.scrollTop = newScrollTop;
            }
          });

          return newScale;
        });

        if (scaleTimeoutRef.current) clearTimeout(scaleTimeoutRef.current);
        scaleTimeoutRef.current = setTimeout(() => {
          setVisualScale(prev => {
            setScale(prev);
            return prev;
          });
        }, 300);
      }
    };

    const container = mainScrollRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const handleAnnotationAdd = (annotation: Annotation) => {
    // Optimistic update
    setAnnotations(prev => {
      const newAnnotations = [...prev, annotation];
      // Add to history
      setAnnotationHistory(history => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAnnotations);
        return newHistory;
      });
      setHistoryIndex(idx => idx + 1);
      return newAnnotations;
    });

    // Send to WebSocket
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      if (annotation.type === 'path' || annotation.type === 'highlight') {
        const pathAnn = annotation as any;
        ws.current.send(JSON.stringify({
          type: 'draw',
          id: annotation.id,
          page: annotation.page,
          path: pathAnn.points,
          color: pathAnn.color,
          size: pathAnn.width,
          opacity: pathAnn.opacity
        }));
      } else if (annotation.type === 'text') {
        const textAnn = annotation as any;
        ws.current.send(JSON.stringify({
          type: 'text',
          id: annotation.id,
          page: annotation.page,
          x: textAnn.x,
          y: textAnn.y,
          width: textAnn.width,
          height: textAnn.height,
          text: textAnn.text,
          color: textAnn.color,
          fontSize: textAnn.fontSize,
          fontFamily: textAnn.fontFamily
        }));
      }
    }
  };

  const handleAnnotationRemove = (annotationId: string) => {
    // Optimistic update
    setAnnotations(prev => {
      const newAnnotations = prev.filter(a => a.id !== annotationId);
      // Add to history
      setAnnotationHistory(history => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newAnnotations);
        return newHistory;
      });
      setHistoryIndex(idx => idx + 1);
      return newAnnotations;
    });

    // Send to WebSocket
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'delete_annotation',
        id: annotationId
      }));
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations(annotationHistory[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < annotationHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations(annotationHistory[newIndex]);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background-light text-text-main overflow-hidden font-body select-none">
      <Toaster />

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background-light dark:bg-background-dark"
          >
            <CatLoader />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Sidebar (Thumbnails) */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? leftSidebarWidth : 0 }}
        className="flex-shrink-0 bg-surface-light/95 dark:bg-[#2A251F]/90 backdrop-blur-xl border-r border-border-light dark:border-border-dark shadow-lg relative flex flex-col z-20 overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-border-light/50 dark:border-border-dark/50 min-w-[200px]">
          <h3 className="font-display font-bold text-lg text-text-main dark:text-white whitespace-nowrap flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">grid_view</span>
            Pages
          </h3>
          <div className="flex gap-1">
            <button
              onClick={() => setSidebarView('list')}
              className={`p-1.5 rounded-lg transition-colors ${sidebarView === 'list' ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
            >
              <span className="material-symbols-outlined text-xl">list</span>
            </button>
            <button
              onClick={() => setSidebarView('thumbnail')}
              className={`p-1.5 rounded-lg transition-colors ${sidebarView === 'thumbnail' ? 'bg-black/10 dark:bg-white/20' : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
            >
              <span className="material-symbols-outlined text-xl">grid_on</span>
            </button>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-text-muted transition-colors ml-2">
              <span className="material-symbols-outlined text-xl">first_page</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {pdfUrl && Array.from(new Array(numPages), (el, index) => (
            <div
              key={`thumb_${index + 1}`}
              onClick={() => {
                setActivePage(index + 1);
                pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`relative group cursor-pointer transition-all duration-200 p-2 rounded-lg border-2 ${activePage === index + 1 ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-black/5'}`}
            >
              {sidebarView === 'list' ? (
                <span className="text-sm font-bold text-text-muted">Page {index + 1}</span>
              ) : (
                <div className="w-full bg-white overflow-hidden relative pointer-events-none rounded-sm">
                  <Document file={pdfUrl} className="w-full">
                    <Page
                      pageNumber={index + 1}
                      width={180}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="origin-top-left"
                    />
                  </Document>
                  <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded z-10">
                    {index + 1}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div onMouseDown={startResizingLeft} className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors" />
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative bg-background-light dark:bg-background-dark overflow-hidden min-w-0 transition-colors duration-300">

        {/* Header */}
        <header className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-border-light/50 dark:border-border-dark/50 bg-surface-light/80 dark:bg-black/40 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
              <span className="material-symbols-outlined text-text-main dark:text-white">arrow_back</span>
            </button>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                <span className="material-symbols-outlined">last_page</span>
              </button>
            )}
            <div className="h-6 w-px bg-border-light/60 dark:bg-border-dark/60 mx-2"></div>
            <span className="font-display font-bold text-sm tracking-wide text-text-main dark:text-white truncate opacity-80">Document Viewer</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-4 bg-surface-light/50 dark:bg-black/30 px-1 py-1 rounded-lg border border-border-light dark:border-border-dark shadow-sm">
              <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1 hover:bg-black/5 rounded"><span className="material-symbols-outlined text-sm">remove</span></button>
              <span className="w-12 text-center font-mono text-sm">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1 hover:bg-black/5 rounded"><span className="material-symbols-outlined text-sm">add</span></button>
            </div>

            <button
              onClick={() => setNotesOpen(!notesOpen)}
              className={`p-2 rounded-full ${notesOpen ? 'bg-primary text-white' : 'bg-surface-light text-text-main'} border border-border-light shadow-sm transition-all`}
            >
              <span className="material-symbols-outlined">chat</span>
            </button>
          </div>
        </header>

        {/* PDF Canvas */}
        <main ref={mainScrollRef} className="flex-1 relative overflow-y-auto overflow-x-hidden scroll-smooth p-8 bg-gray-100 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-12 min-h-full">
            {pdfUrl ? (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="animate-pulse text-text-muted">Loading PDF...</div>}
                error={<div className="text-red-500">Failed to load PDF.</div>}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <div
                    key={`page_${index + 1}`}
                    ref={el => { pageRefs.current[index] = el; }}
                    className="relative shadow-lg origin-top-left transition-transform duration-75 ease-out will-change-transform mb-8"
                    style={{
                      transform: `scale(${visualScale / scale})`,
                      width: 'fit-content',
                      height: 'fit-content'
                    }}
                  >
                    <Page
                      pageNumber={index + 1}
                      scale={scale}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="shadow-lg bg-white"
                    />

                    {/* Annotation Layer */}
                    <div className="absolute inset-0">
                      <AnnotationLayer
                        pageNumber={index + 1}
                        scale={scale}
                        activeTool={activeTool}
                        annotations={annotations}
                        onAnnotationAdd={handleAnnotationAdd}
                        onAnnotationRemove={handleAnnotationRemove}
                        userId={myUserId}
                        activeColor={activeColor}
                      />
                    </div>

                    {/* Page Number */}
                    <div className="absolute -left-12 top-4 text-xs font-bold text-text-muted opacity-50">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </Document>
            ) : (
              <div className="text-text-muted">No PDF loaded</div>
            )}
          </div>

          {/* Toolbar */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-30">
            {/* Color Picker (Only show for Pen and Text, NOT Highlight or Sticky) */}
            {(activeTool === ToolType.PEN || activeTool === ToolType.TEXT) && (
              <div className="flex items-center gap-2 p-2 bg-surface-light/90 dark:bg-[#18181b]/80 backdrop-blur-xl rounded-full border border-white/20 shadow-lg">
                {['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#000000', '#FFFFFF'].map(color => (
                  <button
                    key={color}
                    onClick={() => setActiveColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${activeColor === color ? 'border-primary scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            <div className="flex items-center gap-1 p-2 bg-surface-light/90 dark:bg-[#18181b]/80 backdrop-blur-2xl rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl">
              {/* Undo/Redo buttons */}
              <button
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-text-muted hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <span className="material-symbols-outlined text-xl">undo</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= annotationHistory.length - 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-text-muted hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed mr-2"
                title="Redo (Ctrl+Y)"
              >
                <span className="material-symbols-outlined text-xl">redo</span>
              </button>

              {/* Divider */}
              <div className="w-px h-8 bg-border-light/30 dark:bg-border-dark/30 mr-1"></div>

              {/* Tool buttons */}
              {[
                { id: ToolType.MOVE, icon: 'pan_tool', label: 'Di chuyển' },
                { id: ToolType.PEN, icon: 'edit', label: 'Bút vẽ' },
                { id: ToolType.HIGHLIGHT, icon: 'format_ink_highlighter', label: 'Đánh dấu' },
                { id: ToolType.TEXT, icon: 'text_fields', label: 'Văn bản' },
                { id: ToolType.STICKY, icon: 'sticky_note_2', label: 'Ghi chú dính' },
                { id: ToolType.ERASER, icon: 'ink_eraser', label: 'Tẩy (Brush)' },
              ].map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all group relative ${activeTool === tool.id ? 'bg-white text-primary shadow-md' : 'text-text-muted hover:bg-white/10'}`}
                  title={tool.label}
                >
                  <span className="material-symbols-outlined text-xl">{tool.icon}</span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Right Sidebar (Chat) */}
      <AnimatePresence>
        {notesOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: rightSidebarWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 bg-surface-light/95 dark:bg-[#2A251F]/90 backdrop-blur-xl border-l border-border-light dark:border-border-dark shadow-lg relative flex flex-col z-20 overflow-hidden"
          >
            <div onMouseDown={startResizingRight} className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-10" />

            <div className="p-4 border-b border-border-light/50 dark:border-border-dark/50 flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-text-main dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">forum</span>
                Chat & AI
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {onlineUsers.slice(0, 3).map((u, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center border border-white dark:border-gray-800" title={u.username}>
                      {u.username[0]}
                    </div>
                  ))}
                  {onlineUsers.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center border border-white dark:border-gray-800">
                      +{onlineUsers.length - 3}
                    </div>
                  )}
                </div>
                <div className={`w-2 h-2 rounded-full ${ws.current?.readyState === WebSocket.OPEN ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.userId === myUserId ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-text-muted">{msg.userId === myUserId ? 'You' : (msg.userId === 'ai' ? 'Gemini AI' : msg.userId)}</span>
                    <span className="text-[10px] text-text-muted/70">{msg.timestamp}</span>
                  </div>
                  <div className={`p-3 rounded-2xl max-w-[90%] ${msg.isSystem ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-200 border border-blue-100 dark:border-blue-800' :
                    msg.userId === myUserId ? 'bg-primary text-white rounded-tr-none shadow-md' :
                      msg.userId === 'ai' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 border border-purple-100 dark:border-purple-800 rounded-tl-none' :
                        'bg-white dark:bg-white/5 border border-border-light dark:border-border-dark rounded-tl-none shadow-sm'
                    }`}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-border-light/50 dark:border-border-dark/50 bg-surface-light/50 dark:bg-black/20">
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message or @AI..."
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-white/5 border border-border-light dark:border-border-dark focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none shadow-inner"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
              <div className="mt-2 text-xs text-text-muted text-center">
                Tip: Type <span className="font-mono text-primary bg-primary/10 px-1 rounded">@AI</span> to ask Gemini
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reader;
