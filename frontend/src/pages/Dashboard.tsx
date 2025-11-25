import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SessionCard } from "@/components/SessionCard";
import { NewSessionCard } from "@/components/NewSessionCard";
import { CreateSessionModal } from "@/components/CreateSessionModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import SettingsModal from "@/components/SettingsModal";
import { Settings, User, Plus, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api, PDFFile } from "@/api";

type FilterType = "all" | "active" | "upcoming" | "completed";

const Dashboard = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PDFFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Load sessions from API
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await api.fetchSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast.error("Không thể tải danh sách tài liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "active", label: "Hoạt động" },
    { value: "upcoming", label: "Sắp tới" },
    { value: "completed", label: "Đã xong" },
  ];

  // For now, show all sessions (we can add status field to PDFFile later)
  const filteredSessions = sessions;

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (sessionToDelete !== null) {
      try {
        await api.deleteSession(sessionToDelete);
        setSessions(prev => prev.filter(s => s.id !== sessionToDelete));
        toast.success("Đã xóa phiên học thành công");
        setSessionToDelete(null);
      } catch (error) {
        console.error('Failed to delete session:', error);
        toast.error("Lỗi khi xóa phiên");
      }
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Glass Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-cream/90 border-b border-border/50">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center shadow-warm-sm">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg hidden sm:inline">PDF Together</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsModalOpen(true)}
              className="w-9 h-9 rounded-full hover:bg-primary/10"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full hover:bg-primary/10"
            >
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-7xl mx-auto px-4 py-8 pb-24">
        {/* Welcome Block */}
        <div className="mb-8 animate-slide-up">
          <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-2">
            Chào mừng trở lại! 👋
          </h1>
          <p className="text-lg text-muted-foreground">
            Tiếp tục từ nơi bạn đã dừng lại.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`
                px-5 py-2.5 rounded-full font-bold text-sm whitespace-nowrap
                transition-all duration-300
                ${activeFilter === filter.value
                  ? 'bg-gradient-to-r from-primary-light to-primary text-primary-foreground shadow-warm-md'
                  : 'bg-card text-foreground hover:bg-muted shadow-warm-sm hover:shadow-warm-md'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Sessions Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            // Loading skeletons
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-muted rounded-2xl"></div>
                <div className="h-4 bg-muted rounded mt-4 w-3/4"></div>
              </div>
            ))
          ) : (
            filteredSessions.map((session, index) => (
              <div
                key={session.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <SessionCard
                  title={session.title}
                  status="active"
                  participants={1}
                  progress={0}
                  variant="primary"
                  onClick={() => navigate(`/reader/${session.id}`)}
                  onDelete={() => handleDeleteClick(session.id)}
                />
              </div>
            ))
          )}

          {/* New Session Ghost Card */}
          <div className="animate-slide-up" style={{ animationDelay: `${filteredSessions.length * 50}ms` }}>
            <NewSessionCard onClick={() => setIsCreateModalOpen(true)} />
          </div>
        </div>

        {/* Empty State */}
        {filteredSessions.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="font-heading text-xl font-bold mb-2">Chưa có phiên học nào</h3>
            <p className="text-muted-foreground mb-6">Tạo phiên mới để bắt đầu học cùng bạn bè!</p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-12 px-6 rounded-full font-bold bg-gradient-to-r from-primary-light to-primary hover:shadow-warm-md transition-all"
            >
              Tạo phiên đầu tiên
            </Button>
          </div>
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary-light to-primary shadow-warm-lg flex items-center justify-center hover:scale-110 transition-transform lg:hidden z-50"
      >
        <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={3} />
      </button>

      {/* Modals */}
      <CreateSessionModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />

      <DeleteConfirmModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
      />

      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
    </div>
  );
};

export default Dashboard;
