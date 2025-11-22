import React, { useEffect, useState, useRef } from 'react';
import { initializeDiscord } from './discord';
import { PdfBoard } from './PdfBoard';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { DrawOp, TextOp, StickyOp, RoomState, WSMessage, UserProfile, Tool, DiscordInfo } from './types';
import './App.css';

function App() {
  const [discordInfo, setDiscordInfo] = useState<DiscordInfo | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [availablePdfs, setAvailablePdfs] = useState<Array<{ id: string; name: string; url: string; size?: number }>>([]);
  const [uploading, setUploading] = useState(false);

  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; color: string }>>({});
  const [users, setUsers] = useState<Record<string, UserProfile>>({});

  // Tool State
  const [currentTool, setCurrentTool] = useState<Tool>('draw');
  const [currentColor, setCurrentColor] = useState('#E67E22'); // Default orange
  const [currentSize, setCurrentSize] = useState(3);
  const [currentFontSize, setCurrentFontSize] = useState(16);

  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const wsRef = useRef<WebSocket | null>(null);
  const initRef = useRef(false);

  // Derived state for current user profile
  const currentUserProfile: UserProfile | null = discordInfo ? {
    id: discordInfo.userId,
    username: discordInfo.username,
    discriminator: discordInfo.discriminator,
    avatar: discordInfo.avatar
  } : null;

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        const info = await initializeDiscord();
        setDiscordInfo(info);

        // Load available PDFs from server
        try {
          const response = await fetch('/api/pdfs');
          const data = await response.json();
          setAvailablePdfs(data.pdfs || []);
        } catch (err) {
          console.error('Failed to load PDFs:', err);
        }

        // Connect to WebSocket
        const isDiscordActivity = window.location.hostname.includes('discordsays.com');
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

        let baseUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:3001';
        if (isDiscordActivity) {
          baseUrl = `${wsProtocol}//${window.location.host}`;
        }

        baseUrl = baseUrl.replace(/\/ws\/?$/, '').replace(/\/$/, '');

        const wsUrl = baseUrl;
        const params = new URLSearchParams({
          channelId: info.channelId,
          userId: info.userId,
          username: info.username,
          discriminator: info.discriminator,
          avatar: info.avatar || '',
        });
        const ws = new WebSocket(`${wsUrl}/ws?${params.toString()}`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
          const message: WSMessage = JSON.parse(event.data);
          handleWSMessage(message);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    init();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendWSMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const handleWSMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'snapshot':
        setRoomState(message.data);
        break;

      case 'set_pdf':
        setRoomState((prev) => {
          if (!prev) return null;
          if (!message.pdfId) {
            return {
              ...prev,
              currentPdfId: null,
              currentPage: 1,
              drawOps: [],
              textOps: [],
              stickyOps: [],
            };
          }
          return {
            ...prev,
            currentPdfId: message.pdfId,
            currentPage: 1,
            drawOps: [],
            textOps: [],
            stickyOps: [],
          };
        });
        break;

      case 'change_page':
        setRoomState((prev) => ({
          ...prev!,
          currentPage: message.page,
        }));
        break;

      case 'draw_broadcast':
        setRoomState((prev) => ({
          ...prev!,
          drawOps: [...prev!.drawOps, message.op],
        }));
        break;

      case 'text_broadcast':
        setRoomState((prev) => {
          if (!prev) return null;
          const existingIndex = prev.textOps.findIndex(op => op.id === message.op.id);
          if (existingIndex !== -1) {
            const newTextOps = [...prev.textOps];
            newTextOps[existingIndex] = message.op;
            return { ...prev, textOps: newTextOps };
          } else {
            return { ...prev, textOps: [...prev.textOps, message.op] };
          }
        });
        break;

      case 'sticky_broadcast':
        setRoomState((prev) => {
          if (!prev) return null;
          const existingIndex = prev.stickyOps.findIndex(op => op.id === message.op.id);
          if (existingIndex !== -1) {
            const newStickyOps = [...prev.stickyOps];
            newStickyOps[existingIndex] = message.op;
            return { ...prev, stickyOps: newStickyOps };
          } else {
            return { ...prev, stickyOps: [...prev.stickyOps, message.op] };
          }
        });
        break;

      case 'clear_page_broadcast':
        setRoomState((prev) => ({
          ...prev!,
          drawOps: prev!.drawOps.filter(op => op.page !== message.page),
          textOps: prev!.textOps.filter(op => op.page !== message.page),
          stickyOps: prev!.stickyOps.filter(op => op.page !== message.page),
        }));
        break;

      case 'delete_annotation_broadcast':
        setRoomState((prev) => ({
          ...prev!,
          drawOps: prev!.drawOps.filter(op => op.id !== message.id),
          textOps: prev!.textOps.filter(op => op.id !== message.id),
          stickyOps: prev!.stickyOps.filter(op => op.id !== message.id),
        }));
        break;

      case 'cursor':
        setCursors((prev) => ({
          ...prev,
          [message.userId]: { x: message.x, y: message.y, color: message.color },
        }));
        break;

      case 'pdf_deleted':
        setAvailablePdfs((prev) => prev.filter(pdf => pdf.id !== message.pdfId));
        setRoomState((prev) => {
          if (prev?.currentPdfId === message.pdfId) {
            return {
              ...prev,
              currentPdfId: null,
              currentPage: 1,
              drawOps: [],
              textOps: [],
              stickyOps: [],
            };
          }
          return prev;
        });
        break;

      case 'user_joined':
        setUsers((prev) => ({
          ...prev,
          [message.user.id]: message.user,
        }));
        break;

      case 'user_left':
        setUsers((prev) => {
          const newUsers = { ...prev };
          delete newUsers[message.userId];
          return newUsers;
        });
        setCursors((prev) => {
          const newCursors = { ...prev };
          delete newCursors[message.userId];
          return newCursors;
        });
        break;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      const pdfId = data.pdfId;

      // Add to local list immediately
      setAvailablePdfs((prev) => [...prev, { id: pdfId, name: file.name, url: `/pdf/${pdfId}`, size: file.size }]);

      // Notify all clients about the new PDF
      sendWSMessage({ type: 'set_pdf', pdfId });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectPdf = (pdfId: string) => {
    sendWSMessage({ type: 'set_pdf', pdfId });
  };

  const handleCloseBook = () => {
    sendWSMessage({ type: 'set_pdf', pdfId: null });
  };

  const handleDeletePdf = async (pdfId: string) => {
    if (!confirm('Are you sure you want to delete this PDF?')) return;
    try {
      await fetch(`/api/pdfs/${pdfId}`, { method: 'DELETE' });
      // Optimistic update
      setAvailablePdfs((prev) => prev.filter((p) => p.id !== pdfId));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleChangePage = (page: number) => {
    sendWSMessage({ type: 'change_page', page });
  };

  const handleDraw = (op: Omit<DrawOp, 'userId' | 'ts'>) => {
    if (!currentUserProfile || !roomState?.currentPdfId) return;
    const drawOp: DrawOp = { ...op, userId: currentUserProfile.id, ts: Date.now() };
    setRoomState((prev) => prev ? { ...prev, drawOps: [...prev.drawOps, drawOp] } : null);
    sendWSMessage({ type: 'draw_broadcast', op: drawOp });
  };

  const handleText = (op: Omit<TextOp, 'userId' | 'ts'>) => {
    if (!currentUserProfile || !roomState?.currentPdfId) return;
    const textOp: TextOp = { ...op, userId: currentUserProfile.id, ts: Date.now() };
    setRoomState((prev) => {
      if (!prev) return null;
      const existingIndex = prev.textOps.findIndex(o => o.id === textOp.id);
      if (existingIndex !== -1) {
        const newTextOps = [...prev.textOps];
        newTextOps[existingIndex] = textOp;
        return { ...prev, textOps: newTextOps };
      }
      return { ...prev, textOps: [...prev.textOps, textOp] };
    });
    sendWSMessage({ type: 'text_broadcast', op: textOp });
  };

  const handleSticky = (op: Omit<StickyOp, 'userId' | 'ts'>) => {
    if (!currentUserProfile || !roomState?.currentPdfId) return;
    const stickyOp: StickyOp = { ...op, userId: currentUserProfile.id, ts: Date.now() };
    setRoomState((prev) => {
      if (!prev) return null;
      const existingIndex = prev.stickyOps.findIndex(o => o.id === stickyOp.id);
      if (existingIndex !== -1) {
        const newStickyOps = [...prev.stickyOps];
        newStickyOps[existingIndex] = stickyOp;
        return { ...prev, stickyOps: newStickyOps };
      }
      return { ...prev, stickyOps: [...prev.stickyOps, stickyOp] };
    });
    sendWSMessage({ type: 'sticky_broadcast', op: stickyOp });
  };

  const handleClearPage = () => {
    if (!roomState) return;
    if (!confirm('Clear all annotations on this page?')) return;
    sendWSMessage({ type: 'clear_page_broadcast', page: roomState.currentPage });
  };

  const handleDeleteAnnotation = (id: string) => {
    sendWSMessage({ type: 'delete_annotation_broadcast', id });
  };

  const handleCursorMove = (x: number, y: number, color: string) => {
    if (!currentUserProfile) return;
    sendWSMessage({
      type: 'cursor',
      userId: currentUserProfile.id,
      x,
      y,
      color,
    });
  };

  if (!discordInfo) {
    return <div className="loading">Loading Discord...</div>;
  }

  return (
    <div className={`app-container ${theme}`}>
      {/* Left Sidebar: Navigation (Only in Study Mode) */}
      {roomState?.currentPdfId && (
        <div className="sidebar left">
          <div className="sidebar-header">
            <h3>Navigation</h3>
          </div>
          <div className="sidebar-content">
            <button
              className="nav-btn back-to-shelf"
              onClick={handleCloseBook}
            >
              <span className="icon">📚</span> Bookshelf
            </button>
            <div className="divider"></div>
            <div className="book-info-sidebar">
              <h4>Current Book</h4>
              <p className="book-title-small">{availablePdfs.find(p => p.id === roomState.currentPdfId)?.name || 'Unknown'}</p>
            </div>
          </div>
          <div className="sidebar-footer">
            <button
              className="nav-btn settings-btn"
              onClick={() => setIsSettingsOpen(true)}
            >
              <span className="icon">⚙️</span> Settings
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="main-content">
        {roomState?.currentPdfId ? (
          <div className="study-view">
            {/* Center: PDF Board */}
            <div className="center-stage">
              <div className="reader-nav">
                <button className="page-btn" onClick={() => handleChangePage(Math.max(1, roomState.currentPage - 1))} disabled={roomState.currentPage <= 1}>
                  ← Prev
                </button>
                <span className="page-indicator">Page {roomState.currentPage}</span>
                <button className="page-btn" onClick={() => handleChangePage(roomState.currentPage + 1)}>
                  Next →
                </button>
              </div>

              <div className="board-wrapper">
                <PdfBoard
                  pdfId={roomState.currentPdfId}
                  currentPage={roomState.currentPage}
                  drawOps={roomState.drawOps}
                  textOps={roomState.textOps}
                  stickyOps={roomState.stickyOps}
                  currentTool={currentTool}
                  currentColor={currentColor}
                  currentSize={currentSize}
                  currentFontSize={currentFontSize}
                  cursors={cursors}
                  users={users}
                  onDraw={handleDraw}
                  onText={handleText}
                  onSticky={handleSticky}
                  onDeleteAnnotation={handleDeleteAnnotation}
                  onCursorMove={handleCursorMove}
                />
              </div>
            </div>
          </div>
        ) : (
          <Dashboard
            pdfs={availablePdfs}
            onSelectPdf={handleSelectPdf}
            onDeletePdf={handleDeletePdf}
            onUpload={handleFileUpload}
            uploading={uploading}
            currentUser={currentUserProfile}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </div>

      {/* Right Sidebar: Tools (Only in Study Mode) */}
      {roomState?.currentPdfId && (
        <div className="sidebar right">
          <div className="sidebar-header">
            <h3>Tools</h3>
          </div>
          <div className="sidebar-content">
            <div className="tools-grid">
              <button
                className={`tool-btn ${currentTool === 'draw' ? 'active' : ''}`}
                onClick={() => setCurrentTool('draw')}
                title="Pen"
              >
                ✏️
              </button>
              <button
                className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`}
                onClick={() => setCurrentTool('text')}
                title="Text"
              >
                T
              </button>
              <button
                className={`tool-btn ${currentTool === 'sticky' ? 'active' : ''}`}
                onClick={() => setCurrentTool('sticky')}
                title="Sticky Note"
              >
                🟨
              </button>
              <button
                className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
                onClick={() => setCurrentTool('eraser')}
                title="Eraser"
              >
                🧹
              </button>
            </div>

            <div className="tool-settings">
              <label>Size</label>
              {currentTool === 'draw' && (
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={currentSize}
                  onChange={(e) => setCurrentSize(parseInt(e.target.value))}
                />
              )}
              {(currentTool === 'text' || currentTool === 'sticky') && (
                <input
                  type="range"
                  min="12"
                  max="48"
                  value={currentFontSize}
                  onChange={(e) => setCurrentFontSize(parseInt(e.target.value))}
                />
              )}
            </div>

            <div className="color-picker">
              <label>Color</label>
              <div className="color-grid">
                {['#E67E22', '#2C3E50', '#E74C3C', '#27AE60', '#2980B9', '#8E44AD', '#F1C40F', '#95A5A6'].map(color => (
                  <div
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`color-swatch ${currentColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="divider"></div>

            <div className="classmates-section">
              <h3>Classmates <span className="count">{Object.keys(users).length}</span></h3>
              <div className="users-list">
                {Object.values(users).map(user => (
                  <div key={user.id} className="user-item">
                    <img
                      src={user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}
                      alt={user.username}
                      className="user-avatar"
                    />
                    <span className="user-name">{user.username}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="divider"></div>
            <button
              className="action-btn delete-page-btn"
              onClick={handleClearPage}
              title="Clear Page"
            >
              🗑️ Clear Page
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && currentUserProfile && (
        <Settings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          currentUser={currentUserProfile}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}
    </div>
  );
}

export default App;
