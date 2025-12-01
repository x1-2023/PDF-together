import { create } from 'zustand';
import { Annotation } from '@/types';

interface PDFState {
    pdfUrl: string | null;
    numPages: number;
    currentPage: number;
    scale: number;
    rotation: number;
    annotations: Annotation[];

    // History for Undo/Redo
    history: Annotation[][];
    future: Annotation[][];

    setPdfUrl: (url: string | null) => void;
    setNumPages: (num: number) => void;
    setCurrentPage: (page: number) => void;
    setScale: (scale: number) => void;
    setRotation: (rotation: number) => void;
    zoomIn: () => void;
    zoomOut: () => void;

    addAnnotation: (annotation: Annotation) => void;
    removeAnnotation: (id: string) => void;
    updateAnnotation: (annotation: Annotation) => void;
    setAnnotations: (annotations: Annotation[]) => void;

    undo: () => void;
    redo: () => void;
}

export const usePDFStore = create<PDFState>((set, get) => ({
    pdfUrl: null,
    numPages: 0,
    currentPage: 1,
    scale: 1.0,
    rotation: 0,
    annotations: [],
    history: [],
    future: [],

    setPdfUrl: (url) => set({ pdfUrl: url }),
    setNumPages: (num) => set({ numPages: num }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setScale: (scale) => set({ scale }),
    setRotation: (rotation) => set({ rotation }),
    zoomIn: () => set((state) => ({ scale: Math.min(state.scale + 0.1, 3.0) })),
    zoomOut: () => set((state) => ({ scale: Math.max(state.scale - 0.1, 0.5) })),

    addAnnotation: (annotation) => set((state) => ({
        history: [...state.history, state.annotations],
        future: [],
        annotations: [...state.annotations, annotation]
    })),

    removeAnnotation: (id) => set((state) => ({
        history: [...state.history, state.annotations],
        future: [],
        annotations: state.annotations.filter(a => a.id !== id)
    })),

    updateAnnotation: (annotation) => set((state) => ({
        history: [...state.history, state.annotations],
        future: [],
        annotations: state.annotations.map(a => a.id === annotation.id ? annotation : a)
    })),

    setAnnotations: (annotations) => set({ annotations }),

    undo: () => set((state) => {
        if (state.history.length === 0) return {};
        const previous = state.history[state.history.length - 1];
        const newHistory = state.history.slice(0, -1);
        return {
            history: newHistory,
            future: [state.annotations, ...state.future],
            annotations: previous
        };
    }),

    redo: () => set((state) => {
        if (state.future.length === 0) return {};
        const next = state.future[0];
        const newFuture = state.future.slice(1);
        return {
            history: [...state.history, state.annotations],
            future: newFuture,
            annotations: next
        };
    }),
}));
