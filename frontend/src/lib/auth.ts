/**
 * User authentication utilities
 * Handles userId for both development and production environments
 */

/**
 * Get the current user ID
 * - In development: Uses localStorage to persist a random userId
 * - In production: Will use Discord user ID from Discord SDK
 */
export const getUserId = (): string => {
    // Check if we're in production and have Discord SDK
    // @ts-ignore - Discord SDK types
    if (typeof window !== 'undefined' && window.discordSdk) {
        // Production: Use Discord user ID
        // @ts-ignore
        const discordUser = window.discordSdk.currentUser;
        if (discordUser?.id) {
            console.log('🎮 Using Discord user ID:', discordUser.id);
            return `discord-${discordUser.id}`;
        }
    }

    // Fallback for local development (without Discord SDK)
    // We do NOT persist this to localStorage anymore, as requested.
    // This ensures that if we are testing in Discord, we must have the SDK.
    // If we are local, we get a temporary mock user.
    console.warn('⚠️ Discord SDK not found. Using temporary mock user.');
    return 'discord-mock-user';
};

/**
 * Get the current username
 * - In development: Returns 'Dev User'
 * - In production: Returns Discord username
 */
export const getUsername = (): string => {
    // Check if we're in production and have Discord SDK
    // @ts-ignore - Discord SDK types
    if (typeof window !== 'undefined' && window.discordSdk) {
        // @ts-ignore
        const discordUser = window.discordSdk.currentUser;
        if (discordUser?.username) {
            return discordUser.username;
        }
    }

    // Development fallback
    return 'Dev User';
};

/**
 * Clear the stored dev user ID (useful for testing)
 */
export const clearDevUserId = (): void => {
    localStorage.removeItem('pdf-reader-dev-userId');
    console.log('🗑️ Cleared dev user ID');
};

// Export for debugging in console
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.clearDevUserId = clearDevUserId;
}
