import React from 'react';
import { Button } from '../UI/Button';
import { Icons } from '../UI/Icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-[var(--color-bg-cream)] w-[480px] rounded-[var(--radius-lg)] shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden animate-in fade-in zoom-in duration-200 m-4">
                <div className="p-6 border-b border-[var(--color-gray-200)] flex items-center justify-between">
                    <h2 className="text-2xl font-display font-bold text-[var(--color-text-dark)]">Settings</h2>
                    <Button variant="ghost" onClick={onClose} className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
                        <Icons.X />
                    </Button>
                </div>

                <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Profile Section */}
                    <div>
                        <h3 className="text-sm font-bold text-[var(--color-text-light)] uppercase tracking-wider mb-4">Profile Settings</h3>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-[var(--color-gray-200)] overflow-hidden border-2 border-white shadow-sm relative group cursor-pointer">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'Guest'}`} alt="User" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icons.Pencil className="text-white w-5 h-5" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-medium text-[var(--color-text-light)] mb-1 block">Display Name</label>
                                <input
                                    type="text"
                                    defaultValue={user?.username || 'Guest'}
                                    className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-gray-200)] bg-white text-[var(--color-text-dark)] focus:ring-2 focus:ring-[var(--color-accent-orange)] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div>
                        <h3 className="text-sm font-bold text-[var(--color-text-light)] uppercase tracking-wider mb-4">Appearance</h3>
                        <div className="flex items-center justify-between py-2">
                            <span className="text-[var(--color-text-dark)] font-medium">Night Study Mode 🌙</span>
                            <div className="w-12 h-6 bg-[var(--color-gray-200)] rounded-full relative cursor-pointer transition-colors">
                                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 shadow-sm transition-transform" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-[var(--color-text-dark)] font-medium block mb-2">Font Size</span>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-serif">A</span>
                                <input type="range" className="flex-1 accent-[var(--color-accent-orange)]" />
                                <span className="text-xl font-serif">A+</span>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div>
                        <h3 className="text-sm font-bold text-[var(--color-text-light)] uppercase tracking-wider mb-4">Notifications</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--color-text-dark)]">Classmate joined</span>
                                <div className="w-12 h-6 bg-[var(--color-accent-orange)] rounded-full relative cursor-pointer">
                                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--color-text-dark)]">New annotation</span>
                                <div className="w-12 h-6 bg-[var(--color-accent-orange)] rounded-full relative cursor-pointer">
                                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[var(--color-gray-50)] border-t border-[var(--color-gray-200)]">
                    <p className="text-xs text-[var(--color-text-light)]">Version 1.2.4 • Study Focus</p>
                </div>
            </div>
        </div>
    );
};
