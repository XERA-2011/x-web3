import React from 'react';
import Link from 'next/link';
import {
    Zap,
    Bot,
    BarChart3,
    Puzzle,
    ShieldCheck,
    Globe,
    Eye,
    Infinity,
    Flame,
    Type,
    Scissors,
    Lightbulb,
} from 'lucide-react';

const MODULES = [
    {
        title: 'BBNG',
        desc: 'Big Bang Next Gen. Explosive particle simulation system.',
        icon: Zap,
        href: '/viz/bbng',
    },
    {
        title: 'LANTERN',
        desc: 'Illuminating the digital void. Light path tracing engine.',
        icon: Lightbulb,
        href: '/viz/lantern',
    },
    {
        title: 'LOOP',
        desc: 'Recursive reality loops. Infinite sequence generator.',
        icon: Infinity,
        href: '/viz/loop',
    },
    {
        title: 'NERO',
        desc: 'System combustion protocols. Legacy firewall burner.',
        icon: Flame,
        href: '/viz/nero',
    },
    {
        title: 'PAREIDOLIA',
        desc: 'Pattern recognition anomaly. Seeing faces in the machine code.',
        icon: Eye,
        href: '/viz/pareidolia',
    },
    {
        title: 'SPLICE',
        desc: 'Genetic data splicing. DNA sequence reconstruction.',
        icon: Scissors,
        href: '/viz/splice',
    },
    {
        title: 'WORD PROBLEMS',
        desc: 'Cryptographic linguistic puzzles. Decipher the unknown.',
        icon: Type,
        href: '/viz/word-problems',
    },
];

export default function HomeModules() {
    return (
        <section className="container mx-auto px-4 py-20 sm:py-32" id="modules">
            <div className="mb-12 text-center sm:mb-20">
                <h2 className="font-heading mb-4 text-3xl font-black text-[#E0E0E0] sm:mb-6 sm:text-5xl md:text-6xl">
                    VISUALIZATION <span className="text-[#FF00FF]">MODULES</span>
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-[#E0E0E0]/70 sm:text-xl">
                    Access the mainframe visualization subroutines.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {MODULES.map((module, index) => {
                    const Icon = module.icon;
                    return (
                        <Link
                            key={index}
                            href={module.href}
                            className="group block h-full border-t-2 border-r border-b border-l border-t-[#00FFFF] border-r-[#FF00FF]/30 border-b-[#FF00FF]/30 border-l-[#FF00FF]/30 bg-[#1a103c]/80 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-[#00FFFF] hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]"
                        >
                            <div className="flex flex-col space-y-1.5 p-6 h-full">
                                <div className="mb-6 flex h-16 w-16 rotate-45 transform items-center justify-center border-2 border-[#FF00FF] bg-[#FF00FF]/10 transition-transform duration-500 group-hover:rotate-90">
                                    <div className="-rotate-45 transform transition-transform duration-500 group-hover:-rotate-90">
                                        <Icon className="h-8 w-8 text-[#FF00FF]" />
                                    </div>
                                </div>
                                <h3 className="font-heading text-2xl leading-none font-semibold tracking-tight text-[#00FFFF] drop-shadow-[0_0_5px_rgba(0,255,255,0.8)] mb-2">
                                    {module.title}
                                </h3>
                                <p className="font-mono text-lg text-[#E0E0E0]/70">
                                    {module.desc}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
