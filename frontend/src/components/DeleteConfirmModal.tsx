import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

const DeleteConfirmModal = ({
  open,
  onOpenChange,
  onConfirm,
  title = "Xóa mục này?",
  description = "Hành động này không thể hoàn tác. Phiên học sẽ bị xóa vĩnh viễn.",
}: DeleteConfirmModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md">
        <AlertDialogHeader className="space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-secondary" />
          </div>
          <AlertDialogTitle className="font-heading text-xl text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="rounded-full h-12 sm:flex-1">
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-full h-12 bg-gradient-to-r from-primary-light to-primary hover:shadow-warm-md sm:flex-1"
          >
            Xóa ngay
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmModal;
