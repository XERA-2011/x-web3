'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SpliceApp } from '@/viz/splice/SpliceApp';

const AudioFile = '/viz/splice/audio/scream.mp3';
const SeqFile = '/viz/splice/data/seq.json';

export default function SplicePage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<SpliceApp | null>(null);
    const [started, setStarted] = useState(false);
    const [audioLoaded, setAudioLoaded] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const app = new SpliceApp(containerRef.current);
        appRef.current = app;

        // Auto init visuals and load audio
        const init = async () => {
            await app.init(SeqFile);
            await app.loadAudio(AudioFile);
            setAudioLoaded(true);
        };
        init();

        return () => {
            app.dispose();
        };
    }, []);

    const handleStart = async () => {
        if (!appRef.current || !audioLoaded || started) return;

        appRef.current.play();
        setStarted(true);
    };

    return (
        <div className="w-full h-screen bg-black overflow-hidden relative touch-none select-none">
            <div ref={containerRef} className="absolute inset-0" />

            {/* Title */}
            <div className="absolute top-8 left-8 text-white/50 text-xl font-light tracking-wide font-sans pointer-events-none z-10">
                Henry Fong & J-Trick - Scream
            </div>

            {/* About Button */}
            <div className="absolute top-8 right-8 border border-white/30 px-6 py-2 text-white/70 text-sm tracking-widest cursor-pointer hover:bg-white/10 hover:text-white transition-all font-sans z-10 w-24 text-center">
                ABOUT
            </div>

            {/* Play Button Overlay */}
            {!started && (
                <div
                    className={`absolute inset-0 flex items-center justify-center z-50 transition-opacity duration-500 ${audioLoaded ? 'opacity-100' : 'opacity-0'}`}
                >
                    {/* Circle */}
                    <div
                        className="w-24 h-24 rounded-full border border-white/50 flex items-center justify-center cursor-pointer group hover:scale-110 hover:border-white transition-all duration-300 bg-black/20 backdrop-blur-sm"
                        onClick={handleStart}
                    >
                        {/* Triangle */}
                        <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[26px] border-l-white border-b-[15px] border-b-transparent ml-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            )}

            {/* Loading Indicator */}
            {!audioLoaded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
                    <div className="text-white/30 font-mono text-xs animate-pulse tracking-widest">
                        LOADING DATA...
                    </div>
                </div>
            )}

            <div className={`absolute bottom-5 left-5 text-gray-600 font-mono text-xs max-w-md pointer-events-none transition-opacity duration-300 ${started ? 'opacity-0' : 'opacity-100'}`}>
                spline (viz)
            </div>
        </div>
    );
}
