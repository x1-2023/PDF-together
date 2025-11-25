import { VariableSizeList, VariableSizeListProps } from 'react-window';
import { forwardRef } from 'react';

// Re-export VariableSizeList as VirtualizedList for consistency
export const VirtualizedList = forwardRef<VariableSizeList, VariableSizeListProps>((props, ref) => {
    return <VariableSizeList ref={ref} {...props} />;
});

VirtualizedList.displayName = 'VirtualizedList';
