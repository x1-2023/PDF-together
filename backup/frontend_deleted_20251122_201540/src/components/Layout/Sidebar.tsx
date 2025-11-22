import React from 'react';
import { Icons } from '../UI/Icons';

interface SidebarProps {
    activeTab: 'bookshelf' | 'classmates' | 'settings';
    onTabChange: (tab: 'bookshelf' | 'classmates' | 'settings') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
    const menuItems = [
        { id: 'bookshelf', label: 'Bookshelf', icon: Icons.Bookshelf },
        { id: 'classmates', label: 'Classmates', icon: Icons.Users },
        { id: 'settings', label: 'Settings', icon: Icons.Settings },
    ] as const;

    return (
        <div className="w-64 h-full bg-[var(--color-bg-cream)] border-r border-[var(--color-gray-200)] flex flex-col p-6 flex-shrink-0">
            <div className="mb-10 pl-2">
                <h1 className="text-2xl font-bold text-[var(--color-accent-orange)] font-display">Study Focus</h1>
            </div>

            <nav className="flex flex-col gap-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] transition-all duration-200 text-left
                ${isActive
                                    ? 'bg-[var(--color-accent-orange)] text-white shadow-md'
                                    : 'text-[var(--color-text-dark)] hover:bg-[var(--color-gray-100)]'}
              `}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[var(--color-text-light)]'}`} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="mt-auto pt-6 border-t border-[var(--color-gray-200)]">
                {/* User info or other footer items can go here */}
            </div>
        </div>
    );
};
