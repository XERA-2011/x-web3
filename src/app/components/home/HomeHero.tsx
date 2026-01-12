import React from 'react';
import Link from 'next/link';

export default function HomeHero() {
    return (
        <section className="container mx-auto px-4 pt-32 pb-20 text-center">
            <div className="mx-auto max-w-5xl space-y-8">
                {/* Version Tag */}
                <div className="inline-block -skew-x-12 transform border border-[#00FFFF] bg-[#00FFFF]/10 px-4 py-1 text-sm tracking-[0.2em] text-[#00FFFF] backdrop-blur">
                    <span className="inline-block skew-x-12 transform">
                        v2.0 SYSTEM ONLINE
                    </span>
                </div>

                {/* Main Heading */}
                <h1 className="font-heading text-5xl leading-tight font-black tracking-tighter sm:text-6xl md:text-8xl">
                    <span className="block text-[#E0E0E0] drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                        Visualize
                    </span>
                    <span className="gradient-text-animated block text-6xl drop-shadow-[0_0_30px_rgba(255,0,255,0.6)] sm:text-7xl md:text-9xl">
                        the unseen digital realms
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="mx-auto max-w-3xl text-lg leading-relaxed text-[#E0E0E0]/80 sm:text-xl md:text-2xl">
                    Experience next-generation generative art and data visualization
                    experiments powered by advanced algorithms.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col justify-center gap-4 pt-8 sm:flex-row sm:gap-6">
                    <Link
                        href="#modules"
                        className="inline-flex h-14 -skew-x-12 transform items-center justify-center rounded-none border-2 border-[#00FFFF] bg-transparent px-10 font-mono text-lg tracking-wider whitespace-nowrap text-[#00FFFF] uppercase transition-all duration-200 ease-linear hover:skew-x-0 hover:bg-[#00FFFF] hover:text-black hover:shadow-[0_0_20px_#00FFFF] focus-visible:ring-2 focus-visible:ring-[#00FFFF] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 sm:text-xl"
                    >
                        <span className="inline-block skew-x-12 transform">
                            EXPLORE MODULES
                        </span>
                    </Link>
                    <button className="inline-flex h-14 items-center justify-center rounded-none border-2 border-[#FF00FF] bg-transparent px-10 font-mono text-lg tracking-wider whitespace-nowrap text-[#FF00FF] uppercase transition-all duration-200 ease-linear hover:bg-[#FF00FF] hover:text-white focus-visible:ring-2 focus-visible:ring-[#00FFFF] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 sm:text-xl">
                        <span className="inline-block skew-x-12 transform">
                            SYSTEM STATUS
                        </span>
                    </button>
                </div>

                {/* Footer Note */}
                <div className="animate-pulse pt-12 text-sm tracking-widest text-[#FF00FF] uppercase">
                    INITIALIZING NEURAL INTERFACES...
                </div>
            </div>
        </section>
    );
}
