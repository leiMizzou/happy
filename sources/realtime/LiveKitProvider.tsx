import React from 'react';
import { LiveKitVoiceSession } from './LiveKitVoiceSession.web';

/**
 * LiveKit Provider component
 *
 * This is a drop-in replacement for ElevenLabsProvider.
 * It initializes the LiveKit VoiceSession and registers it with the app.
 *
 * Usage:
 * <LiveKitProvider>
 *   <YourApp />
 * </LiveKitProvider>
 */
export const LiveKitProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <LiveKitVoiceSession />
            {children}
        </>
    );
};
