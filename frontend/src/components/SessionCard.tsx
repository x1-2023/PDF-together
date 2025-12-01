import { FileText, Users, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SessionCardProps {
  title: string;
  status: "active" | "upcoming" | "completed";
  participants: number;
  thumbnail?: string;
  progress?: number;
  onClick?: () => void;
  onDelete?: () => void;
  variant?: "primary" | "secondary";
}

export const SessionCard = ({
  title,
  status,
  participants,
  thumbnail,
  progress = 0,
  onClick,
  onDelete,
  variant = "primary",
}: SessionCardProps) => {
  const statusConfig = {
    active: { label: "Đang hoạt động", color: "bg-primary text-primary-foreground" },
    upcoming: { label: "Sắp tới", color: "bg-secondary text-secondary-foreground" },
    completed: { label: "Đã xong", color: "bg-muted text-muted-foreground" },
  };

  const config = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-3xl bg-card cursor-pointer h-full flex flex-col",
        "transition-all duration-300 hover:scale-[1.02]",
        "shadow-warm-sm hover:shadow-warm-md",
        variant === "primary" && "bg-gradient-to-br from-primary-light/10 to-card",
        variant === "secondary" && "bg-gradient-to-br from-secondary-light/10 to-card"
      )}
    >
      {/* Delete Button - Shows on Hover */}
      {onDelete && (
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-warm-sm hover:bg-destructive/90 hover:text-destructive-foreground"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}

      {/* Thumbnail Frame */}
      <div className="relative h-40 bg-muted/30 rounded-t-2xl overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-16 h-16 text-muted-foreground/30" strokeWidth={1.5} />
          </div>
        )}

        {/* Status Pill */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
            "backdrop-blur-sm",
            config.color
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {config.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3 flex-1 flex flex-col">
        <h3 className="font-heading font-bold text-lg line-clamp-2 text-foreground group-hover:text-primary transition-colors mb-auto">
          {title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span className="font-medium">{participants}</span>
          </div>

          {progress > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span className="font-medium">{progress}%</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-auto">
          <div
            className="h-full bg-gradient-to-r from-primary-light to-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.max(progress, 0)}%` }}
          />
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};
