import React, { useEffect, useState, useRef } from 'react';
import { initializeDiscord } from './discord';
import { PdfBoard } from './PdfBoard';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { DrawOp, TextOp, StickyOp, RoomState, WSMessage, UserProfile, Tool, DiscordInfo } from './types';
import './App.css';

function App() {
  // --- State: Data & Networking ---
  const [discordInfo, setDiscordInfo] = useState<DiscordInfo | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [availablePdfs, setAvailablePdfs] = useState<Array<{ id: string; name: string; url: string; size?: number }>>([]);
  const [uploading, setUploading] = useState(false);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; color: string }>>({});
  const [users, setUsers] = useState<Record<string, UserProfile>>({});

  // --- State: Tools & UI ---
  const [currentTool, setCurrentTool] = useState<Tool>('draw');
  const [currentColor, setCurrentColor] = useState('#E67E22');
  const [currentSize, setCurrentSize] = useState(3);
  const [currentFontSize, setCurrentFontSize] = useState(16);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [studyMode, setStudyMode] = useState(false); // New Study Mode State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const wsRef = useRef<WebSocket | null>(null);
  const initRef = useRef(false);

  const currentUserProfile: UserProfile | null = discordInfo ? {
    id: discordInfo.userId,
    username: discordInfo.username,
    discriminator: discordInfo.discriminator,
    avatar: discordInfo.avatar
  } : null;

  // --- Initialization & WebSocket ---
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        const info = await initializeDiscord();
        setDiscordInfo(info);

        // Fetch PDFs
        try {
          const response = await fetch('/api/pdfs');
          const data = await response.json();
          setAvailablePdfs(data.pdfs || []);
        } catch (err) {
          console.error('Failed to load PDFs:', err);
        }

        // Connect WebSocket
        const isDiscordActivity = window.location.hostname.includes('discordsays.com');
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let baseUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:3001';
        if (isDiscordActivity) baseUrl = `${wsProtocol}//${window.location.host}`;
        baseUrl = baseUrl.replace(/\/ws\/?$/, '').replace(/\/$/, '');

        const params = new URLSearchParams({
          channelId: info.channelId,
          userId: info.userId,
          username: info.username,
          discriminator: info.discriminator,
          avatar: info.avatar || '',
        });
        const ws = new WebSocket(`${wsUrl}/ws?${params.toString()}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          const message: WSMessage = JSON.parse(event.data);
          handleWSMessage(message);
        };
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    init();

    return () => {
      if (wsRef.current) wsRef.current.close();
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
        setRoomState(prev => {
          if (!prev) return null;
          if (!message.pdfId) return { ...prev, currentPdfId: null, currentPage: 1, drawOps: [], textOps: [], stickyOps: [] };
          return { ...prev, currentPdfId: message.pdfId, currentPage: 1, drawOps: [], textOps: [], stickyOps: [] };
        });
        break;
      case 'change_page':
        setRoomState(prev => ({ ...prev!, currentPage: message.page }));
        break;
      case 'draw_broadcast':
        setRoomState(prev => ({ ...prev!, drawOps: [...prev!.drawOps, message.op] }));
        break;
      case 'text_broadcast':
        setRoomState(prev => {
          if (!prev) return null;
          const idx = prev.textOps.findIndex(o => o.id === message.op.id);
          const newOps = [...prev.textOps];
          if (idx !== -1) newOps[idx] = message.op;
          else newOps.push(message.op);
          return { ...prev, textOps: newOps };
        });
        break;
      case 'sticky_broadcast':
        setRoomState(prev => {
          if (!prev) return null;
          const idx = prev.stickyOps.findIndex(o => o.id === message.op.id);
          const newOps = [...prev.stickyOps];
          if (idx !== -1) newOps[idx] = message.op;
          else newOps.push(message.op);
          return { ...prev, stickyOps: newOps };
        });
        break;
      case 'clear_page_broadcast':
        setRoomState(prev => ({
          ...prev!,
          drawOps: prev!.drawOps.filter(op => op.page !== message.page),
          textOps: prev!.textOps.filter(op => op.page !== message.page),
          stickyOps: prev!.stickyOps.filter(op => op.page !== message.page),
        }));
        break;
      case 'delete_annotation_broadcast':
        setRoomState(prev => ({
          ...prev!,
          drawOps: prev!.drawOps.filter(op => op.id !== message.id),
          textOps: prev!.textOps.filter(op => op.id !== message.id),
          stickyOps: prev!.stickyOps.filter(op => op.id !== message.id),
        }));
        break;
      case 'cursor':
        setCursors(prev => ({ ...prev, [message.userId]: { x: message.x, y: message.y, color: message.color } }));
        break;
      case 'pdf_deleted':
        setAvailablePdfs(prev => prev.filter(p => p.id !== message.pdfId));
        setRoomState(prev => (prev?.currentPdfId === message.pdfId ? { ...prev, currentPdfId: null } : prev));
        break;
      case 'user_joined':
        setUsers(prev => ({ ...prev, [message.user.id]: message.user }));
        break;
      case 'user_left':
        setUsers(prev => {
          const next = { ...prev };
          delete next[message.userId];
          return next;
        });
        setCursors(prev => {
          const next = { ...prev };
          delete next[message.userId];
          return next;
        });
        break;
    }
  };

  // --- Handlers ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setAvailablePdfs(prev => [...prev, { id: data.pdfId, name: file.name, url: `/pdf/${data.pdfId}`, size: file.size }]);
      sendWSMessage({ type: 'set_pdf', pdfId: data.pdfId });
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const handleDraw = (op: any) => {
    if (!currentUserProfile || !roomState?.currentPdfId) return;
    const fullOp = { ...op, userId: currentUserProfile.id, ts: Date.now() };
    setRoomState(prev => prev ? { ...prev, drawOps: [...prev.drawOps, fullOp] } : null);
    sendWSMessage({ type: 'draw_broadcast', op: fullOp });
  };

  const handleText = (op: any) => {
    if (!currentUserProfile || !roomState?.currentPdfId) return;
    const fullOp = { ...op, userId: currentUserProfile.id, ts: Date.now() };
    // Optimistic update omitted for brevity, relying on WS echo or simple local set
    sendWSMessage({ type: 'text_broadcast', op: fullOp });
  };

  const handleSticky = (op: any) => {
    if (!currentUserProfile || !roomState?.currentPdfId) return;
    const fullOp = { ...op, userId: currentUserProfile.id, ts: Date.now() };
    sendWSMessage({ type: 'sticky_broadcast', op: fullOp });
  };

  const handleCursorMove = (x: number, y: number, color: string) => {
    if (!currentUserProfile) return;
    sendWSMessage({ type: 'cursor', userId: currentUserProfile.id, x, y, color });
  };

  if (!discordInfo) return <div className="loading">Loading Discord...</div>;

  const isStudyView = !!roomState?.currentPdfId;

  return (
    <div className="app-layout">
      {/* --- Left Sidebar: Navigation --- */}
      {isStudyView && (
        <div className="sidebar left">
          <div className="sidebar-header">
            <h2>Navigation</h2>
          </div>
          <div className="sidebar-content">
            <button className="nav-item" onClick={() => sendWSMessage({ type: 'set_pdf', pdfId: null })}>
              <span className="icon">📚</span> Bookshelf
            </button>
            <div className="divider"></div>
            <div className="book-info-sidebar">
              <p className="section-label">Current Book</p>
              <h4 className="book-title-small">{availablePdfs.find(p => p.id === roomState.currentPdfId)?.name || 'Unknown'}</h4>
            </div>
          </div>
          <div className="sidebar-footer">
            <button className="nav-item" onClick={() => setIsSettingsOpen(true)}>
              <span className="icon">⚙️</span> Settings
            </button>
          </div>
        </div>
      )}

      {/* --- Main Content --- */}
      <div className="main-stage">
        {isStudyView ? (
          <>
            {/* Reader Navigation */}
            <div className="reader-nav">
              <button
                className="page-control"
                onClick={() => sendWSMessage({ type: 'change_page', page: Math.max(1, (roomState?.currentPage || 1) - 1) })}
                disabled={(roomState?.currentPage || 1) <= 1}
              >
                Previous
              </button>
              <span style={{ fontWeight: 600 }}>Page {roomState?.currentPage}</span>
              <button
                className="page-control"
                onClick={() => sendWSMessage({ type: 'change_page', page: (roomState?.currentPage || 1) + 1 })}
              >
                Next
              </button>
            </div>

            {/* PDF Board */}
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '20px' }}>
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
                onDeleteAnnotation={(id) => sendWSMessage({ type: 'delete_annotation_broadcast', id })}
                onCursorMove={handleCursorMove}
              />
            </div>
          </>
        ) : (
          <Dashboard
            pdfs={availablePdfs}
            onSelectPdf={(id) => sendWSMessage({ type: 'set_pdf', pdfId: id })}
            onDeletePdf={(id) => {
              if (confirm('Delete PDF?')) fetch(`/api/pdfs/${id}`, { method: 'DELETE' });
            }}
            onUpload={handleFileUpload}
            uploading={uploading}
            currentUser={currentUserProfile}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </div>

      {/* --- Right Sidebar: Tools --- */}
      {isStudyView && (
        <div className="sidebar right">
          <div className="sidebar-header">
            <h2>Tools</h2>
          </div>
          <div className="sidebar-content">
            <div className="tools-section">
              <p className="section-label">Mode</p>
              <div className="tools-grid">
                <button className={`tool-btn ${currentTool === 'draw' ? 'active' : ''}`} onClick={() => setCurrentTool('draw')}>✏️</button>
                <button className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`} onClick={() => setCurrentTool('text')}>T</button>
                <button className={`tool-btn ${currentTool === 'sticky' ? 'active' : ''}`} onClick={() => setCurrentTool('sticky')}>🟨</button>
                <button className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`} onClick={() => setCurrentTool('eraser')}>🧹</button>
              </div>
            </div>

            <div className="tools-section">
              <p className="section-label">Settings</p>
              {currentTool === 'draw' && (
                <input type="range" min="1" max="20" value={currentSize} onChange={(e) => setCurrentSize(parseInt(e.target.value))} style={{ width: '100%' }} />
              )}
              {(currentTool === 'text' || currentTool === 'sticky') && (
                <input type="range" min="12" max="48" value={currentFontSize} onChange={(e) => setCurrentFontSize(parseInt(e.target.value))} style={{ width: '100%' }} />
              )}
            </div>

            <div className="tools-section">
              <p className="section-label">Color</p>
              <div className="color-options">
                {['#E67E22', '#2C3E50', '#E74C3C', '#27AE60', '#2980B9', '#8E44AD', '#F1C40F', '#95A5A6'].map(c => (
                  <div
                    key={c}
                    className={`color-dot ${currentColor === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setCurrentColor(c)}
                  />
                ))}
              </div>
            </div>

            {!studyMode && (
              <div className="tools-section">
                <p className="section-label">Classmates ({Object.keys(users).length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.values(users).map(u => (
                    <div key={u.id} className="user-row">
                      <img src={u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'} className="user-avatar" />
                      <span className="user-name">{u.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 'auto' }}>
              <button className="btn-ghost" style={{ width: '100%', color: '#c0392b', borderColor: '#fadbd8', background: '#fff5f5' }} onClick={handleClearPage}>
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
        studyMode={studyMode}
        onStudyModeChange={setStudyMode}
      />
    </div>
  );
}

export default App;
