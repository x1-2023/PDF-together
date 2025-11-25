# Frontend Rewrite Plan

## Goal
Completely rewrite the frontend application from scratch to resolve persistent technical debt and stability issues (specifically with `react-window` and complex state management), while maintaining **100% of the current UI and feature set**.

## User Review Required
> [!IMPORTANT]
> This is a complete rewrite of the `frontend` directory.
> - **Tech Stack**: Vite + React + TypeScript + TailwindCSS.
> - **State Management**: Moving from local `useState` to **Zustand** for better performance and cleaner code.
> - **Virtualization**: Implementing `react-window` correctly from the start with a dedicated wrapper to handle ESM/CJS issues.
> - **Backend Compatibility**: No changes to the backend. The frontend will remain compatible with the existing WebSocket and API.
> - **UI/UX**: Adhering strictly to the [UI/UX Design Specifications](file:///C:/Users/0xQ/.gemini/antigravity/brain/3a82214d-7b93-4d96-b4ec-fcac47648ef3/ui_ux_design.md).

## Feature Audit (Must-Have List)
The following features will be reimplemented:

### 1. PDF Reader Core
- [ ] **PDF Rendering**: High-performance rendering using `react-pdf`.
- [ ] **Virtualization**: `react-window` for main canvas and sidebar thumbnails to support large files.
- [ ] **Zooming**: Ctrl+Scroll, Zoom In/Out buttons, Fit to Width/Page.
- [ ] **Navigation**: Next/Prev page, Jump to page input, Scroll synchronization.
- [ ] **Layout**: Resizable Left Sidebar (Thumbnails) and Right Sidebar (Chat/Tools).

### 2. Annotation System (Whiteboard)
- [ ] **Tools**: Pen, Highlighter, Eraser, Text Box, Sticky Note.
- [ ] **Interaction**: Drawing on top of PDF pages.
- [ ] **History**: Undo/Redo functionality.
- [ ] **Real-time Sync**: WebSocket synchronization of annotations with other users.
- [ ] **Persistence**: Saving/Loading annotations via API.

### 3. Collaboration & AI
- [ ] **Chat**: Real-time chat sidebar with user presence.
- [ ] **AI Assistant**: Integration with Gemini for explaining text/chatting (via `ai.ts`).
- [ ] **Discord Activity**: Initialization of Discord SDK (`setupDiscordSdk`).

### 4. UI/UX
- [ ] **Design**: "Study Focus" aesthetic (Dark/Light mode support).
- [ ] **Components**: `CatLoader` (loading animation), Toast notifications (`sonner` or `ui/toaster`).
- [ ] **Responsive**: Mobile-friendly layout adjustments.

## Architecture & Tech Stack

### Dependencies
- **Build Tool**: Vite
- **Framework**: React 18+
- **Language**: TypeScript
- **Styling**: TailwindCSS v3 (Stable) + `clsx` + `tailwind-merge`
- **State Management**: `zustand` (New addition to solve state complexity)
- **PDF**: `react-pdf`
- **Virtualization**: `react-window`, `react-virtualized-auto-sizer`
- **Icons**: `lucide-react` or `material-symbols` (as currently used)
- **Animations**: `framer-motion`

### Directory Structure
```
src/
  components/
    pdf/          # PDF specific components (Canvas, Page, Sidebar)
    annotation/   # Annotation tools and layers
    chat/         # Chat and AI components
    ui/           # Reusable UI components (Button, Input, Toast)
    layout/       # Layout wrappers (MainLayout, ResizablePanel)
  store/          # Zustand stores
    usePDFStore.ts
    useUIStore.ts
    useChatStore.ts
  hooks/          # Custom hooks (useWebSocket, useAuth)
  services/       # API and AI services
  lib/            # Utilities (Discord SDK, utils)
  pages/          # Route pages (Reader, Home)
```

## Migration Steps

### Phase 1: Initialization
1.  Backup current `frontend` to `frontend_backup`.
2.  Initialize new Vite project in `frontend`.
3.  Install dependencies (including `zustand`).
4.  Setup TailwindCSS and global styles (`index.css`).

### Phase 2: Core Infrastructure
1.  Implement `usePDFStore` and `useUIStore`.
2.  Setup `react-pdf` worker.
3.  Create `VirtualizedList` wrapper for `react-window` (to fix import issues once and for all).

### Phase 3: PDF & Sidebar
1.  Implement `PDFPage` component.
2.  Implement `VirtualizedPDFCanvas`.
3.  Implement `VirtualizedSidebar` (Thumbnails).
4.  Integrate Resizable Layouts.

### Phase 4: Annotations & Real-time
1.  Port `AnnotationLayer` logic.
2.  Implement `Toolbar` and Drawing tools.
3.  Setup WebSocket connection in `useChatStore` or custom hook.

### Phase 5: Polish & Integration
1.  Add `CatLoader` and `DocumentLoader` (Initial Load).
2.  Integrate Discord SDK.
3.  Final QA against Feature Audit list.

## Verification Plan
- **Manual Testing**: Verify each feature in the "Feature Audit" list.
- **Performance**: Ensure 60fps scrolling on large PDFs.
- **Collaboration**: Open two tabs and verify real-time sync of chat and drawings.
