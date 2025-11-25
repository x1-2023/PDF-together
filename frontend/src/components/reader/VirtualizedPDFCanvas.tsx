import React, { useRef, useEffect } from 'react';
import { Document } from 'react-pdf';
import { Virtuoso } from 'react-virtuoso';
import { usePDFStore } from '@/store/usePDFStore';
import { PDFPage } from './PDFPage';

import { Annotation } from '@/types';

interface VirtualizedPDFCanvasProps {
    userId?: string;
    onAnnotationCreate?: (annotation: Annotation) => void;
}

export const VirtualizedPDFCanvas: React.FC<VirtualizedPDFCanvasProps> = ({ userId, onAnnotationCreate }) => {
    const { pdfUrl, numPages, setNumPages, setCurrentPage, scale, zoomIn, zoomOut, setScale } = usePDFStore();
    const virtuosoRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        console.log(`PDF loaded: ${numPages} pages`);
    };

    const handleDocumentLoadError = (error: Error) => {
        console.error('Error loading PDF:', error);
    };

    // Handle Ctrl+Scroll zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            // Only handle if Ctrl is pressed
            if (e.ctrlKey) {
                e.preventDefault(); // Prevent browser zoom

                // Zoom in/out based on scroll direction
                if (e.deltaY < 0) {
                    zoomIn();
                } else {
                    zoomOut();
                }
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [zoomIn, zoomOut]);

    if (!pdfUrl) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No PDF loaded</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="h-full w-full bg-muted/30 select-none"
            style={{ position: 'relative', userSelect: 'none' }}
        >
            <Document
                file={pdfUrl}
                onLoadSuccess={handleDocumentLoadSuccess}
                onLoadError={handleDocumentLoadError}
                loading={
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                }
            >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    {numPages > 0 ? (
                        <Virtuoso
                            ref={virtuosoRef}
                            style={{ height: '100%', width: '100%' }}
                            totalCount={numPages}
                            itemContent={(index) => (
                                <div className="flex justify-center py-4">
                                    <PDFPage
                                        pageNumber={index + 1}
                                        scale={scale}
                                        userId={userId}
                                        onAnnotationCreate={onAnnotationCreate}
                                    />
                                </div>
                            )}
                            rangeChanged={(range) => {
                                if (range.startIndex >= 0) {
                                    setCurrentPage(range.startIndex + 1);
                                }
                            }}
                            overscan={5}
                            increaseViewportBy={{ top: 1500, bottom: 1500 }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    )}
                </div>
            </Document>
        </div>
    );
};
