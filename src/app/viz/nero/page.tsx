'use client';

import React from 'react';

import { useEffect, useRef } from 'react';
import { NeroApp } from '@/viz/nero/NeroApp';

export default function NeroPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<NeroApp | null>(null);

    useEffect(() => {
        if (containerRef.current && !appRef.current) {
            appRef.current = new NeroApp(containerRef.current);
        }

        return () => {
            if (appRef.current) {
                appRef.current.dispose();
                appRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="w-full h-screen bg-black overflow-hidden touch-none"
        />
    );
}
