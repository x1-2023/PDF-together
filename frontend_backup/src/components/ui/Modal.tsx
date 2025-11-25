import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog
                    as={motion.div}
                    static
                    open={isOpen}
                    onClose={onClose}
                    className="relative z-50"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-[6px]"
                        aria-hidden="true"
                    />

                    {/* Container */}
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <Dialog.Panel className="contents">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                                className={`w-full max-w-xl bg-white/80 dark:bg-[#2A251F]/90 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden ring-1 ring-black/5 ${className}`}
                            >
                                {title && (
                                    <div className="p-8 pb-0 flex justify-between items-start">
                                        <Dialog.Title className="text-3xl font-black text-text-main dark:text-white mb-1">
                                            {title}
                                        </Dialog.Title>
                                        <button
                                            onClick={onClose}
                                            className="p-2 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors outline-none"
                                        >
                                            <span className="material-symbols-outlined text-xl">close</span>
                                        </button>
                                    </div>
                                )}

                                <div className="p-8 pt-6">
                                    {children}
                                </div>
                            </motion.div>
                        </Dialog.Panel>
                    </div>
                </Dialog>
            )}
        </AnimatePresence>
    );
};
