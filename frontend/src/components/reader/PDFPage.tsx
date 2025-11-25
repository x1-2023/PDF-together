import React from 'react';
import { Page } from 'react-pdf';
import { Skeleton } from '@/components/ui/skeleton';

interface PDFPageProps {
    pageNumber: number;
    scale: number;
    userId?: string;
}

export const PDFPage: React.FC<PDFPageProps> = React.memo(({ pageNumber, scale, userId }) => {
    const [isLoading, setIsLoading] = React.useState(true);

    return (
        <div className="relative">
            {isLoading && (
                <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <Page
                pageNumber={pageNumber}
                scale={scale}
                onLoadSuccess={() => setIsLoading(false)}
                onLoadError={(error) => {
                    console.error(`Error loading page ${pageNumber}:`, error);
                    setIsLoading(false);
                }}
                renderTextLayer={true}
                renderAnnotationLayer={true}
            />
            {/* Page number indicator */}
            <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-muted-foreground">
                Page {pageNumber}
            </div>
        </div>
    );
});

PDFPage.displayName = 'PDFPage';
