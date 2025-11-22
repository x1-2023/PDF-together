import React from 'react';
import { Button } from '../UI/Button';
import { Icons } from '../UI/Icons';
import { Tool } from '../../types';

interface ToolbarProps {
    activeTool: Tool;
    onToolChange: (tool: Tool) => void;
    onUndo: () => void;
    canUndo: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ activeTool, onToolChange, onUndo, canUndo }) => {
    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-6 py-2 flex items-center gap-2 border border-[var(--color-gray-100)] z-50 transition-transform hover:-translate-y-1 duration-300">
            <Button
                variant={activeTool === 'draw' ? 'primary' : 'ghost'}
                onClick={() => onToolChange('draw')}
                className={`rounded-full w-12 h-12 p-0 flex items-center justify-center transition-all ${activeTool === 'draw' ? 'scale-110' : ''}`}
                title="Pencil"
            >
                <Icons.Pencil />
            </Button>
            <Button
                variant={activeTool === 'text' ? 'primary' : 'ghost'}
                onClick={() => onToolChange('text')}
                className={`rounded-full w-12 h-12 p-0 flex items-center justify-center transition-all ${activeTool === 'text' ? 'scale-110' : ''}`}
                title="Text"
            >
                <Icons.Type />
            </Button>
            <Button
                variant={activeTool === 'sticky' ? 'primary' : 'ghost'}
                onClick={() => onToolChange('sticky')}
                className={`rounded-full w-12 h-12 p-0 flex items-center justify-center transition-all ${activeTool === 'sticky' ? 'scale-110' : ''}`}
                title="Sticky Note"
            >
                <Icons.StickyNote />
            </Button>

            <div className="w-px h-8 bg-[var(--color-gray-200)] mx-2" />

            <Button
                variant={activeTool === 'eraser' ? 'primary' : 'ghost'}
                onClick={() => onToolChange('eraser')}
                className={`rounded-full w-12 h-12 p-0 flex items-center justify-center transition-all ${activeTool === 'eraser' ? 'scale-110' : ''}`}
                title="Eraser"
            >
                <Icons.Eraser />
            </Button>

            <div className="w-px h-8 bg-[var(--color-gray-200)] mx-2" />

            <Button
                variant="ghost"
                onClick={onUndo}
                disabled={!canUndo}
                className="rounded-full w-12 h-12 p-0 flex items-center justify-center text-[var(--color-text-light)] hover:text-[var(--color-text-dark)]"
                title="Undo"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
            </Button>
        </div>
    );
};
