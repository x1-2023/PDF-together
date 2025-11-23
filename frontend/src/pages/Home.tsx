import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api, PDFFile } from '../api';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../hooks/use-toast';
import { SessionStatus } from '../types';

const StatusBadge: React.FC<{ status: SessionStatus }> = ({ status }) => {
  const config = {
    active: { color: 'bg-green-500', text: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800', label: 'Hoạt động' },
    upcoming: { color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', label: 'Sắp tới' },
    completed: { color: 'bg-slate-500', text: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800/50', border: 'border-slate-200 dark:border-slate-700', label: 'Hoàn thành' },
  };
  // Default to active if status is unknown or mapped from backend
  const style = config[status] || config.active;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-bold border ${style.bg} ${style.text} ${style.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.color} animate-pulse`}></span>
      {style.label}
    </div>
  );
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'all' | SessionStatus>('all');
  const [sessions, setSessions] = useState<PDFFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await api.fetchSessions();
      setSessions(data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách tài liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!newSessionTitle) {
        setNewSessionTitle(e.target.files[0].name.replace('.pdf', ''));
      }
    }
  };

  const handleCreateSession = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const newPdf = await api.uploadSession(selectedFile, { title: newSessionTitle });

      toast.success("Đã tạo phiên mới thành công!");
      setSessions([newPdf, ...sessions]);
      setIsModalOpen(false);
      setNewSessionTitle('');
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-text-light dark:text-text-dark transition-colors duration-300 relative">

      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-50 dark:opacity-10"></div>
      <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      {/* Header */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border-light/60 dark:border-border-dark/60 px-6 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background-light/60">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <span className="material-symbols-outlined text-primary text-2xl">auto_stories</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-main to-primary">PDF Together</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all hover:rotate-90 duration-500"
          >
            <span className="material-symbols-outlined text-2xl text-text-muted">settings</span>
          </button>
          <div className="h-8 w-px bg-border-light dark:bg-border-dark"></div>
          <div
            className="w-9 h-9 rounded-full bg-cover bg-center ring-2 ring-white dark:ring-border-dark shadow-md cursor-pointer hover:scale-105 transition-transform"
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD8joDFCOTF2JOPuLqO3XDRH_HTE6r6JsSVlDVrE035sI8CbHkQoy1AZIHxSafJRVdun1bXcfLaU7FSaX0Df38ovzV6v8K3EZygIfSabw7x5L7nehA1Wqm89lqNAGNfnZAFKgn66TpnCZBTPV_ORfB6TswYWyHyGqdcldmMYnUto29ruroJzNWbO15o0hicZgHNN5y_dmmoVmB6xfYMB4cayhzOeVTTd_IfOqdyKYUQnfoNpS42qYhU0dAJLCaeYDfbLkGyJ-dS2hI")' }}
          />
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 py-10 pb-28">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tight mb-2 text-text-main dark:text-white">Chào mừng trở lại!</h2>
            <p className="text-text-muted dark:text-text-muted/80 text-lg">Tiếp tục từ nơi bạn đã dừng lại.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-surface-light/50 dark:bg-surface-dark/50 backdrop-blur rounded-full border border-border-light dark:border-border-dark shadow-sm">
            {(['all', 'active', 'upcoming', 'completed'] as const).map((tab) => {
              const labels: Record<string, string> = { all: 'Tất cả', active: 'Hoạt động', upcoming: 'Sắp tới', completed: 'Đã xong' };
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300
                    ${isActive
                      ? 'text-primary dark:text-white bg-white dark:bg-white/10 shadow-sm'
                      : 'text-text-muted hover:text-text-light'
                    }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {/* "New Session" Ghost Card */}
          <motion.div
            variants={item}
            onClick={() => setIsModalOpen(true)}
            className="group flex flex-col gap-4 cursor-pointer"
          >
            <div className="relative w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-border-light dark:border-border-dark flex flex-col items-center justify-center text-text-muted bg-surface-light/30 dark:bg-surface-dark/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 group-hover:-translate-y-2">
              <div className="p-4 rounded-full bg-surface-light dark:bg-surface-dark shadow-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-3xl text-primary">add</span>
              </div>
              <span className="font-bold text-sm">Tạo Phiên Mới</span>
            </div>
            <div className="h-12"></div>
          </motion.div>

          {isLoading ? (
            // Skeletons
            [1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex flex-col gap-4">
                <div className="w-full aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
              </div>
            ))
          ) : (
            sessions.map((session) => (
              <motion.div
                variants={item}
                key={session.id}
                onClick={() => navigate(`/reader/${session.id}`)}
                className="group flex flex-col gap-4 cursor-pointer"
              >
                <div className="relative w-full aspect-[3/4] rounded-2xl bg-surface-light dark:bg-surface-dark shadow-soft transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-float group-hover:rotate-1 overflow-hidden border border-border-light/50 dark:border-border-dark/50">
                  {/* Placeholder Cover if no real cover */}
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-300"
                  >
                    <span className="material-symbols-outlined text-6xl">picture_as_pdf</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                  {/* Quick Action Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white border border-white/30 transform scale-50 group-hover:scale-100 transition-transform">
                      <span className="material-symbols-outlined text-3xl">arrow_forward</span>
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div className="flex items-center gap-1 text-white/90 text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>group</span>
                      <span>1</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 px-1">
                  <h3 className="font-bold text-lg leading-snug text-text-main dark:text-text-dark group-hover:text-primary transition-colors line-clamp-2">
                    {session.title}
                  </h3>
                  <StatusBadge status="active" />
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </main>

      {/* FAB (Floating Action Button) */}
      <div className="fixed bottom-8 right-8 z-30 group">
        <div className="absolute inset-0 bg-primary blur-xl opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="relative flex items-center justify-center gap-3 h-16 pl-6 pr-8 rounded-full bg-text-main dark:bg-white text-white dark:text-text-main font-bold shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <span className="material-symbols-outlined text-3xl font-light">add</span>
          <span className="text-lg">Phiên Mới</span>
        </button>
      </div>

      {/* Create Session Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tạo Phiên Mới"
      >
        <div className="space-y-8">
          {/* File Upload Area */}
          <div className="group">
            <label className="block text-xs font-bold mb-3 text-text-muted uppercase tracking-wider ml-1">Tài liệu PDF</label>
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer overflow-hidden
                ${selectedFile
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border-light dark:border-border-dark hover:border-primary/40 hover:bg-surface-light'}`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              {selectedFile ? (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                    <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="font-bold text-text-main dark:text-text-dark truncate">{selectedFile.name}</p>
                    <p className="text-xs text-text-muted">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Sẵn sàng tải lên</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="ml-auto z-20 p-2 hover:bg-black/5 rounded-full"><span className="material-symbols-outlined">delete</span></button>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-surface-light dark:bg-surface-dark shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="material-symbols-outlined text-3xl text-primary">cloud_upload</span>
                  </div>
                  <p className="text-base font-bold text-text-main dark:text-text-dark">Bấm để chọn file PDF</p>
                  <p className="text-sm text-text-muted mt-1">hoặc kéo thả file vào đây</p>
                </>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-bold mb-2 text-text-muted uppercase tracking-wider ml-1">Tên Phiên</label>
              <input
                type="text"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="Nhập tên phiên..."
                className="w-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary text-text-light dark:text-text-dark outline-none transition-all font-medium placeholder:font-normal"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4 border-t border-border-light/50 dark:border-border-dark/50">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3.5 rounded-xl font-bold text-text-muted hover:text-text-main hover:bg-surface-light dark:hover:bg-white/5 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleCreateSession}
              disabled={!newSessionTitle || !selectedFile || isUploading}
              className="flex-[2] py-3.5 rounded-xl font-bold bg-text-main dark:bg-white text-white dark:text-text-main shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isUploading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
              {isUploading ? 'Đang tải lên...' : 'Bắt đầu ngay'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Home;
