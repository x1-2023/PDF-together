import React from 'react';
import { UserProfile } from '../types';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserProfile | null;
    theme: 'light' | 'dark';
    onThemeChange: (theme: 'light' | 'dark') => void;
    studyMode: boolean;
    onStudyModeChange: (enabled: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({
    isOpen,
    onClose,
    currentUser,
    theme,
    onThemeChange,
    studyMode,
    onStudyModeChange
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Settings</h2>
                    <button className="btn-ghost" onClick={onClose} style={{ border: 'none', fontSize: '1.5rem' }}>×</button>
                </div>

                <div className="modal-body">
                    {/* User Profile */}
                    <div style={{ marginBottom: '32px' }}>
                        <p className="section-label">User Profile</p>
                        <div className="user-row" style={{ background: '#F0F2F5', padding: '16px' }}>
                            <img
                                src={currentUser?.avatar ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png` : 'https://cdn.discordapp.com/embed/avatars/0.png'}
                                alt={currentUser?.username}
                                className="user-avatar"
                                style={{ width: '48px', height: '48px' }}
                            />
                            <div>
                                <div className="user-name" style={{ fontSize: '1.1rem' }}>{currentUser?.username}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>#{currentUser?.discriminator}</div>
                            </div>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div style={{ marginBottom: '32px' }}>
                        <p className="section-label">Appearance</p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <label style={{ fontWeight: 500 }}>Theme</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className={`btn-ghost ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => onThemeChange('light')}
                                    style={theme === 'light' ? { background: 'var(--bg-accent)', color: 'white', borderColor: 'var(--bg-accent)' } : {}}
                                >
                                    ☀️ Day
                                </button>
                                <button
                                    className={`btn-ghost ${theme === 'dark' ? 'active' : ''}`}
                                    disabled
                                    title="Coming soon"
                                >
                                    🌙 Night
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <label style={{ fontWeight: 500, display: 'block' }}>Study Mode</label>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hide distractions (Classmates)</span>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={studyMode}
                                    onChange={(e) => onStudyModeChange(e.target.checked)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    {/* About */}
                    <div>
                        <p className="section-label">About</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Discord PDF Together v1.0.0<br />
                            Designed for focused study sessions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
