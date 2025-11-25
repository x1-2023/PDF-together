import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CreateSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateSessionModal = ({ open, onOpenChange }: CreateSessionModalProps) => {
  const [fileName, setFileName] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [status, setStatus] = useState("active");
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      if (!sessionName) {
        setSessionName(file.name.replace('.pdf', ''));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      if (!sessionName) {
        setSessionName(file.name.replace('.pdf', ''));
      }
    }
  };

  const handleCreate = () => {
    if (!fileName || !sessionName) {
      toast.error("Vui lòng chọn file và nhập tên phiên");
      return;
    }
    
    toast.success("Phiên học đã được tạo!", {
      description: "Bắt đầu học cùng bạn bè ngay nhé! ✨",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Tạo Phiên Mới
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Upload Dropzone */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Tải file PDF lên</Label>
            <label
              className={`
                relative block w-full p-8 rounded-2xl border-2 border-dashed cursor-pointer
                transition-all duration-300
                ${isDragging 
                  ? 'border-primary bg-primary/10 scale-[1.02]' 
                  : 'border-border bg-muted/20 hover:border-primary/60 hover:bg-primary/5'
                }
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center shadow-warm-sm">
                  {fileName ? (
                    <FileText className="w-6 h-6 text-primary-foreground" />
                  ) : (
                    <Upload className="w-6 h-6 text-primary-foreground" />
                  )}
                </div>
                
                {fileName ? (
                  <div>
                    <p className="font-semibold text-foreground">{fileName}</p>
                    <p className="text-xs text-muted-foreground mt-1">Nhấn để chọn file khác</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold text-foreground">Bấm để chọn file PDF</p>
                    <p className="text-sm text-muted-foreground mt-1">hoặc kéo thả file vào đây</p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="session-name" className="text-sm font-semibold">Tên phiên</Label>
              <Input
                id="session-name"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="VD: Học React cùng nhau"
                className="rounded-xl h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold">Trạng thái</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="upcoming">Sắp tới</SelectItem>
                  <SelectItem value="completed">Đã xong</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-full font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={handleCreate}
              className="flex-1 h-12 rounded-full font-bold bg-gradient-to-r from-primary-light to-primary hover:shadow-warm-md transition-all"
            >
              Bắt đầu ngay
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
