import React, { memo } from 'react';
import { Page } from 'react-pdf';
import { usePDFStore } from '@/store/usePDFStore';
import { Skeleton } from '@/components/ui/skeleton';

interface PDFPageProps {
    index: number;
    style: React.CSSProperties;
    data: {
        width: number;
        scale: number;
    };
}

export const PDFPage = memo(({ index, style, data }: PDFPageProps) => {
    const pageNumber = index + 1;
    const { scale } = usePDFStore();

    // Adjust style to account for padding/margins if needed
    // The style prop comes from react-window and positions the item absolutely

    return (
        <div style={style} className="flex justify-center p-4">
            <div className="relative bg-white shadow-warm-lg rounded-lg overflow-hidden transition-transform duration-200 ease-out">
                <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    width={data.width * 0.9} // 90% of container width to leave room for padding
                    loading={
                        <div className="w-full h-full flex items-center justify-center bg-muted/20">
                            <Skeleton className="w-full h-full" />
                        </div>
                    }
                    renderAnnotationLayer={false} // We will implement our own annotation layer later
                    renderTextLayer={true}
                    className="max-w-full"
                />

                {/* Page Number Indicator */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded backdrop-blur-sm">
                    {pageNumber}
                </div>
            </div>
        </div>
    );
});

PDFPage.displayName = 'PDFPage';
