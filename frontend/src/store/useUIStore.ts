import { create } from 'zustand';

interface UIState {
    leftSidebarOpen: boolean;
    rightSidebarOpen: boolean;
    activeTool: string;
    activeTab: string;
    activeColor: string;

    toggleLeftSidebar: () => void;
    toggleRightSidebar: () => void;
    setLeftSidebarOpen: (open: boolean) => void;
    setRightSidebarOpen: (open: boolean) => void;
    setActiveTool: (tool: string) => void;
    setActiveTab: (tab: string) => void;
    setActiveColor: (color: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    activeTool: 'cursor',
    activeTab: 'notes',
    activeColor: '#000000',

    toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
    toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),
    setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
    setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
    setActiveTool: (tool) => set({ activeTool: tool }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setActiveColor: (color) => set({ activeColor: color }),
}));
