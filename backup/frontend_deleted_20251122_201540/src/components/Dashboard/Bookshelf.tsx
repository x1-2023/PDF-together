import React, { useEffect, useState } from 'react';
import { Book } from '../../types';
import { BookCard } from './BookCard';
import { Button } from '../UI/Button';
import { Icons } from '../UI/Icons';
import { Header } from '../Layout/Header';

interface BookshelfProps {
    onOpenBook: (book: Book) => void;
    user: any;
}

export const Bookshelf: React.FC<BookshelfProps> = ({ onOpenBook, user }) => {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const res = await fetch('/api/pdfs');
            const data = await res.json();
            setBooks(data.pdfs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        // Optional: Add default metadata
        formData.append('title', file.name.replace('.pdf', ''));
        formData.append('author', user?.username || 'Unknown');

        try {
            const res = await fetch('/api/upload-pdf', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                fetchBooks();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[var(--color-bg-cream)]">
            <Header
                title="My Library"
                user={user}
                action={
                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={handleUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <Button icon={<Icons.Plus />}>Upload New Book</Button>
                    </div>
                }
            />

            <main className="flex-1 overflow-y-auto p-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-orange)]"></div>
                    </div>
                ) : (
                    <>
                        {books.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <div className="w-16 h-16 bg-[var(--color-gray-200)] rounded-full flex items-center justify-center mb-4 text-[var(--color-text-light)]">
                                    <Icons.Bookshelf className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--color-text-dark)] mb-2">Your library is empty</h3>
                                <p className="text-[var(--color-text-light)] max-w-md">Upload a PDF to get started with your study session.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {books.map((book) => (
                                    <BookCard key={book.id} book={book} onClick={() => onOpenBook(book)} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};
