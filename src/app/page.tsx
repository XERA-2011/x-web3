import React from 'react';
import HomeHero from './components/home/HomeHero';
import HomeTerminal from './components/home/HomeTerminal';
import HomeModules from './components/home/HomeModules';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="perspective-grid" />
      <div className="floating-sun" />
      <div className="scanlines" />

      {/* Content */}
      <div className="relative z-10 space-y-0 pb-20">
        <HomeHero />
        <HomeTerminal />
        <HomeModules />
      </div>
    </main>
  );
}
