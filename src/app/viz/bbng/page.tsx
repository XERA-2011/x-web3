'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BbngApp } from '@/viz/bbng/BbngApp';

export default function BbngPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<BbngApp | null>(null);
    const [loading, setLoading] = useState(false);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const app = new BbngApp(containerRef.current);
        appRef.current = app;

        return () => {
            app.dispose();
        };
    }, []);

    const handleStart = async () => {
        if (!appRef.current || started) return;

        setLoading(true);
        setStarted(true);

        const audioUrl = '/viz/bbng/mp3/BBNG_Confessions_edit.mp3';

        await appRef.current.initAudio(audioUrl);
        setLoading(false);
    };

    return (
        <div className="w-full h-screen bg-black overflow-hidden relative touch-none">
            <div ref={containerRef} className="absolute inset-0" />

            {!started && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 cursor-pointer hover:bg-black/70 transition-colors"
                    onClick={handleStart}
                >
                    <div className="text-white font-oswald text-2xl tracking-widest border border-white px-8 py-4 hover:bg-white hover:text-black transition-colors">
                        CLICK TO START (BBNG)
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

            <div className={`absolute top-5 right-5 text-gray-500 font-mono text-xs pointer-events-none transition-opacity duration-500 ${started ? 'opacity-100' : 'opacity-0'}`}>
                BBNG VISUALIZER
            </div>

            <div className={`absolute bottom-5 left-5 text-gray-600 font-mono text-xs max-w-md pointer-events-none transition-opacity duration-500 ${started ? 'opacity-100' : 'opacity-0'}`}>
                Can't Leave The Night - BADBADNOTGOOD
            </div>
        </div>
    );
}
