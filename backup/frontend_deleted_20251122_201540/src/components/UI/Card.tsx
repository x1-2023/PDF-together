import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    onClick,
    hoverable = false,
}) => {
    return (
        <div
            onClick={onClick}
            className={`
        bg-[var(--color-white)] rounded-[var(--radius-lg)] border border-[var(--color-gray-100)]
        shadow-[0_2px_8px_var(--color-shadow)]
        ${hoverable ? 'hover:shadow-[0_8px_16px_var(--color-shadow-hover)] hover:-translate-y-1 cursor-pointer' : ''}
        transition-all duration-300
        ${className}
      `}
        >
            {children}
        </div>
    );
};
