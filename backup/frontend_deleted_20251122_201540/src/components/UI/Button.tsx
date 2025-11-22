import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    icon,
    className = '',
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-[var(--color-accent-orange)] text-white hover:bg-[var(--color-accent-orange-hover)] shadow-sm hover:shadow-md',
        secondary: 'bg-[var(--color-white)] text-[var(--color-text-dark)] border border-[var(--color-gray-200)] hover:bg-[var(--color-gray-50)] shadow-sm',
        ghost: 'bg-transparent text-[var(--color-text-light)] hover:text-[var(--color-text-dark)] hover:bg-[var(--color-gray-100)]',
        danger: 'bg-red-50 text-red-600 hover:bg-red-100',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-5 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {icon && <span className="w-5 h-5">{icon}</span>}
            {children}
        </button>
    );
};
