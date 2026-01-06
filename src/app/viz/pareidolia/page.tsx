'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PareidoliaApp } from '@/viz/pareidolia/PareidoliaApp';
import AudioFile from '@/viz/pareidolia/res/mp3/Szerencsetlen_edit03.mp3';

export default function PareidoliaPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PareidoliaApp | null>(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const app = new PareidoliaApp(containerRef.current);
        appRef.current = app;

        return () => {
            app.dispose();
        };
    }, []);

    const handleStart = async () => {
        if (!appRef.current || started) return;
        setStarted(true);
        await appRef.current.initAudio(AudioFile);
    };

    const handleMouseDown = () => {
        appRef.current?.triggerEffect();
    };

    const handleMouseUp = () => {
        appRef.current?.stopEffect();
    };

    return (
        <div
            className="w-full h-screen bg-black overflow-hidden relative touch-none"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
        >
            <div ref={containerRef} className="absolute inset-0" />

            {!started && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 cursor-pointer hover:bg-black/70 transition-colors"
                    onClick={(e) => { e.stopPropagation(); handleStart(); }}
                >
                    <div className="text-white font-oswald text-2xl tracking-widest border border-white px-8 py-4 hover:bg-white hover:text-black transition-colors">
                        CLICK TO START (PAREIDOLIA)
                    </div>
                </div>
            )}

            <div className={`absolute top-5 right-5 text-gray-500 font-mono text-xs pointer-events-none transition-opacity duration-500 ${started ? 'opacity-100' : 'opacity-0'}`}>
                PAREIDOLIA - CLICK/HOLD FOR EFFECTS
            </div>

            <div className={`absolute bottom-5 left-5 text-gray-600 font-mono text-xs max-w-md pointer-events-none transition-opacity duration-500 ${started ? 'opacity-100' : 'opacity-0'}`}>
                Venetian Snares - Szerencsétlen
            </div>
        </div>
    );
}
