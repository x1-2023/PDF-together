const API_URL = import.meta.env.VITE_API_URL || '';

export interface PDFFile {
    id: string;
    title: string;
    author: string;
    cover: string | null;
    description: string;
    url: string;
    size: number;
    uploadedAt: string;
    progress?: {
        page: number;
        total: number;
        percentage: number;
        updatedAt: number;
    } | null;
}

export interface Note {
    id: string;
    pdfId: string;
    page: number;
    text: string;
    userId: string;
    timestamp: number;
}

export const api = {
    fetchSessions: async (userId?: string): Promise<PDFFile[]> => {
        const query = userId ? `?userId=${userId}` : '';
        const res = await fetch(`${API_URL}/api/pdfs${query}`);
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const data = await res.json();
        return data.pdfs;
    },

    uploadSession: async (file: File, metadata?: { title?: string; author?: string }): Promise<PDFFile> => {
        const formData = new FormData();
        formData.append('file', file);
        if (metadata?.title) formData.append('title', metadata.title);
        if (metadata?.author) formData.append('author', metadata.author);

        const res = await fetch(`${API_URL}/api/upload-pdf`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error('Failed to upload session');
        return await res.json();
    },

    deleteSession: async (id: string): Promise<void> => {
        const res = await fetch(`${API_URL}/api/pdfs/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete session');
    },

    getAssetUrl: (path: string) => {
        if (path.startsWith('http')) return path;
        return `${API_URL}${path}`;
    },

    // --- Notes API ---
    fetchNotes: async (pdfId: string): Promise<Note[]> => {
        const res = await fetch(`${API_URL}/api/notes/${pdfId}`);
        if (!res.ok) throw new Error('Failed to fetch notes');
        const data = await res.json();
        return data.notes;
    },

    createNote: async (note: Omit<Note, 'id'>): Promise<Note> => {
        const res = await fetch(`${API_URL}/api/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(note),
        });
        if (!res.ok) throw new Error('Failed to create note');
        const data = await res.json();
        return data.note;
    },

    deleteNote: async (id: string): Promise<void> => {
        const res = await fetch(`${API_URL}/api/notes/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete note');
    },

    updateNote: async (id: string, text: string): Promise<void> => {
        const res = await fetch(`${API_URL}/api/notes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error('Failed to update note');
    }
};
