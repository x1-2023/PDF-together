# Frontend Rewrite Task List

## Phase 1: Initialization & Setup
- [ ] Backup existing `frontend` to `frontend_backup` <!-- id: 0 -->
- [ ] Initialize new Vite + React + TS project <!-- id: 1 -->
- [ ] Install dependencies (`react-pdf`, `zustand`, `tailwindcss`, etc.) <!-- id: 2 -->
- [ ] Configure TailwindCSS & Global Styles <!-- id: 3 -->
- [ ] Setup `vite.config.ts` (Proxy, Alias, Optimization) <!-- id: 4 -->

## Phase 2: Core Infrastructure
- [ ] Create Zustand Stores (`usePDFStore`, `useUIStore`, `useChatStore`) <!-- id: 5 -->
- [ ] Setup `react-pdf` Global Worker <!-- id: 6 -->
- [ ] Create `VirtualizedList` wrapper for `react-window` <!-- id: 7 -->

## Phase 3: PDF Reader & Layout
- [ ] Implement `MainLayout` (Resizable Sidebars) <!-- id: 8 -->
- [ ] Implement `PDFPage` Component <!-- id: 9 -->
- [ ] Implement `VirtualizedPDFCanvas` (Main Viewer) <!-- id: 10 -->
- [ ] Implement `VirtualizedSidebar` (Thumbnails) <!-- id: 11 -->
- [ ] Implement Zoom & Navigation Controls <!-- id: 12 -->

## Phase 4: Features & Integration
- [ ] Port `AnnotationLayer` & Drawing Tools <!-- id: 13 -->
- [ ] Implement WebSocket Logic (Sync Annotations & Chat) <!-- id: 14 -->
- [ ] Implement Chat Sidebar & AI Integration <!-- id: 15 -->
- [ ] Integrate Discord SDK <!-- id: 16 -->
- [ ] Add `CatLoader` & Toast Notifications <!-- id: 17 -->

## Phase 5: Verification
- [ ] Verify PDF Rendering & Virtualization <!-- id: 18 -->
- [ ] Verify Annotation Tools & Sync <!-- id: 19 -->
- [ ] Verify Chat & AI <!-- id: 20 -->
- [ ] Verify Discord Integration <!-- id: 21 -->
- [ ] Final Polish (Dark Mode, Responsive) <!-- id: 22 -->
