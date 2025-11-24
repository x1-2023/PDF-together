import { DiscordSDK } from "@discord/embedded-app-sdk";

type Auth = {
    access_token: string;
    user: {
        username: string;
        discriminator: string;
        id: string;
        public_flags: number;
        avatar?: string | null;
        global_name?: string | null;
    };
    scopes: string[];
    expires: string;
    application: {
        description: string;
        icon: string | null;
        id: string;
        name: string;
    };
};

const queryParams = new URLSearchParams(window.location.search);
const isDiscordClient = queryParams.has("frame_id");

export const discordSdk = isDiscordClient
    ? new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID || "")
    : null;

export async function setupDiscordSdk() {
    if (!discordSdk) {
        console.warn("Not running in Discord, skipping SDK setup.");
        // Return a mock auth object for local development if needed, 
        // or just null to indicate no Discord auth.
        return null;
    }

    await discordSdk.ready();
    console.log("Discord SDK is ready");

    // Authorize with Discord Client
    const { code } = await discordSdk.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: [
            "identify",
            "guilds",
            "rpc.voice.read" // For talking status if needed later
        ],
    });

    // Exchange code for token via backend
    const response = await fetch("/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code,
        }),
    });

    const { access_token } = await response.json();

    // Authenticate with Discord Client (so we can use SDK features that require auth)
    const auth = await discordSdk.commands.authenticate({
        access_token,
    });

    if (auth == null) {
        throw new Error("Authenticate command failed");
    }

    return auth as Auth;
}
