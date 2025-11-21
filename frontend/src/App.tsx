import React, { useEffect, useState, useRef } from 'react';
import { initializeDiscord } from './discord';
import { PdfBoard } from './PdfBoard';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { DrawOp, TextOp, RoomState, WSMessage, UserProfile, Tool, DiscordInfo } from './types';
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

  const handleWSMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'snapshot':
        setRoomState(message.data);
        break;

      case 'set_pdf':
        // If pdfId is null, it means we are going back to dashboard
        setRoomState((prev) => {
          if (!prev) return null;

          if (!message.pdfId) {
            return {
              ...prev,
              currentPdfId: null,
              currentPage: 1,
              drawOps: [],
              textOps: [],
            };
          }

          return {
            ...prev,
            currentPdfId: message.pdfId,
            currentPage: 1,
            drawOps: [],
            textOps: [],
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

      case 'clear_page_broadcast':
        setRoomState((prev) => ({
          ...prev!,
          drawOps: prev!.drawOps.filter(op => op.page !== message.page),
          textOps: prev!.textOps.filter(op => op.page !== message.page),
        }));
        break;

      case 'delete_annotation_broadcast':
        setRoomState((prev) => ({
          ...prev!,
          drawOps: prev!.drawOps.filter(op => op.id !== message.id),
          textOps: prev!.textOps.filter(op => op.id !== message.id),
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

  const sendWSMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { pdfId, url } = await response.json();

      setAvailablePdfs((prev) => [
        ...prev,
        { id: pdfId, name: file.name, url, size: file.size }
      ]);

      // Automatically open the new book for everyone
      sendWSMessage({ type: 'set_pdf', pdfId });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectPdf = (pdfId: string) => {
    sendWSMessage({ type: 'set_pdf', pdfId });
  };

  const handleCloseBook = () => {
    // Send null pdfId to return everyone to dashboard
    sendWSMessage({ type: 'set_pdf', pdfId: null });
  };

  const handleDeletePdf = async (pdfId: string) => {
    if (!confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/pdfs/${pdfId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete PDF');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete PDF');
    }
  };

  // --- Board Handlers ---

  const handleChangePage = (page: number) => {
    sendWSMessage({ type: 'change_page', page });
  };

  const handleDraw = (drawOp: Omit<DrawOp, 'userId' | 'ts'>) => {
    sendWSMessage({
      type: 'draw',
      id: drawOp.id,
      page: drawOp.page,
      path: drawOp.path,
      color: drawOp.color,
      size: drawOp.size,
    });
  };

  const handleText = (textOp: Omit<TextOp, 'userId' | 'ts'>) => {
    sendWSMessage({
      type: 'text',
      id: textOp.id,
      page: textOp.page,
      x: textOp.x,
      y: textOp.y,
      text: textOp.text,
      color: textOp.color,
      fontSize: textOp.fontSize,
    });
  };

  const handleClearPage = () => {
    if (roomState?.currentPage) {
      sendWSMessage({
        type: 'clear_page',
        page: roomState.currentPage,
      });
    }
  };

  const handleDeleteAnnotation = (id: string) => {
    sendWSMessage({
      type: 'delete_annotation',
      id: id,
    });
  };

  const handleCursorMove = (x: number, y: number, color: string) => {
    sendWSMessage({
      type: 'cursor',
      x,
      y,
      color,
    });
  };

  // --- Render Helpers ---

  const currentUserProfile = discordInfo ? {
    id: discordInfo.userId,
    username: discordInfo.username,
    discriminator: discordInfo.discriminator,
    avatar: discordInfo.avatar
  } : null;

  return (
    <div className="app-container">
      {/* Left Sidebar: Navigation */}
      <div className="sidebar">
        <h3>Navigation</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className={`toolbar-btn ${!roomState?.currentPdfId ? 'active' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0 15px', borderRadius: '8px' }}
            onClick={handleCloseBook}
          >
            📚 Bookshelf
          </button>
          <button
            className="toolbar-btn"
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0 15px', borderRadius: '8px' }}
            onClick={() => setIsSettingsOpen(true)}
          >
            ⚙️ Settings
          </button>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <h3>Classmates</h3>
          <div className="users-list">
            {Object.values(users).length === 0 ? (
              <p style={{ color: '#7f8c8d', fontStyle: 'italic', fontSize: '0.9rem' }}>Just you here.</p>
            ) : (
              Object.values(users).map(user => (
                <div key={user.id} className="user-item">
                  <img
                    src={user.avatar
                      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
                      : 'https://cdn.discordapp.com/embed/avatars/0.png'
                    }
                    alt={user.username}
                    className="user-avatar"
                  />
                  <span className="user-name">{user.username}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {roomState?.currentPdfId ? (
          <>
            <div className="reader-nav">
              <button className="back-btn" onClick={handleCloseBook}>
                ← Back to Bookshelf
              </button>
              <span style={{ fontWeight: 600 }}>
                {availablePdfs.find(p => p.id === roomState.currentPdfId)?.name || 'Unknown Book'}
              </span>
              <div style={{ width: '100px' }}></div> {/* Spacer for centering */}
            </div>
            <div className="board-container">
              <PdfBoard
                pdfId={roomState.currentPdfId}
                currentPage={roomState.currentPage}
                drawOps={roomState.drawOps.filter(op => op.page === roomState.currentPage)}
                textOps={roomState.textOps.filter(op => op.page === roomState.currentPage)}

                onDraw={handleDraw}
                onText={handleText}

                onDeleteAnnotation={handleDeleteAnnotation}
                cursors={cursors}
                onCursorMove={handleCursorMove}
                users={users}
                // Tool Props
                currentTool={currentTool}
                currentColor={currentColor}
                currentSize={currentSize}
                currentFontSize={currentFontSize}
              />
            </div>
          </>
        ) : (
          <Dashboard
            pdfs={availablePdfs}
            onSelectPdf={handleSelectPdf}
            onDeletePdf={handleDeletePdf}
            onUpload={handleFileUpload}
            uploading={uploading}
            currentUser={currentUserProfile}
          />
        )}
      </div>

      {/* Right Sidebar: Tools (Only visible when reading) */}
      {roomState?.currentPdfId && (
        <div className="sidebar right">
          <h3>Tools</h3>
          <div className="sidebar-toolbar">
            {/* Page Navigation */}
            <div className="toolbar-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <button className="toolbar-btn" onClick={() => handleChangePage(roomState.currentPage - 1)} disabled={roomState.currentPage <= 1}>←</button>
                <span>Page {roomState.currentPage}</span>
                <button className="toolbar-btn" onClick={() => handleChangePage(roomState.currentPage + 1)}>→</button>
              </div>
            </div>

            <div className="toolbar-divider"></div>

            {/* Drawing Tools */}
            <div className="toolbar-section">
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <button
                  className={`toolbar-btn ${currentTool === 'draw' ? 'active' : ''}`}
                  onClick={() => setCurrentTool('draw')}
                  title="Draw"
                >
                  ✏️
                </button>
                <button
                  className={`toolbar-btn ${currentTool === 'text' ? 'active' : ''}`}
                  onClick={() => setCurrentTool('text')}
                  title="Text"
                >
                  T
                </button>
                <button
                  className={`toolbar-btn ${currentTool === 'eraser' ? 'active' : ''}`}
                  onClick={() => setCurrentTool('eraser')}
                  title="Eraser"
                >
                  🧹
                </button>
              </div>

              {/* Color Picker */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Color</label>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {['#E67E22', '#E74C3C', '#2ECC71', '#3498DB', '#9B59B6', '#34495E'].map(color => (
                    <div
                      key={color}
                      onClick={() => setCurrentColor(color)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: color,
                        cursor: 'pointer',
                        border: currentColor === color ? '2px solid #2C3E50' : '1px solid #ddd'
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}
                    style={{ width: '24px', height: '24px', padding: 0, border: 'none', background: 'none' }}
                  />
                </div>
              </div>

              {/* Size Slider */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Size: {currentSize}px</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={currentSize}
                  onChange={(e) => setCurrentSize(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--bg-accent)' }}
                />
              </div>

              {/* Font Size Slider */}
              {currentTool === 'text' && (
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Font Size: {currentFontSize}px</label>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={currentFontSize}
                    onChange={(e) => setCurrentFontSize(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--bg-accent)' }}
                  />
                </div>
              )}

              <button
                className="toolbar-btn"
                onClick={handleClearPage}
                style={{ width: '100%', marginTop: '10px', background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c' }}
              >
                Clear Page
              </button>
            </div>
          </div>
        </div>
      )}

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUserProfile}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}

export default App;
