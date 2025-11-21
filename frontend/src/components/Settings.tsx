import React from 'react';
import { UserProfile } from '../types';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: UserProfile | null;
    theme: 'light' | 'dark'; // Future proofing
    onThemeChange: (theme: 'light' | 'dark') => void;
}

export const Settings: React.FC<SettingsProps> = ({
    isOpen,
    onClose,
    currentUser,
    theme,
    onThemeChange
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Settings</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
            </div>
        </div>
                    </section >

                    <section className="settings-section">
                        <h3>Appearance</h3>
                        <div className="setting-item">
                            <label>Theme</label>
                            <div className="theme-toggle">
                                <button
                                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => onThemeChange('light')}
                                >
                                    ☀️ Day
                                </button>
                                <button
                                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => onThemeChange('dark')}
                                    disabled title="Coming soon"
                                >
                                    🌙 Night
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="settings-section">
                        <h3>About</h3>
                        <p className="version-info">Discord PDF Together v1.0.0</p>
                        <p className="credits">Designed for focused study sessions.</p>
                    </section>
                </div >
            </div >
        </div >
    );
};
