import { toast as sonnerToast } from "sonner";
import useSound from "use-sound";

// Short pop sound
const POP_SOUND = "/assets/sfx/pop.mp3";

export const useToast = () => {
    const [play] = useSound(POP_SOUND, { volume: 0.25 });

    const toast = {
        ...sonnerToast,
        success: (message: string | React.ReactNode, data?: any) => {
            play();
            return sonnerToast.success(message, data);
        },
        error: (message: string | React.ReactNode, data?: any) => {
            // play(); // Maybe different sound for error?
            return sonnerToast.error(message, data);
        },
        // Wrap other methods as needed
    };

    return { toast };
};
