import { create } from 'zustand';
import { Annotation } from '@/types';

interface PDFState {
    pdfUrl: string | null;
    numPages: number;
    currentPage: number;
    scale: number;
    rotation: number;
    annotations: Annotation[];

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
}

export const usePDFStore = create<PDFState>((set) => ({
    pdfUrl: null,
    numPages: 0,
    currentPage: 1,
    scale: 1.0,
    rotation: 0,
    annotations: [],

    setPdfUrl: (url) => set({ pdfUrl: url }),
    setNumPages: (num) => set({ numPages: num }),
    setCurrentPage: (page) => set({ currentPage: page }),
    setScale: (scale) => set({ scale }),
    setRotation: (rotation) => set({ rotation }),
    zoomIn: () => set((state) => ({ scale: Math.min(state.scale + 0.1, 3.0) })),
    zoomOut: () => set((state) => ({ scale: Math.max(state.scale - 0.1, 0.5) })),

    addAnnotation: (annotation) => set((state) => ({ annotations: [...state.annotations, annotation] })),
    removeAnnotation: (id) => set((state) => ({ annotations: state.annotations.filter(a => a.id !== id) })),
    updateAnnotation: (annotation) => set((state) => ({
        annotations: state.annotations.map(a => a.id === annotation.id ? annotation : a)
    })),
    setAnnotations: (annotations) => set({ annotations }),
}));
