'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script'; // Not used but good practice if we needed external scripts
import { LoopApp } from '@/viz/loop/LoopApp';
import AudioFile from '@/viz/loop/res/audio/EMDCR.mp3';

export default function LoopPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<LoopApp | null>(null);
    const [loading, setLoading] = useState(false);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Initialize App (Three.js scene)
        const app = new LoopApp(containerRef.current);
        appRef.current = app;

        return () => {
            app.dispose();
        };
    }, []);

    const handleStart = async () => {
        if (!appRef.current || started) return;

        setLoading(true);
        setStarted(true);

        const audioUrl = AudioFile;
        await appRef.current.initAudio(audioUrl);
        setLoading(false);
    };

    return (
        <div className="w-full h-screen bg-black overflow-hidden relative touch-none">
            <div ref={containerRef} className="absolute inset-0" />

            {/* Start Overlay */}
            {!started && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 cursor-pointer hover:bg-black/70 transition-colors"
                    onClick={handleStart}
                >
                    <div className="text-white font-oswald text-2xl tracking-widest border border-white px-8 py-4 hover:bg-white hover:text-black transition-colors">
                        CLICK TO START
                    </div>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                    <div className="text-white font-mono animate-pulse">
                        LOADING AUDIO...
                    </div>
                </div>
            )}

            {/* Overlay UI similar to original */}
            <div className={`absolute top-5 right-5 text-gray-500 font-mono text-xs pointer-events-none transition-opacity duration-500 ${started ? 'opacity-100' : 'opacity-0'}`}>
                LOOP WAVEFORM VISUALIZER
            </div>

            <div className={`absolute bottom-5 left-5 text-gray-600 font-mono text-xs max-w-md pointer-events-none transition-opacity duration-500 ${started ? 'opacity-100' : 'opacity-0'}`}>
                Move mouse to tilt.
                <br />
                Music: EMDCR by wait what?
            </div>
        </div>
    );
}
