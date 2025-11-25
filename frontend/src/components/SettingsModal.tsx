import { Settings, User, Bell, Palette, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-2xl max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-heading text-2xl flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Cài đặt
          </DialogTitle>
          <DialogDescription>
            Quản lý tài khoản và tùy chỉnh trải nghiệm của bạn
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="flex-1 overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-12 px-6">
            <TabsTrigger 
              value="profile" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <User className="w-4 h-4 mr-2" />
              Hồ sơ
            </TabsTrigger>
            <TabsTrigger 
              value="notifications"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Bell className="w-4 h-4 mr-2" />
              Thông báo
            </TabsTrigger>
            <TabsTrigger 
              value="appearance"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Palette className="w-4 h-4 mr-2" />
              Giao diện
            </TabsTrigger>
            <TabsTrigger 
              value="language"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Globe className="w-4 h-4 mr-2" />
              Ngôn ngữ
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-6">
            <TabsContent value="profile" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên hiển thị</Label>
                  <Input 
                    id="name" 
                    placeholder="Nhập tên của bạn" 
                    className="rounded-xl"
                    defaultValue="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="email@example.com" 
                    className="rounded-xl"
                    defaultValue="user@example.com"
                  />
                </div>
                <Separator />
                <Button className="rounded-full h-12 bg-gradient-to-r from-primary-light to-primary hover:shadow-warm-md">
                  Lưu thay đổi
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tin nhắn mới</Label>
                    <p className="text-sm text-muted-foreground">Nhận thông báo khi có tin nhắn mới</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ghi chú mới</Label>
                    <p className="text-sm text-muted-foreground">Thông báo khi có ghi chú được thêm</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Người tham gia mới</Label>
                    <p className="text-sm text-muted-foreground">Thông báo khi có người vào phiên</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Chế độ tối</Label>
                    <p className="text-sm text-muted-foreground">Tự động chuyển theo hệ thống</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Kích thước font chữ</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-full flex-1">Nhỏ</Button>
                    <Button variant="outline" className="rounded-full flex-1 bg-primary/10">Trung bình</Button>
                    <Button variant="outline" className="rounded-full flex-1">Lớn</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="language" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Ngôn ngữ hiển thị</Label>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full rounded-full justify-start bg-primary/10">
                      🇻🇳 Tiếng Việt
                    </Button>
                    <Button variant="outline" className="w-full rounded-full justify-start">
                      🇺🇸 English
                    </Button>
                    <Button variant="outline" className="w-full rounded-full justify-start">
                      🇯🇵 日本語
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
