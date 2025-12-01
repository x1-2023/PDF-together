import { create } from 'zustand';
import { api, Note } from '@/api';

interface NotesState {
    notes: Note[];
    addNote: (note: Omit<Note, 'id'>) => Promise<void>;
    removeNote: (id: string) => Promise<void>;
    updateNoteText: (id: string, text: string) => Promise<void>;
    syncNotes: (pdfId: string) => Promise<void>;
    getNotesByPdf: (pdfId: string) => Note[];
}

export const useNotesStore = create<NotesState>((set, get) => ({
    notes: [],

    addNote: async (noteData) => {
        try {
            const created = await api.createNote(noteData);
            set((state) => ({
                notes: [...state.notes, created]
            }));
        } catch (error) {
            console.error('Failed to add note:', error);
            throw error;
        }
    },

    removeNote: async (id) => {
        try {
            await api.deleteNote(id);
            set((state) => ({
                notes: state.notes.filter(n => n.id !== id)
            }));
        } catch (error) {
            console.error('Failed to delete note:', error);
            throw error;
        }
    },

    updateNoteText: async (id, text) => {
        try {
            await api.updateNote(id, text);
            set((state) => ({
                notes: state.notes.map(n =>
                    n.id === id ? { ...n, text } : n
                )
            }));
        } catch (error) {
            console.error('Failed to update note:', error);
            throw error;
        }
    },

    syncNotes: async (pdfId) => {
        try {
            const notes = await api.fetchNotes(pdfId);
            set({ notes });
        } catch (error) {
            console.error('Failed to sync notes:', error);
        }
    },

    getNotesByPdf: (pdfId) => {
        return get().notes.filter(n => n.pdfId === pdfId);
    }
}));
