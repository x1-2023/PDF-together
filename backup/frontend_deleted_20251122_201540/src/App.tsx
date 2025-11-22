import { useEffect, useState, useRef } from 'react';
import { initializeDiscord } from './discord';
import { Sidebar } from './components/Layout/Sidebar';
import { Bookshelf } from './components/Dashboard/Bookshelf';
import { StudyRoomPage } from './pages/StudyRoomPage';
import { SettingsModal } from './components/Settings/SettingsModal';
import { Book, RoomState, WSMessage, UserProfile, DiscordInfo } from './types';
import './styles/global.css';

function App() {
    // --- State ---
    const [discordInfo, setDiscordInfo] = useState<DiscordInfo | null>(null);
    const [roomState, setRoomState] = useState<RoomState | null>(null);
    const [cursors, setCursors] = useState<Record<string, { x: number; y: number; color: string }>>({});
    const [users, setUsers] = useState<Record<string, UserProfile>>({});

    const [activeTab, setActiveTab] = useState<'bookshelf' | 'classmates' | 'settings'>('bookshelf');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
                const ws = new WebSocket(`${baseUrl}/ws?${params.toString()}`);
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

    const handleOpenBook = (book: Book) => {
        sendWSMessage({ type: 'set_pdf', pdfId: book.id });
    };

    const handleBackToLibrary = () => {
        sendWSMessage({ type: 'set_pdf', pdfId: null });
    };

    if (!discordInfo) return <div className="flex items-center justify-center h-screen bg-[var(--color-bg-cream)] text-[var(--color-text-dark)] font-display text-xl">Loading Study Focus...</div>;

    const isStudyView = !!roomState?.currentPdfId;

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg-cream)]">
            {!isStudyView && (
                <Sidebar
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                        if (tab === 'settings') setIsSettingsOpen(true);
                        else setActiveTab(tab);
                    }}
                />
            )}

            <div className="flex-1 h-full overflow-hidden relative">
                {isStudyView ? (
                    <StudyRoomPage
                        roomState={roomState}
                        users={users}
                        cursors={cursors}
                        currentUser={currentUserProfile}
                        onBack={handleBackToLibrary}
                        onDraw={(op) => {
                            const fullOp = { ...op, userId: currentUserProfile?.id, ts: Date.now() };
                            setRoomState(prev => prev ? { ...prev, drawOps: [...prev.drawOps, fullOp] } : null);
                            sendWSMessage({ type: 'draw_broadcast', op: fullOp });
                        }}
                        onText={(op) => {
                            const fullOp = { ...op, userId: currentUserProfile?.id, ts: Date.now() };
                            sendWSMessage({ type: 'text_broadcast', op: fullOp });
                        }}
                        onSticky={(op) => {
                            const fullOp = { ...op, userId: currentUserProfile?.id, ts: Date.now() };
                            sendWSMessage({ type: 'sticky_broadcast', op: fullOp });
                        }}
                        onDeleteAnnotation={(id) => sendWSMessage({ type: 'delete_annotation_broadcast', id })}
                        onCursorMove={(x, y, color) => {
                            if (!currentUserProfile) return;
                            sendWSMessage({ type: 'cursor', userId: currentUserProfile.id, x, y, color });
                        }}
                        onChangePage={(page) => sendWSMessage({ type: 'change_page', page })}
                    />
                ) : (
                    <Bookshelf onOpenBook={handleOpenBook} user={currentUserProfile} />
                )}
            </div>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                user={currentUserProfile}
            />
        </div>
    );
}

export default App;
