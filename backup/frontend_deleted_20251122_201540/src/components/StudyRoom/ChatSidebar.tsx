import React from 'react';
import { Card } from '../UI/Card';

export const ChatSidebar: React.FC = () => {
    return (
        <Card className="w-80 h-full flex flex-col bg-white border-l border-[var(--color-gray-200)] rounded-none shadow-none">
            <div className="p-6 border-b border-[var(--color-gray-100)]">
                <h3 className="font-bold text-[var(--color-text-dark)] font-display text-lg">Notes & Collaboration</h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Mock Data */}
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full rounded-full" />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-sm text-[var(--color-text-dark)]">Inter</span>
                            <span className="text-xs text-[var(--color-text-light)]">8 hours ago</span>
                        </div>
                        <p className="text-sm text-[var(--color-text-dark)] leading-relaxed">
                            Learnow out inain 😋
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex-shrink-0">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="User" className="w-full h-full rounded-full" />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-bold text-sm text-[var(--color-text-dark)]">User</span>
                            <span className="text-xs text-[var(--color-text-light)]">10m</span>
                        </div>
                        <p className="text-sm text-[var(--color-text-dark)] leading-relaxed">
                            Natnorit: our custems in the PDF. This leamms and the test from more evisents.
                        </p>
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-[var(--color-gray-100)] bg-[var(--color-gray-50)]">
                <input
                    type="text"
                    placeholder="Type a message..."
                    className="w-full bg-white border border-[var(--color-gray-200)] rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-accent-orange)] focus:border-[var(--color-accent-orange)] transition-all outline-none"
                />
            </div>
        </Card>
    );
};
