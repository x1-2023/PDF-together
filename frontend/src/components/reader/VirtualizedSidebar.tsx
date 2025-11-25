import React, { useRef, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { usePDFStore } from '@/store/usePDFStore';
import { cn } from '@/lib/utils';

export const VirtualizedSidebar: React.FC = () => {
    const { numPages, currentPage, setCurrentPage } = usePDFStore();
    const virtuosoRef = useRef<any>(null);

    useEffect(() => {
        if (virtuosoRef.current && currentPage > 0) {
            virtuosoRef.current.scrollToIndex({
                index: currentPage - 1,
                align: 'center',
                behavior: 'smooth'
            });
        }
    }, [currentPage]);

    const handlePageClick = (pageNum: number) => {
        setCurrentPage(pageNum);
    };

    if (numPages === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-xs text-muted-foreground">No pages</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-background">
            <Virtuoso
                ref={virtuosoRef}
                style={{ height: '100%' }}
                totalCount={numPages}
                itemContent={(index) => {
                    const pageNum = index + 1;
                    const isActive = pageNum === currentPage;

                    return (
                        <div
                            className={cn(
                                "p-2 cursor-pointer transition-all border-l-4",
                                isActive
                                    ? "bg-primary/10 border-primary"
                                    : "border-transparent hover:bg-muted"
                            )}
                            onClick={() => handlePageClick(pageNum)}
                        >
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "w-8 h-8 rounded flex items-center justify-center text-xs font-medium",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {pageNum}
                                </div>
                                <span className={cn(
                                    "text-sm",
                                    isActive ? "font-semibold text-foreground" : "text-muted-foreground"
                                )}>
                                    Page {pageNum}
                                </span>
                            </div>
                        </div>
                    );
                }}
                overscan={10}
            />
        </div>
    );
};
