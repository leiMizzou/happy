/**
 * LiveKit-based Realtime Provider
 *
 * This file can be used as a drop-in replacement for RealtimeProvider.tsx
 * by simply renaming it or using conditional imports.
 */

import React from 'react';
import { LiveKitProvider } from './LiveKitProvider';

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <LiveKitProvider>
            {children}
        </LiveKitProvider>
    );
};
