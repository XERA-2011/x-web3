'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// Demo Data
const DEMOS = [
  {
    id: 'lantern',
    title: 'LANTERN',
    img: '/img/thumbs/uber.jpg',
    href: '/viz/lantern', // Internal Next.js route
    external: false
  },
  {
    id: 'nero',
    title: 'NERO',
    img: '/img/thumbs/nero.jpg',
    href: '/viz/nero', // Internal Next.js route
    external: false
  },
  {
    id: 'splice',
    title: 'SPLICE',
    img: '/img/thumbs/splice.jpg',
    href: '/viz/splice',
    external: false
  },
  {
    id: 'bbng',
    title: 'BBNG',
    img: '/img/thumbs/bbng.jpg',
    href: '/viz/bbng',
    external: false
  },
  {
    id: 'word-problems',
    title: 'WORD PROBLEMS',
    img: '/img/thumbs/word.jpg',
    href: '/viz/word-problems',
    external: false
  },
  {
    id: 'loop',
    title: 'LOOP WAVEFORM VISUALIZER',
    img: '/img/thumbs/loop.jpg',
    href: '/viz/loop', // Internal Next.js route
    external: false
  },
  {
    id: 'pareidolia',
    title: 'PAREIDOLIA',
    img: '/img/thumbs/pareidolia.jpg',
    href: '/viz/pareidolia',
    external: false,
    date: '10.12.13',
  }
];



export default function Home() {

  return (
    <div className="min-h-screen bg-black text-[#CCC] font-lato p-5 md:p-10 flex flex-col items-center">

      {/* Content Container */}
      <div className="w-full max-w-[980px] relative">

        {/* Header */}
        <header className="mb-10">
          <h1 className="-ml-[10px]">
            <Image
              src="/img/logo-550.png"
              alt="ÜberViz"
              width={550}
              height={100}
              className="max-w-full h-auto"
              priority
            />
          </h1>
          <div className="mt-[30px] space-y-[30px]">
            <p className="text-[28px] font-light tracking-[1px] leading-[150%] text-[#DDD]">
              We build custom real-time audio-reactive music visualizers, using web technologies such as WebGL, Web Audio, and custom GLSL shaders. We also build live concert visuals and interactive installations.
            </p>

            <p className="text-[28px] font-light tracking-[1px] leading-[150%] text-[#DDD]">
              Say <a href="https://twitter.com/uberviz" className="text-white border-b border-white hover:opacity-80 transition-opacity">hello</a>.
            </p>
          </div>
        </header>

        {/* Demos Section */}
        <section id="demos" className="w-full mt-10">
          <h2 className="font-oswald text-2xl tracking-[4px] text-white leading-[42px] mb-5 mt-10">LIVE DEMOS</h2>

          <div className="pt-5 overflow-auto flex flex-wrap -mr-5">
            {DEMOS.map((demo) => (
              <div key={demo.id} className="float-left w-full sm:w-[calc(50%-20px)] pb-5 mr-5 mb-5 md:mb-0">
                <Link href={demo.href} className="group block text-[#AAA] hover:text-white transition-all duration-400">
                  <div className="overflow-hidden">
                    <img
                      src={demo.img}
                      alt={demo.title}
                      className="block w-full h-full transition-all duration-600 ease-[cubic-bezier(0.19,1,0.22,1)] grayscale filter hover:grayscale-[1%] hover:scale-[1.03] transform"
                    />
                  </div>
                  <div className="h-[50px] leading-[50px] tracking-[3px] uppercase text-center font-oswald text-[17px]">
                    {demo.title}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>



      </div>


    </div>
  );
}
