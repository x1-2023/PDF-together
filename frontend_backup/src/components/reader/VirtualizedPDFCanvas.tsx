import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Page } from 'react-pdf';
import { VariableSizeList } from 'react-window/dist/react-window.cjs';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Annotation } from '../../types';
import { AnnotationLayer } from '../reader/AnnotationLayer';

const List = VariableSizeList;

interface VirtualizedPDFCanvasProps {
    pdfUrl: string;
    numPages: number;
    scale: number;
    annotations: Annotation[];
    activeTool: any;
    activeColor: string;
    onAnnotationAdd: (annotation: Annotation) => void;
    onAnnotationRemove: (id: string) => void;
    onPageChange?: (pageNumber: number) => void;
    userId: string;
}

export const VirtualizedPDFCanvas: React.FC<VirtualizedPDFCanvasProps> = ({
    pdfUrl,
    numPages,
    scale,
    annotations,
    activeTool,
    activeColor,
    onAnnotationAdd,
    onAnnotationRemove,
    onPageChange,
    userId,
}) => {
    const listRef = useRef<any>(null);
    const [pageHeights, setPageHeights] = useState<Record<number, number>>({});
    const [currentPage, setCurrentPage] = useState(1);

    // Reset list cache when scale changes
    useEffect(() => {
        if (listRef.current) {
            listRef.current.resetAfterIndex(0);
        }
    }, [scale, pageHeights]);

    // Get page height for virtualization
    const getPageHeight = useCallback((index: number) => {
        const pageNum = index + 1;
        const baseHeight = pageHeights[pageNum] || 842; // A4 default height
        return baseHeight * scale + 48; // +48 for margin
    }, [pageHeights, scale]);

    // Handle page render success to capture actual height
    const handlePageLoadSuccess = useCallback((pageNum: number, page: any) => {
        const viewport = page.getViewport({ scale: 1.0 });
        setPageHeights(prev => ({
            ...prev,
            [pageNum]: viewport.height,
        }));
    }, []);

    // Track visible page for scroll sync
    const handleItemsRendered = useCallback(({ visibleStartIndex }: any) => {
        const newPage = visibleStartIndex + 1;
        if (newPage !== currentPage) {
            setCurrentPage(newPage);
            onPageChange?.(newPage);
        }
    }, [currentPage, onPageChange]);

    // Row renderer for each PDF page
    const Row = useCallback(({ index, style }: any) => {
        const pageNumber = index + 1;
        const pageAnnotations = annotations.filter(a => a.page === pageNumber);

        return (
            <div
                style={{
                    ...style,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    padding: '24px 0',
                }}
            >
                <div className="relative shadow-lg bg-white">
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onLoadSuccess={(page) => handlePageLoadSuccess(pageNumber, page)}
                        className="shadow-lg"
                    />

                    {/* Annotation Layer */}
                    <div className="absolute inset-0">
                        <AnnotationLayer
                            pageNumber={pageNumber}
                            annotations={pageAnnotations}
                            activeTool={activeTool}
                            activeColor={activeColor}
                            onAnnotationAdd={onAnnotationAdd}
                            onAnnotationRemove={onAnnotationRemove}
                            scale={scale}
                            userId={userId}
                        />
                    </div>
                </div>
            </div>
        );
    }, [annotations, scale, activeTool, activeColor, onAnnotationAdd, onAnnotationRemove, handlePageLoadSuccess, userId]);

    return (
        <AutoSizer>
            {({ height, width }) => (
                <List
                    ref={listRef}
                    height={height}
                    width={width}
                    itemCount={numPages}
                    itemSize={getPageHeight}
                    onItemsRendered={handleItemsRendered}
                    overscanCount={2} // Render 2 extra pages above/below for smooth scrolling
                >
                    {Row}
                </List>
            )}
        </AutoSizer>
    );
};
