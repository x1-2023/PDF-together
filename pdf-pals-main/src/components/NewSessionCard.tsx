import { Plus, Sparkles } from "lucide-react";

interface NewSessionCardProps {
  onClick?: () => void;
}

export const NewSessionCard = ({ onClick }: NewSessionCardProps) => {
  return (
    <div
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Dashed Border Container */}
      <div className="h-full min-h-[280px] flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed border-primary/40 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent hover:border-primary hover:bg-primary/10 transition-all duration-300">
        
        {/* Big Plus Sticker Icon */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center shadow-warm-md group-hover:shadow-warm-lg transition-all duration-300 group-hover:scale-110">
            <Plus className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
          </div>
          
          {/* Cute Sparkle */}
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-secondary opacity-0 group-hover:opacity-100 group-hover:animate-sparkle" />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h3 className="font-heading font-bold text-lg text-foreground">
            Tạo Phiên Mới
          </h3>
          <p className="text-sm text-muted-foreground">
            Bắt đầu học cùng nhau
          </p>
        </div>
      </div>
    </div>
  );
};
