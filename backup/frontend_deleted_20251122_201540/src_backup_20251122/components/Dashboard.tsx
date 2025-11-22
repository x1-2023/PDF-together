import React from 'react';
import { UserProfile } from '../types';

interface DashboardProps {
    pdfs: Array<{ id: string; name: string; url: string; size?: number }>;
    onSelectPdf: (id: string) => void;
    onDeletePdf: (id: string) => void;
    onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    uploading: boolean;
    currentUser: UserProfile | null;
    onOpenSettings: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    pdfs,
    onSelectPdf,
    onDeletePdf,
    onUpload,
    uploading,
    currentUser,
    onOpenSettings
}) => {
    return (
        <div className="dashboard-view">
            <header className="dashboard-header">
                <div className="dashboard-title">
                    <h1>Study Room</h1>
                    <p>
                        {currentUser ? `Welcome back, ${currentUser.username}.` : 'Welcome to your quiet place.'}
                        <br />
                        Select a book to start studying together.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <button className="btn-ghost" onClick={onOpenSettings} title="Settings">
                        ⚙️ Settings
                    </button>
                    <label className={`btn-primary ${uploading ? 'disabled' : ''}`}>
                        {uploading ? '⏳ Uploading...' : '＋ Upload New Book'}
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={onUpload}
                            disabled={uploading}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </header>

            <div className="books-grid">
                {pdfs.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📚</div>
                        <h3>Your bookshelf is empty</h3>
                        <p>Upload a PDF to get started.</p>
                    </div>
                ) : (
                    pdfs.map((pdf) => (
                        <div key={pdf.id} className="book-card" onClick={() => onSelectPdf(pdf.id)}>
                            <div className="book-preview">
                                <span className="icon">📄</span>
                            </div>
                            <div className="book-details">
                                <h3 className="book-title" title={pdf.name}>{pdf.name}</h3>
                                <div className="book-meta">
                                    <span>{pdf.size ? `${(pdf.size / 1024 / 1024).toFixed(1)} MB` : 'PDF'}</span>
                                    <button
                                        className="btn-ghost"
                                        style={{ padding: '4px 8px', fontSize: '0.8rem', color: '#e74c3c', borderColor: 'transparent' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeletePdf(pdf.id);
                                        }}
                                        title="Delete Book"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
