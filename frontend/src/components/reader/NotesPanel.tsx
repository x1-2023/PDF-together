import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StickyNote } from "lucide-react";
import { useNotesStore } from "@/store/useNotesStore";
import { Note } from "@/api";
import { formatRelativeTime } from "@/lib/time-utils";
import { Textarea } from "@/components/ui/textarea";

interface NotesPanelProps {
    pdfId: string;
    currentPage: number;
    onNavigateToPage: (page: number) => void;
    userId: string;
}

const mockUsers = [
    { id: "1", name: "Bạn", color: "bg-primary" },
    { id: "2", name: "Minh", color: "bg-secondary" },
    { id: "3", name: "Hương", color: "bg-accent" },
];

export const NotesPanel = ({ pdfId, currentPage, onNavigateToPage, userId }: NotesPanelProps) => {
    const { getNotesByPdf, addNote, syncNotes } = useNotesStore();
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [noteText, setNoteText] = useState("");

    const pdfNotes = getNotesByPdf(pdfId);

    // Sync notes from backend on mount
    useEffect(() => {
        syncNotes(pdfId);
    }, [pdfId, syncNotes]);

    const handleAddNote = async () => {
        if (!noteText.trim()) return;

        try {
            await addNote({
                pdfId,
                page: currentPage,
                text: noteText.trim(),
                userId,
                timestamp: Date.now(),
            });
            setNoteText("");
            setIsAddingNote(false);
        } catch (error) {
            console.error('Failed to add note:', error);
            // TODO: Show error toast
        }
    };

    // Group notes by page
    const notesByPage = pdfNotes.reduce((acc, note) => {
        if (!acc[note.page]) acc[note.page] = [];
        acc[note.page].push(note);
        return acc;
    }, {} as Record<number, Note[]>);

    const sortedPages = Object.keys(notesByPage)
        .map(Number)
        .sort((a, b) => a - b);

    return (
        <div className="h-full flex flex-col">
            <div className="p-2 border-b border-border bg-muted/10">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Ghi chú
                </h3>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                    {/* Add Note Button/Form */}
                    {!isAddingNote ? (
                        <Button
                            className="w-full h-10 rounded-full bg-gradient-to-r from-primary-light to-primary hover:shadow-warm-md"
                            onClick={() => setIsAddingNote(true)}
                        >
                            <StickyNote className="w-4 h-4 mr-2" />
                            Thêm ghi chú
                        </Button>
                    ) : (
                        <div className="space-y-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
                            <Textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder={`Ghi chú cho trang ${currentPage}...`}
                                className="min-h-[80px] resize-none"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    onClick={handleAddNote}
                                    disabled={!noteText.trim()}
                                    className="flex-1"
                                >
                                    Lưu
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setIsAddingNote(false);
                                        setNoteText("");
                                    }}
                                    className="flex-1"
                                >
                                    Hủy
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Notes List */}
                    {pdfNotes.length === 0 ? (
                        <div className="text-center py-8">
                            <StickyNote className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                            <p className="text-sm text-muted-foreground">Chưa có ghi chú nào</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                Nhấn "Thêm ghi chú" để tạo ghi chú mới
                            </p>
                        </div>
                    ) : (
                        sortedPages.map((page) => (
                            <div key={page} className="space-y-2">
                                {/* Page Header */}
                                <div className="flex items-center gap-2 px-2">
                                    <div className="h-px flex-1 bg-border" />
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        Trang {page}
                                    </span>
                                    <div className="h-px flex-1 bg-border" />
                                </div>

                                {/* Notes for this page */}
                                {notesByPage[page]
                                    .sort((a, b) => b.timestamp - a.timestamp)
                                    .map((note) => {
                                        const user = mockUsers.find((u) => u.id === note.userId) || mockUsers[0];

                                        return (
                                            <div
                                                key={note.id}
                                                className="rounded-xl bg-gradient-to-br from-primary/10 to-transparent p-4 border border-primary/20 cursor-pointer hover:shadow-warm-sm transition-all"
                                                onClick={() => onNavigateToPage(note.page)}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* User Avatar */}
                                                    <Avatar className="w-8 h-8 border-2 border-background">
                                                        <AvatarFallback className={user.color + " text-xs"}>
                                                            {user.name[0]}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div className="flex-1 min-w-0">
                                                        {/* User & Timestamp */}
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-xs font-semibold text-foreground">
                                                                {user.name}
                                                            </p>
                                                            <span className="text-xs text-muted-foreground">•</span>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatRelativeTime(note.timestamp)}
                                                            </p>
                                                        </div>

                                                        {/* Note Content */}
                                                        <p className="text-sm text-foreground/90 break-words whitespace-pre-wrap">
                                                            {note.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
