import React, { useRef } from 'react';
import { Document } from 'react-pdf';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import { usePDFStore } from '@/store/usePDFStore';
import { VirtualizedList } from './VirtualizedList';
import { PDFPage } from './PDFPage';
import '@/lib/pdf-setup'; // Import worker setup

interface VirtualizedPDFCanvasProps {
    file: string | File | null;
}

export const VirtualizedPDFCanvas: React.FC<VirtualizedPDFCanvasProps> = ({ file }) => {
    const { setNumPages, numPages, scale, setCurrentPage } = usePDFStore();
    const listRef = useRef<List>(null);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    // Estimate page height based on width (assuming A4 ratio approx 1.414)
    // In a real app, we might want to get exact page sizes, but for now this is a good approximation
    const getItemSize = (width: number) => {
        const pageWidth = width * 0.9;
        const pageHeight = pageWidth * 1.414;
        return (pageHeight * scale) + 48; // +48 for padding
    };

    // Sync scroll to current page
    const onItemsRendered = ({ visibleStartIndex }: { visibleStartIndex: number }) => {
        setCurrentPage(visibleStartIndex + 1);
    };

    return (
        <div className="h-full w-full bg-muted/20">
            {file ? (
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    }
                    error={
                        <div className="flex items-center justify-center h-full text-red-500">
                            Failed to load PDF
                        </div>
                    }
                    className="h-full"
                >
                    <AutoSizer>
                        {({ height, width }) => (
                            <VirtualizedList
                                ref={listRef}
                                height={height}
                                width={width}
                                itemCount={numPages}
                                itemSize={() => getItemSize(width)}
                                itemData={{ width, scale }}
                                overscanCount={2}
                                onItemsRendered={onItemsRendered}
                            >
                                {PDFPage}
                            </VirtualizedList>
                        )}
                    </AutoSizer>
                </Document>
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    No PDF selected
                </div>
            )}
        </div>
    );
};
