import React, { useEffect, useState, useRef } from 'react';
import { initializeDiscord } from './discord';
import { PdfBoard } from './PdfBoard';
import { DrawOp, TextOp, RoomState, WSMessage, DiscordInfo, UserProfile, Tool } from './types';
import './App.css';

function App() {
  const [discordInfo, setDiscordInfo] = useState<DiscordInfo | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [availablePdfs, setAvailablePdfs] = useState<Array<{ id: string; name: string; url: string }>>([]);
  const [uploading, setUploading] = useState(false);

  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; color: string }>>({});
  const [users, setUsers] = useState<Record<string, UserProfile>>({});

  // Tool State
  const [currentTool, setCurrentTool] = useState<Tool>('draw');
  const [currentColor, setCurrentColor] = useState('#ff0000');
  const [currentSize, setCurrentSize] = useState(3);
  const [currentFontSize, setCurrentFontSize] = useState(16);

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
        const wsUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:3001';
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
        setRoomState((prev) => ({
          ...prev!,
          currentPdfId: message.pdfId,
          currentPage: 1,
          drawOps: [],
          textOps: [],
        }));
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
          // Check if we should update existing op or add new one
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
        // If current PDF was deleted, clear it
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

      const { pdfId } = await response.json();

      // Notify all clients about the new PDF
      sendWSMessage({ type: 'set_pdf', pdfId });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

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

  const handleDeletePdf = async (pdfId: string) => {
    if (!confirm('Are you sure you want to delete this PDF? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/pdfs/${pdfId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete PDF');
      }

      // UI update will happen via WebSocket 'pdf_deleted' message
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete PDF');
    }
  };

  return (
    <div className="app-container">
      {/* Left Sidebar: Bookshelf */}
      <div className="sidebar">
        <h3>📚 Bookshelf</h3>

        <label className="upload-btn" style={{
          display: 'block',
          width: '100%',
          padding: '10px',
          background: '#E67E22',
          color: 'white',
          textAlign: 'center',
          borderRadius: '6px',
          marginBottom: '20px',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}>
          {uploading ? 'Uploading...' : '+ Upload New Book'}
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>

        <div className="pdf-list">
          {availablePdfs.length === 0 ? (
            <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No books yet.</p>
          ) : (
            availablePdfs.map(pdf => (
              <div
                key={pdf.id}
                className={`pdf-item ${roomState?.currentPdfId === pdf.id ? 'active' : ''}`}
                onClick={() => sendWSMessage({ type: 'set_pdf', pdfId: pdf.id })}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📄 {pdf.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePdf(pdf.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: 0.5,
                  }}
                  title="Delete PDF"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content: Whiteboard */}
      <div className="main-content">
        <div className="board-container">
          {roomState?.currentPdfId ? (
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
          ) : (
            <div className="placeholder" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#95a5a6'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📖</div>
              <h2>Select a book to start studying</h2>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Tools & Classmates */}
      <div className="sidebar right">
        <h3>🛠️ Tools</h3>
        <div className="sidebar-toolbar">
          {/* Page Navigation */}
          <div className="toolbar-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <button className="toolbar-btn" onClick={() => handleChangePage(roomState ? roomState.currentPage - 1 : 1)} disabled={!roomState || roomState.currentPage <= 1}>←</button>
              <span>{roomState?.currentPage || 1}</span>
              <button className="toolbar-btn" onClick={() => handleChangePage(roomState ? roomState.currentPage + 1 : 1)} disabled={!roomState}>→</button>
            </div>
          </div>

          <div className="toolbar-divider"></div>

          {/* Tools */}
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
                📝
              </button>
              <button
                className={`toolbar-btn ${currentTool === 'eraser' ? 'active' : ''}`}
                onClick={() => setCurrentTool('eraser')}
                title="Eraser"
              >
                🗑️
              </button>
            </div>
          </div>

          <div className="toolbar-divider"></div>

          {/* Properties */}
          <div className="toolbar-section">
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Color</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                {['#000000', '#ff0000', '#00ff00', '#0000ff', '#E67E22'].map(color => (
                  <div
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: color,
                      cursor: 'pointer',
                      border: currentColor === color ? '2px solid #2C3E50' : '1px solid #ddd',
                      transform: currentColor === color ? 'scale(1.2)' : 'scale(1)'
                    }}
                  />
                ))}
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  style={{ width: '20px', height: '20px', padding: 0, border: 'none', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer' }}
                />
              </div>
            </div>

            {currentTool === 'draw' && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Size: {currentSize}px</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={currentSize}
                  onChange={(e) => setCurrentSize(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {currentTool === 'text' && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>Font Size: {currentFontSize}px</label>
                <input
                  type="range"
                  min="10"
                  max="48"
                  value={currentFontSize}
                  onChange={(e) => setCurrentFontSize(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          <div className="toolbar-divider"></div>

          <button
            className="toolbar-btn"
            onClick={handleClearPage}
            title="Clear Page"
            style={{ width: '100%', color: '#e74c3c', justifyContent: 'center' }}
          >
            🗑️ Clear Page
          </button>
        </div>

        <h3 style={{ marginTop: '20px' }}>👥 Classmates</h3>
        <div className="user-list">
          {/* Current User */}
          {discordInfo && (
            <div className="user-item" style={{ borderLeft: '4px solid #2ecc71' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {discordInfo.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${discordInfo.userId}/${discordInfo.avatar}.png`}
                    alt={discordInfo.username}
                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                  />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#bdc3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {discordInfo.username[0]}
                  </div>
                )}
                <span>{discordInfo.username} (You)</span>
              </div>
            </div>
          )}

          {/* Other Users */}
          {Object.values(users).map(user => (
            <div key={user.id} className="user-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {user.avatar ? (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`}
                    alt={user.username}
                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                  />
                ) : (
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#bdc3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {user.username[0]}
                  </div>
                )}
                <span>{user.username}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
