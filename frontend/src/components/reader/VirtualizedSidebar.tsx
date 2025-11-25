import React, { useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList as List } from 'react-window';
import { usePDFStore } from '@/store/usePDFStore';
import { VirtualizedList } from './VirtualizedList';
import { cn } from '@/lib/utils';

interface SidebarPageProps {
    index: number;
    style: React.CSSProperties;
    data: {
        currentPage: number;
        onPageClick: (page: number) => void;
    };
}

const SidebarPage = ({ index, style, data }: SidebarPageProps) => {
    const pageNumber = index + 1;
    const isActive = pageNumber === data.currentPage;

    return (
        <div style={style} className="px-4 py-2">
            <div
                onClick={() => data.onPageClick(pageNumber)}
                className={cn(
                    "relative rounded-lg overflow-hidden cursor-pointer transition-all border-2",
                    isActive
                        ? "border-primary shadow-warm-md ring-2 ring-primary/20"
                        : "border-transparent hover:border-primary/50 shadow-warm-sm"
                )}
            >
                <div className="aspect-[2/3] bg-white pointer-events-none">
                    {/* Low res thumbnail */}
                    <Page
                        pageNumber={pageNumber}
                        width={150}
                        renderAnnotationLayer={false}
                        renderTextLayer={false}
                        loading={<div className="w-full h-full bg-muted/20 animate-pulse" />}
                    />
                </div>
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded backdrop-blur-sm">
                    {pageNumber}
                </div>
            </div>
        </div>
    );
};

export const VirtualizedSidebar = () => {
    const { pdfUrl, numPages, currentPage, setCurrentPage } = usePDFStore();
    const listRef = useRef<List>(null);

    // Scroll to active page when it changes (e.g. from main canvas scroll)
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(currentPage - 1, 'center');
        }
    }, [currentPage]);

    const handlePageClick = (page: number) => {
        setCurrentPage(page);
        // Note: We also need to scroll the main canvas. 
        // The main canvas should listen to currentPage changes and scroll itself.
        // Or we can expose a scrollTo method. 
        // For now, let's assume bidirectional sync via store is enough, 
        // but we might need to add a 'scrollToPage' action to the store that triggers a side effect.
    };

    return (
        <div className="h-full w-full bg-card border-r border-border">
            <div className="p-3 border-b border-border">
                <h3 className="font-heading font-bold text-sm">Trang ({numPages})</h3>
            </div>
            <div className="h-[calc(100%-3rem)]">
                {pdfUrl ? (
                    <Document file={pdfUrl} className="h-full">
                        <AutoSizer>
                            {({ height, width }) => (
                                <VirtualizedList
                                    ref={listRef}
                                    height={height}
                                    width={width}
                                    itemCount={numPages}
                                    itemSize={() => (width - 32) * 1.414 + 16} // Estimate height based on width
                                    itemData={{ currentPage, onPageClick: handlePageClick }}
                                    overscanCount={3}
                                >
                                    {SidebarPage}
                                </VirtualizedList>
                            )}
                        </AutoSizer>
                    </Document>
                ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                        Chưa có tài liệu
                    </div>
                )}
            </div>
        </div>
    );
};
