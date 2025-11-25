import { create } from 'zustand';

interface UIState {
    leftSidebarOpen: boolean;
    rightSidebarOpen: boolean;
    activeTool: string;
    activeTab: string;
    activeColor: string;

    // Tool settings
    brushSize: number;
    highlighterSize: number;
    fontSize: number;
    textAlignment: 'left' | 'center' | 'right';
    stickyColor: string;

    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    setLeftSidebarOpen: (open: boolean) => void;
    setRightSidebarOpen: (open: boolean) => void;
    setActiveTool: (tool: string) => void;
    setActiveTab: (tab: string) => void;
    setActiveColor: (color: string) => void;

    // Tool settings actions
    setBrushSize: (size: number) => void;
    setHighlighterSize: (size: number) => void;
    setFontSize: (size: number) => void;
    setTextAlignment: (alignment: 'left' | 'center' | 'right') => void;
    setStickyColor: (color: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    activeTool: 'cursor',
    activeTab: 'notes',
    activeColor: '#000000',

    // Tool settings defaults
    brushSize: 2,
    highlighterSize: 20,
    fontSize: 20,
    textAlignment: 'left',
    stickyColor: '#FEF3C7', // Yellow

    toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
    toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
    setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
    setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
    setActiveTool: (tool) => set({ activeTool: tool }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setActiveColor: (color) => set({ activeColor: color }),

    // Tool settings actions
    setBrushSize: (size) => set({ brushSize: size }),
    setHighlighterSize: (size) => set({ highlighterSize: size }),
    setFontSize: (size) => set({ fontSize: size }),
    setTextAlignment: (alignment) => set({ textAlignment: alignment }),
    setStickyColor: (color) => set({ stickyColor: color }),
}));
