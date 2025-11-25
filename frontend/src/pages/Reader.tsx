import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, ZoomIn, ZoomOut, Undo2, Redo2,
  MousePointer, Pen, Highlighter, Eraser, Type,
  StickyNote, Sparkles, MessageSquare, Users,
  Send, Search
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePDFStore } from "@/store/usePDFStore";
import { useUIStore } from "@/store/useUIStore";
import { VirtualizedPDFCanvas } from "@/components/reader/VirtualizedPDFCanvas";
import { VirtualizedSidebar } from "@/components/reader/VirtualizedSidebar";
import { ToolSettingsPanel } from "@/components/reader/ToolSettingsPanel";

import { useWebSocket } from "@/hooks/useWebSocket";

const Reader = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState("");
  const [pdfName, setPdfName] = useState("PDF Document");
  const [jumpToPage, setJumpToPage] = useState("");

  // WebSocket
  const { sendAnnotation } = useWebSocket(id || 'default', 'user-1', 'Guest');

  // Zustand stores
  const { pdfUrl, setPdfUrl, numPages, currentPage, scale, zoomIn, zoomOut, setCurrentPage } = usePDFStore();
  const { activeTool, setActiveTool, activeTab, setActiveTab } = useUIStore();

  // Load PDF from API and fetch session data
  useEffect(() => {
    if (id) {
      // Use /pdf prefix (proxied to backend)
      setPdfUrl(`/pdf/${id}`);

      // Fetch PDF list to get PDF name
      fetch(`/api/pdfs`)
        .then(res => res.json())
        .then(data => {
          const pdf = data.pdfs?.find((p: any) => p.url.includes(id));
          if (pdf?.title) {
            setPdfName(pdf.title);
          }
        })
        .catch(err => console.error('Failed to fetch PDF data:', err));
    }
  }, [id, setPdfUrl]);

  // Handle Ctrl+Scroll zoom globally to prevent browser zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();

        if (e.deltaY < 0) {
          zoomIn();
        } else {
          zoomOut();
        }
      }
    };

    // Add to document to catch all wheel events
    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [zoomIn, zoomOut]);

  // Handle jump to page
  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
      setJumpToPage("");
    }
  };

  const tools = [
    { id: "move", icon: MousePointer, label: "Di chuyển" },
    { id: "pen", icon: Pen, label: "Bút" },
    { id: "highlight", icon: Highlighter, label: "Đánh dấu" },
    { id: "eraser", icon: Eraser, label: "Tẩy" },
    { id: "text", icon: Type, label: "Văn bản" },
    { id: "sticky", icon: StickyNote, label: "Ghi chú" },
    { id: "ai", icon: Sparkles, label: "AI" },
  ];

  const mockUsers = [
    { id: 1, name: "Bạn", status: "online", color: "bg-primary" },
    { id: 2, name: "Minh", status: "online", color: "bg-secondary" },
    { id: 3, name: "Hương", status: "away", color: "bg-accent" },
  ];

  const mockMessages = [
    { id: 1, user: "Minh", message: "Trang 5 này khó quá!", time: "14:23", color: "bg-secondary" },
    { id: 2, user: "Bạn", message: "Để mình giải thích nhé", time: "14:24", color: "bg-primary" },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <header className="h-14 border-b border-border bg-cream/90 backdrop-blur-sm flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="font-heading font-bold text-sm truncate max-w-[200px]" title={pdfName}>{pdfName}</h2>
            <p className="text-xs text-muted-foreground">
              Page {currentPage} / {numPages} • 5 người
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Jump to Page */}
          <div className="hidden md:flex items-center gap-1">
            <Input
              type="number"
              placeholder="Go to..."
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
              className="w-20 h-8 text-xs"
              min={1}
              max={numPages}
            />
          </div>

          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-card rounded-full px-2 py-1 shadow-warm-sm">
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={zoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-[45px] text-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={zoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full" title="Search">
              <Search className="w-4 h-4" />
            </Button>
          </div>

        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Sidebar: Thumbnails */}
          <ResizablePanel defaultSize={5} minSize={3} maxSize={10} className="hidden lg:block">
            <VirtualizedSidebar />
          </ResizablePanel>

          <ResizableHandle className="hidden lg:flex w-1 bg-border hover:bg-primary/20 transition-colors" />

          {/* Main Content: PDF Canvas */}
          <ResizablePanel defaultSize={55} minSize={40}>
            <VirtualizedPDFCanvas onAnnotationCreate={sendAnnotation} />

            {/* Floating Tool Dock */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 floating-dock px-3 py-2 flex flex-col items-center gap-2 z-30">
              {/* Tool Settings Panel */}
              {activeTool !== 'cursor' && (
                <ToolSettingsPanel onClose={() => setActiveTool('cursor')} />
              )}

              <div className="flex items-center gap-1 px-3 py-2 bg-card/90 backdrop-blur-md border border-border/50 shadow-warm-lg rounded-full">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTool(tool.id)}
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all
                        ${activeTool === tool.id
                          ? 'bg-gradient-to-br from-primary-light to-primary text-primary-foreground shadow-warm-md scale-110'
                          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                        }
                      `}
                      title={tool.label}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  );
                })}

                <div className="w-px h-6 bg-border mx-1" />

                <button
                  onClick={() => { /* Undo logic */ }}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  title="Hoàn tác"
                >
                  <Undo2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { /* Redo logic */ }}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  title="Làm lại"
                >
                  <Redo2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle className="hidden lg:flex w-1 bg-border hover:bg-primary/20 transition-colors" />

          {/* Right Sidebar: Notes, Chat, Users */}
          <ResizablePanel defaultSize={27} minSize={20} maxSize={35} className="hidden lg:block">
            <div className="h-full bg-card border-l border-border flex flex-col">
              <div className="h-full flex flex-col bg-background">
                <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <StickyNote className="w-4 h-4" />
                    Ghi chú & Chat
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-2 mr-2">
                      {mockUsers.slice(0, 3).map((user) => (
                        <Avatar key={user.id} className="w-6 h-6 border-2 border-background">
                          <AvatarFallback className={user.color + " text-[10px]"}>
                            {user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </div>

                <ResizablePanelGroup direction="vertical">
                  {/* Top Panel: Notes */}
                  <ResizablePanel defaultSize={50} minSize={20}>
                    <div className="h-full flex flex-col">
                      <div className="p-2 border-b border-border bg-muted/10">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ghi chú</h3>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-transparent p-4 border border-primary/20">
                            <div className="flex items-start gap-2 mb-2">
                              <StickyNote className="w-4 h-4 text-primary mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-1">Trang 3 • Minh</p>
                                <p className="text-sm">useState hook rất hữu ích cho state management!</p>
                              </div>
                            </div>
                          </div>

                          <Button className="w-full h-10 rounded-full bg-gradient-to-r from-primary-light to-primary hover:shadow-warm-md">
                            <StickyNote className="w-4 h-4 mr-2" />
                            Thêm ghi chú
                          </Button>
                        </div>
                      </ScrollArea>
                    </div>
                  </ResizablePanel>

                  <ResizableHandle withHandle />

                  {/* Bottom Panel: Chat */}
                  <ResizablePanel defaultSize={50} minSize={20}>
                    <div className="h-full flex flex-col">
                      <div className="p-2 border-b border-border bg-muted/10 flex justify-between items-center">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chat</h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">LIVE</span>
                      </div>

                      <ScrollArea className="flex-1">
                        <div className="p-4 space-y-3">
                          {mockMessages.map((msg) => (
                            <div key={msg.id} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className={msg.color}>
                                    {msg.user[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-bold">{msg.user}</span>
                                <span className="text-xs text-muted-foreground">{msg.time}</span>
                              </div>
                              <div className="ml-8 rounded-2xl bg-cream px-3 py-2 text-sm">
                                {msg.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="p-3 border-t border-border bg-background">
                        <div className="flex gap-2">
                          <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Nhập tin nhắn..."
                            className="rounded-xl flex-1"
                          />
                          <Button size="icon" className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary">
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Reader;
