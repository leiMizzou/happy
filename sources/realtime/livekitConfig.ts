/**
 * LiveKit Configuration
 *
 * Centralized configuration for LiveKit integration.
 * You can customize these values based on your deployment.
 */

export const livekitConfig = {
    // Token Server URL
    tokenServerUrl: __DEV__
        ? 'http://localhost:8082/token'
        : 'https://your-production-domain.com/token',

    // LiveKit Server URL (will be returned by token server)
    // This is just for reference
    livekitServerUrl: __DEV__
        ? 'ws://localhost:7880'
        : 'wss://your-livekit-server.com',

    // Audio settings
    audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
    },

    // Connection settings
    connection: {
        reconnectAttempts: 3,
        reconnectDelay: 1000, // ms
        timeout: 10000, // ms
    },

    // Debug mode
    debug: __DEV__,
};

/**
 * Get language code from user preference
 * Map Happy's language codes to your backend's expected format
 */
export function getLanguageForLiveKit(userLanguagePreference: string): string {
    const languageMap: Record<string, string> = {
        'en': 'en',
        'zh': 'zh',
        'zh-Hans': 'zh',
        'zh-Hant': 'zh',
        'es': 'es',
        'fr': 'fr',
        'de': 'de',
        'ja': 'ja',
        'ko': 'ko',
        // Add more language mappings as needed
    };

    return languageMap[userLanguagePreference] || 'en';
}
