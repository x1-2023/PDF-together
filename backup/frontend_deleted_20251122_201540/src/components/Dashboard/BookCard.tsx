import React from 'react';
import { Book } from '../../types';
import { Card } from '../UI/Card';

interface BookCardProps {
    book: Book;
    onClick: () => void;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
    return (
        <Card onClick={onClick} hoverable className="flex flex-col h-full overflow-hidden group">
            <div className="aspect-[3/4] bg-[var(--color-gray-100)] relative overflow-hidden">
                {book.cover ? (
                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[var(--color-accent-orange)] to-[#d35400] text-white p-6 text-center">
                        <div className="w-12 h-12 mb-4 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <span className="font-serif font-bold text-xl">{book.title.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-display font-bold text-lg leading-tight line-clamp-3">{book.title}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-display font-bold text-lg text-[var(--color-text-dark)] line-clamp-1 mb-1" title={book.title}>{book.title}</h3>
                <p className="text-sm text-[var(--color-text-light)] mb-4 font-medium">{book.author}</p>
                <div className="mt-auto pt-3 border-t border-[var(--color-gray-100)] flex justify-between items-center text-xs text-[var(--color-text-light)]">
                    <span className="bg-[var(--color-gray-100)] px-2 py-1 rounded-md">PDF</span>
                    <span>{(book.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
            </div>
        </Card>
    );
};
