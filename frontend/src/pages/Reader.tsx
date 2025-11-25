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

const Reader = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [message, setMessage] = useState("");
  const [pdfName, setPdfName] = useState("PDF Document");
  const [jumpToPage, setJumpToPage] = useState("");

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

  // Handle jump to page
  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
      setJumpToPage("");
    }
  };

  const tools = [
    { id: "cursor", icon: MousePointer, label: "Con trỏ" },
    { id: "pen", icon: Pen, label: "Bút" },
    { id: "highlighter", icon: Highlighter, label: "Đánh dấu" },
    { id: "eraser", icon: Eraser, label: "Tẩy" },
    { id: "text", icon: Type, label: "Văn bản" },
    { id: "note", icon: StickyNote, label: "Ghi chú" },
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

          {/* Undo/Redo */}
          <div className="hidden lg:flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Sidebar: Thumbnails */}
          <ResizablePanel defaultSize={18} minSize={15} maxSize={25} className="hidden lg:block">
            <VirtualizedSidebar />
          </ResizablePanel>

          <ResizableHandle className="hidden lg:flex w-1 bg-border hover:bg-primary/20 transition-colors" />

          {/* Main Content: PDF Canvas */}
          <ResizablePanel defaultSize={55} minSize={40}>
            <VirtualizedPDFCanvas />

            {/* Floating Tool Dock */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 floating-dock px-3 py-2 flex items-center gap-1 z-30">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`
                      w-11 h-11 rounded-full flex items-center justify-center transition-all
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
            </div>
          </ResizablePanel>

          <ResizableHandle className="hidden lg:flex w-1 bg-border hover:bg-primary/20 transition-colors" />

          {/* Right Sidebar: Notes, Chat, Users */}
          <ResizablePanel defaultSize={27} minSize={20} maxSize={35} className="hidden lg:block">
            <div className="h-full bg-card border-l border-border flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-12">
                  <TabsTrigger
                    value="notes"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <StickyNote className="w-4 h-4 mr-2" />
                    Ghi chú
                  </TabsTrigger>
                  <TabsTrigger
                    value="chat"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger
                    value="users"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Người dùng
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="flex-1 overflow-hidden mt-0">
                  <ScrollArea className="h-full">
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
                </TabsContent>

                <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
                  <div className="p-3 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      {mockUsers.slice(0, 3).map((user) => (
                        <Avatar key={user.id} className="w-7 h-7 border-2 border-background">
                          <AvatarFallback className={user.color}>
                            {user.name[0]}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                        LIVE
                      </span>
                    </div>
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

                  <div className="p-3 border-t border-border">
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
                </TabsContent>

                <TabsContent value="users" className="flex-1 mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {mockUsers.map((user) => (
                        <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className={user.color}>
                              {user.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
                          </div>
                          <div className={`w-2.5 h-2.5 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Reader;
