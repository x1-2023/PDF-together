import React from 'react';
import { UserProfile } from '../types';

interface DashboardProps {
    pdfs: Array<{ id: string; name: string; url: string; size?: number }>;
    onSelectPdf: (id: string) => void;
    onDeletePdf: (id: string) => void;
    onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    uploading: boolean;
    currentUser: UserProfile | null; // For greeting
}

export const Dashboard: React.FC<DashboardProps> = ({
    pdfs,
    onSelectPdf,
    onDeletePdf,
    onUpload,
    uploading,
    currentUser
}) => {
    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Study Room</h1>
                    <p className="subtitle">
                        {currentUser ? `Welcome back, ${currentUser.username}.` : 'Welcome to your quiet place.'}
                        <br />
                        Select a book to start studying together.
                    </p>
                </div>
                <div className="header-actions">
                    <label className={`upload-btn-large ${uploading ? 'disabled' : ''}`}>
                        {uploading ? (
                            <span>⏳ Uploading...</span>
                        ) : (
                            <>
                                <span className="icon">＋</span>
                                <span>Upload New Book</span>
                            </>
                        )}
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

            <div className="bookshelf-grid">
                {pdfs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📚</div>
                        <h3>Your bookshelf is empty</h3>
                        <p>Upload a PDF to get started.</p>
                    </div>
                ) : (
                    pdfs.map((pdf) => (
                        <div key={pdf.id} className="book-card" onClick={() => onSelectPdf(pdf.id)}>
                            <div className="book-cover">
                                <div className="book-spine"></div>
                                <div className="book-preview">
                                    <span className="pdf-icon">PDF</span>
                                </div>
                            </div>
                            <div className="book-info">
                                <h3 className="book-title" title={pdf.name}>{pdf.name}</h3>
                                <div className="book-meta">
                                    <span className="file-size">
                                        {pdf.size ? `${(pdf.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                                    </span>
                                    <button
                                        className="delete-btn-icon"
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
