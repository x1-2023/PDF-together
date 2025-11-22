import React, { useState } from 'react';
import { PdfViewer } from '../components/StudyRoom/PdfViewer';
import { Toolbar } from '../components/StudyRoom/Toolbar';
import { ChatSidebar } from '../components/StudyRoom/ChatSidebar';
import { Header } from '../components/Layout/Header';
import { Button } from '../components/UI/Button';
import { Icons } from '../components/UI/Icons';
import { RoomState, Tool, UserProfile } from '../types';

interface StudyRoomPageProps {
    roomState: RoomState;
    users: Record<string, UserProfile>;
    cursors: Record<string, { x: number; y: number; color: string }>;
    currentUser: UserProfile | null;
    onBack: () => void;
    onDraw: (op: any) => void;
    onText: (op: any) => void;
    onSticky: (op: any) => void;
    onDeleteAnnotation: (id: string) => void;
    onCursorMove: (x: number, y: number, color: string) => void;
    onChangePage: (page: number) => void;
}

export const StudyRoomPage: React.FC<StudyRoomPageProps> = ({
    roomState,
    users,
    cursors,
    currentUser,
    onBack,
    onDraw,
    onText,
    onSticky,
    onDeleteAnnotation,
    onCursorMove,
    onChangePage,
}) => {
    const [activeTool, setActiveTool] = useState<Tool>('draw');
    // Hardcoded for now until UI controls are added
    const currentColor = '#E67E22';
    const currentSize = 3;
    const currentFontSize = 16;

    const canUndo = false;

    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-cream)]">
            <Header
                title={`Chapter ${roomState.currentPage}`}
                user={currentUser || undefined}
                action={
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={onBack} icon={<Icons.ArrowLeft />}>Back</Button>
                        <div className="flex items-center bg-white rounded-full border border-[var(--color-gray-200)] px-2 py-1 shadow-sm">
                            <Button variant="ghost" size="sm" onClick={() => onChangePage(Math.max(1, roomState.currentPage - 1))}>Prev</Button>
                            <span className="px-3 font-medium text-[var(--color-text-dark)] min-w-[3rem] text-center">{roomState.currentPage}</span>
                            <Button variant="ghost" size="sm" onClick={() => onChangePage(roomState.currentPage + 1)}>Next</Button>
                        </div>
                    </div>
                }
            />

            <div className="flex-1 flex overflow-hidden relative">
                <PdfViewer
                    pdfId={roomState.currentPdfId}
                    currentPage={roomState.currentPage}
                    drawOps={roomState.drawOps}
                    textOps={roomState.textOps}
                    stickyOps={roomState.stickyOps}
                    currentTool={activeTool}
                    currentColor={currentColor}
                    currentSize={currentSize}
                    currentFontSize={currentFontSize}
                    cursors={cursors}
                    users={users}
                    onDraw={onDraw}
                    onText={onText}
                    onSticky={onSticky}
                    onDeleteAnnotation={onDeleteAnnotation}
                    onCursorMove={onCursorMove}
                />

                <ChatSidebar />
            </div>

            <Toolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onUndo={() => { }}
                canUndo={canUndo}
            />
        </div>
    );
};
