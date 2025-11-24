const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface PDFFile {
    id: string;
    title: string;
    author: string;
    cover: string | null;
    description: string;
    url: string;
    size: number;
    uploadedAt: string;
}

export const api = {
    fetchSessions: async (): Promise<PDFFile[]> => {
        const res = await fetch(`${API_URL}/api/pdfs`);
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

    // Helper to get full URL for assets
    getAssetUrl: (path: string) => {
        if (path.startsWith('http')) return path;
        return `${API_URL}${path}`;
    }
};
