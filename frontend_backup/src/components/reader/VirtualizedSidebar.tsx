import React, { useCallback } from 'react';
import { Document, Page } from 'react-pdf';
import { VariableSizeList } from 'react-window/dist/react-window.cjs';

const List = VariableSizeList;

interface VirtualizedSidebarProps {
    pdfUrl: string;
    numPages: number;
    activePage: number;
    sidebarView: 'list' | 'thumbnail';
    onPageClick: (pageNumber: number) => void;
}

export const VirtualizedSidebar: React.FC<VirtualizedSidebarProps> = ({
    pdfUrl,
    numPages,
    activePage,
    sidebarView,
    onPageClick,
}) => {
    // Height for each item
    const getItemSize = useCallback(() => {
        return sidebarView === 'list' ? 40 : 160; // List mode: 40px, Thumbnail mode: 160px
    }, [sidebarView]);

    // Row renderer
    const Row = useCallback(({ index, style }: any) => {
        const pageNumber = index + 1;
        const isActive = activePage === pageNumber;

        return (
            <div
                style={style}
                onClick={() => onPageClick(pageNumber)}
                className={`relative group cursor-pointer transition-all duration-200 p-2 mx-4 rounded-lg border-2 ${isActive ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-black/5'
                    }`}
            >
                {sidebarView === 'list' ? (
                    <span className="text-sm font-bold text-text-muted">Page {pageNumber}</span>
                ) : (
                    <div className="w-full bg-white overflow-hidden relative pointer-events-none rounded-sm">
                        <Document file={pdfUrl} className="w-full">
                            <Page
                                pageNumber={pageNumber}
                                width={120}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="origin-top-left"
                            />
                        </Document>
                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded z-10">
                            {pageNumber}
                        </div>
                    </div>
                )}
            </div>
        );
    }, [pdfUrl, activePage, sidebarView, onPageClick]);

    return (
        <div className="flex-1 overflow-hidden">
            <List
                height={window.innerHeight - 100} // Adjust for header
                width="100%"
                itemCount={numPages}
                itemSize={getItemSize}
                overscanCount={3}
            >
                {Row}
            </List>
        </div>
    );
};
