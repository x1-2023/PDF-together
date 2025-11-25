import { Toaster as Sonner } from "sonner";
import useSound from "use-sound";
import { useEffect } from "react";

// Import sound (placeholder URL for now, will need real file)
// For now we use a silent fallback or a public URL if available
const NOTIFICATION_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    const [play] = useSound(NOTIFICATION_SOUND, { volume: 0.5 });

    // Hook into sonner events if possible, or just play sound on specific actions
    // Since Sonner doesn't have direct onToast hook easily exposed here without custom wrapper,
    // we will just render the Toaster. 
    // Ideally, we wrap the `toast` function call to play sound.

    return (
        <Sonner
            theme="system"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-[#2A251F] group-[.toaster]:text-black group-[.toaster]:dark:text-white group-[.toaster]:border-border-light group-[.toaster]:dark:border-white/10 group-[.toaster]:shadow-lg",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
