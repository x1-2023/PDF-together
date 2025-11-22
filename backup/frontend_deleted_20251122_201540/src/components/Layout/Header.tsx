import React from 'react';
import { Button } from '../UI/Button';
import { Icons } from '../UI/Icons';
import { UserProfile } from '../../types';

interface HeaderProps {
    title: string;
    action?: React.ReactNode;
    user?: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({ title, action, user }) => {
    return (
        <header className="h-24 px-8 flex items-center justify-between bg-transparent">
            <h2 className="text-4xl font-display text-[var(--color-text-dark)]">{title}</h2>
            <div className="flex items-center gap-4">
                {action}
                <Button variant="ghost" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                    <Icons.Bell className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-[var(--color-text-dark)]">{user?.username || 'Guest'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[var(--color-gray-200)] overflow-hidden border-2 border-white shadow-sm">
                        {user?.avatar ? (
                            <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} alt="User" className="w-full h-full object-cover" />
                        ) : (
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}`} alt="User" className="w-full h-full object-cover" />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};
