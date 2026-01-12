import React from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';

export default function HomeTerminal() {
    return (
        <section className="container mx-auto px-4 py-20">
            <div className="relative border-2 border-[#00FFFF] bg-black/80 p-1 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                <div className="flex items-center justify-between border-b border-[#00FFFF] bg-[#00FFFF]/10 px-4 py-2">
                    <span className="text-sm font-bold tracking-wider text-[#00FFFF] uppercase">
                        TERMINAL_VIEW: ROOT_ACCESS
                    </span>
                    <div className="flex gap-2">
                        <div className="h-3 w-3 rounded-full bg-[#FF00FF]"></div>
                        <div className="h-3 w-3 rounded-full bg-[#00FFFF]"></div>
                        <div className="h-3 w-3 rounded-full bg-[#FF9900]"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-12 p-8 md:grid-cols-2">
                    <div className="flex flex-col justify-center space-y-6">
                        <h2 className="font-heading text-3xl font-black text-[#E0E0E0] md:text-5xl">
                            Execute complex visual algorithms directly from the browser.
                        </h2>
                        <div className="space-y-4 text-lg text-[#E0E0E0]/70">
                            <p>
                                &gt; Access the core visualization engine. Render real-time graphics using WebGL and advanced shader technologies.
                                Our systems are optimized for maximum performance and visual fidelity.
                            </p>
                            <p>
                                &gt; Explore the intersection of code and art. Each module represents a unique experiment in procedural generation,
                                physics simulation, and interactive design.
                            </p>
                        </div>
                        <Link
                            href="/viz/bbng"
                            className="skew-button self-start border-2 border-[#FF00FF] bg-[#FF00FF] px-8 py-3 text-lg text-white transition-all duration-200 hover:scale-105 hover:opacity-80"
                        >
                            <span className="font-mono tracking-wider uppercase">
                                INITIATE_SEQUENCE
                            </span>
                        </Link>
                    </div>
                    <div className="relative aspect-square overflow-hidden border border-[#2D1B4E]">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FF00FF]/20 to-[#00FFFF]/20"></div>
                        <div className="flex h-full items-center justify-center">
                            <Terminal className="h-32 w-32 animate-pulse text-[#00FFFF]" />
                        </div>
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,20,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
