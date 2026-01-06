'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SpliceApp } from '@/viz/splice/SpliceApp';
import AudioFile from '@/viz/splice/res/scream/scream.mp3';
import SeqFile from '@/viz/splice/res/scream/seq.json';

export default function SplicePage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<SpliceApp | null>(null);
    const [loading, setLoading] = useState(false);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const app = new SpliceApp(containerRef.current);
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
        // JSON import in Next.js/Webpack usually returns the object directly
        const seqUrl = SeqFile;

        // We might need to adjust init to accept object instead of URL, or stringify it to blob url?
        // Let's check SpliceApp.ts. It likely fetches the JSON.
        // If we pass an object, we need to modify SpliceApp. 
        // OR we can pass the URL if imported as resource?
        // Actually, for JSON, `import x from 'y.json'` gives the object.
        // If SpliceApp expects a URL to fetch, we should probably change SpliceApp to accept the data directly.

        await appRef.current.init(audioUrl, seqUrl);
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
                        CLICK TO START (SPLICE)
                    </div>
                </div>
            )}

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                    <div className="text-white font-mono animate-pulse">
                        LOADING DATA...
                    </div>
                </div>
            )}

            <div className={`absolute top-5 right-5 text-gray-500 font-mono text-xs pointer-events-none transition-opacity duration-500 ${started ? 'opacity-100' : 'opacity-0'}`}>
                SPLICE VISUALIZER
            </div>

            <div className={`absolute bottom-5 left-5 text-gray-600 font-mono text-xs max-w-md pointer-events-none transition-opacity duration-500 ${started ? 'opacity-100' : 'opacity-0'}`}>
                Henry Fong & J-Trick - Scream
            </div>
        </div>
    );
}
