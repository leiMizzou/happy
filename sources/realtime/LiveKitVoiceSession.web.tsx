import React, { useEffect, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { registerVoiceSession } from './RealtimeSession';
import { storage } from '@/sync/storage';
import type { VoiceSession, VoiceSessionConfig } from './types';

// Static reference to the Room instance
let roomInstance: Room | null = null;

// LiveKit VoiceSession Implementation
class LiveKitVoiceSessionImpl implements VoiceSession {

    async startSession(config: VoiceSessionConfig): Promise<void> {
        if (!roomInstance) {
            console.warn('LiveKit room not initialized');
            return;
        }

        try {
            storage.getState().setRealtimeStatus('connecting');

            // Get user's preferred language for voice assistant
            const userLanguagePreference = storage.getState().settings.voiceAssistantLanguage;

            // 1. Request token from Token Server
            const tokenResponse = await fetch('http://localhost:8082/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: config.sessionId,
                    language: userLanguagePreference || 'zh',
                    initialContext: config.initialContext || '',
                }),
            });

            if (!tokenResponse.ok) {
                throw new Error('Failed to get LiveKit token');
            }

            const { token, roomName, url } = await tokenResponse.json();
            console.log(`Connecting to LiveKit room: ${roomName}`);

            // 2. Request microphone permission
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // 3. Connect to LiveKit room
            await roomInstance.connect(url, token);
            console.log('Connected to LiveKit room');

            // 4. Enable microphone
            await roomInstance.localParticipant.setMicrophoneEnabled(true);
            console.log('Microphone enabled');

            storage.getState().setRealtimeStatus('connected');

        } catch (error) {
            console.error('Failed to start LiveKit session:', error);
            storage.getState().setRealtimeStatus('error');
        }
    }

    async endSession(): Promise<void> {
        if (!roomInstance) {
            return;
        }

        try {
            await roomInstance.disconnect();
            storage.getState().setRealtimeStatus('disconnected');
            console.log('Disconnected from LiveKit room');
        } catch (error) {
            console.error('Failed to end LiveKit session:', error);
        }
    }

    sendTextMessage(message: string): void {
        if (!roomInstance) {
            console.warn('LiveKit room not initialized');
            return;
        }

        try {
            // Send text message via DataChannel
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify({
                type: 'user_text_message',
                text: message,
                timestamp: Date.now()
            }));

            roomInstance.localParticipant.publishData(data, {
                reliable: true
            });

            console.log('Sent text message:', message);
        } catch (error) {
            console.error('Failed to send text message:', error);
        }
    }

    sendContextualUpdate(update: string): void {
        if (!roomInstance) {
            console.warn('LiveKit room not initialized');
            return;
        }

        try {
            // Send contextual update via DataChannel
            const encoder = new TextEncoder();
            const data = encoder.encode(JSON.stringify({
                type: 'context_update',
                context: update,
                timestamp: Date.now()
            }));

            roomInstance.localParticipant.publishData(data, {
                reliable: true
            });

            console.log('Sent contextual update:', update);
        } catch (error) {
            console.error('Failed to send contextual update:', error);
        }
    }
}

export const LiveKitVoiceSession: React.FC = () => {
    const room = useRef<Room>(new Room()).current;
    const hasRegistered = useRef(false);

    useEffect(() => {
        // Store the room instance globally
        roomInstance = room;

        // Setup event listeners
        room.on(RoomEvent.ParticipantConnected, (participant) => {
            console.log('Participant connected:', participant.identity);
        });

        room.on(RoomEvent.TrackSubscribed, async (track, publication, participant) => {
            console.log('Track subscribed:', track.kind, 'from', participant.identity);

            if (track.kind === Track.Kind.Audio) {
                // Attach audio track to DOM for playback
                const audioElement = track.attach();
                audioElement.autoplay = true;
                audioElement.volume = 1.0;
                document.body.appendChild(audioElement);
                console.log('Audio track attached and playing');
            }
        });

        room.on(RoomEvent.DataReceived, (payload, participant) => {
            // Handle data messages from Agent
            const decoder = new TextDecoder();
            const message = decoder.decode(payload);

            try {
                const data = JSON.parse(message);
                console.log('Data received from Agent:', data);

                // You can dispatch events or update state here
                // For example, update transcript in UI
            } catch (error) {
                console.error('Failed to parse data message:', error);
            }
        });

        room.on(RoomEvent.Disconnected, () => {
            console.log('Disconnected from LiveKit room');
            storage.getState().setRealtimeStatus('disconnected');
        });

        room.on(RoomEvent.Reconnecting, () => {
            console.log('Reconnecting to LiveKit room...');
            storage.getState().setRealtimeStatus('connecting');
        });

        room.on(RoomEvent.Reconnected, () => {
            console.log('Reconnected to LiveKit room');
            storage.getState().setRealtimeStatus('connected');
        });

        // Register the voice session once
        if (!hasRegistered.current) {
            try {
                registerVoiceSession(new LiveKitVoiceSessionImpl());
                hasRegistered.current = true;
                console.log('LiveKit VoiceSession registered');
            } catch (error) {
                console.error('Failed to register LiveKit voice session:', error);
            }
        }

        return () => {
            // Clean up on unmount
            if (roomInstance) {
                roomInstance.disconnect();
                roomInstance = null;
            }
        };
    }, [room]);

    // This component doesn't render anything visible
    return null;
};
