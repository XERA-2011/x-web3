
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { VizController } from '../../../viz/lantern/core/VizController';

export default function LanternContainer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const controllerRef = useRef<VizController | null>(null);
    const [loading, setLoading] = useState(true);
    const [showOverlay, setShowOverlay] = useState(true);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;
        if (controllerRef.current) return;

        const controller = new VizController();
        controllerRef.current = controller;

        controller.init(containerRef.current).then(() => {
            controller.getEffect("LightLeak")?.onToggle(true);
            controller.getEffect("Stars")?.onToggle(true);
            controller.getEffect("StarBars")?.onToggle(true);

            // Double Ensure Initial Darkness
            controller.fx.extraBrightness = -1;

            // Start animation loop to render the first black frame
            animate();

            // Fade in background effects via extraBrightness (matching original TweenMax.fromTo)
            // Original: TweenMax.fromTo(u["super"].uniforms.brightness, 2, {value:-1}, {value:0})
            gsap.fromTo(controller.fx,
                { extraBrightness: -1 },
                {
                    extraBrightness: 0,
                    duration: 2, // Original: 2 seconds
                    ease: "power1.out" // TweenMax default easing
                }
            );

            // Reveal canvas only after setup
            setLoading(false);
        });

        let animationId: number;
        const animate = () => {
            controller.update();
            animationId = requestAnimationFrame(animate);
        };

        return () => {
            cancelAnimationFrame(animationId);
            // Optional: Cleanup controller resources if needed
            // controller.dispose(); 
        };
    }, []);

    // Handle UI Fade In when loading finishes
    useEffect(() => {
        if (!loading && showOverlay) {
            // Wait for next frame to ensure DOM is rendered
            const timer = setTimeout(() => {
                // Staggered fade in for Logo, Title, Prompt, Options
                gsap.to(".intro-el", {
                    opacity: 1,
                    duration: 2,
                    stagger: 0.5,
                    delay: 0.5, // Start 0.5s after background begins
                    ease: "sine.inOut" // Gentle easing
                });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [loading, showOverlay]);

    const start = () => {
        setShowOverlay(false);
        if (controllerRef.current) {
            const ctrl = controllerRef.current;

            // Turn off LightLeak (original behavior)
            ctrl.getEffect("LightLeak")?.onToggle(false);

            // Original "0 Build" sequence: ColorWheel ON, Eclipse ON
            // This matches the initial playback state in original
            ctrl.getEffect("ColorWheel")?.onToggle(true);
            ctrl.getEffect("Eclipse")?.onToggle(true);
            ctrl.getEffect("Crystal")?.onToggle(false);
            ctrl.getEffect("ImageRipple")?.onToggle(false);
            ctrl.getEffect("ImageTunnel")?.onToggle(false);
            ctrl.getEffect("Ripples")?.onToggle(false);

            // StarBars OFF at start (original "0 Build")
            ctrl.getEffect("StarBars")?.onToggle(false);
            ctrl.getEffect("Stars")?.onToggle(true);

            // Original audio settings for "0 Build"
            ctrl.audio.params.gain = 1.5;
            ctrl.audio.params.beatHoldTime = 80;

            // Fade in from black using extraBrightness
            // Original viz-start: TweenMax.fromTo(brightness, 1, {value:-1}, {value:0})
            ctrl.fx.extraBrightness = -1;

            gsap.to(ctrl.fx, {
                extraBrightness: 0,
                duration: 1, // Original: 1 second for viz-start
                ease: 'power1.out'
            });
        }
    };

    const handleStartMic = () => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            controllerRef.current?.audio.setMicStream(stream);
            start();
        });
    };

    const handleSample = async () => {
        // Resume AudioContext (required for autoplay policies)
        if (controllerRef.current?.audio?.context?.state === 'suspended') {
            await controllerRef.current.audio.context.resume();
        }

        const audio = new Audio('/viz/lantern/res/mp3/Lantern.mp3');
        audio.crossOrigin = 'anonymous';
        audio.loop = true;

        // Wait for audio to load before connecting
        audio.addEventListener('canplaythrough', () => {
            if (controllerRef.current) {
                controllerRef.current.audio.loadAudioElement(audio);
                controllerRef.current.sequence.start(audio); // Start sequence system!
                audio.play();
                startWithSequence();
            }
        }, { once: true });

        audio.load();
    };

    // Simplified start for sequence mode
    const startWithSequence = () => {
        setShowOverlay(false);
        if (controllerRef.current) {
            const ctrl = controllerRef.current;

            // Fade in from black using extraBrightness
            ctrl.fx.extraBrightness = -1;

            gsap.to(ctrl.fx, {
                extraBrightness: 0,
                duration: 1,
                ease: 'power1.out'
            });
        }
    };

    const handleLoadMp3 = (e: React.DragEvent) => {
        e.preventDefault();
        // Implement drag drop if possible, or just click
    };

    useEffect(() => {
        // Prevent body scroll and overscroll rubber-banding
        document.body.style.overflow = 'hidden';
        document.body.style.overscrollBehavior = 'none';
        document.body.style.backgroundColor = 'black';

        return () => {
            document.body.style.overflow = '';
            document.body.style.overscrollBehavior = '';
            document.body.style.backgroundColor = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black overflow-hidden font-sans text-white select-none overscroll-none">
            <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />

            {/* Loading - Hidden as per request, just black screen */}
            {loading && (
                <div className="absolute inset-0 z-50 bg-black" />
            )}

            {/* Intro Overlay */}
            {showOverlay && !loading && (
                <div
                    id="intro"
                    className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center font-sans"
                >
                    <h1 className="mb-2 opacity-0 intro-el">
                        <img src="/viz/lantern/res/img/intro/logo-400.png" alt="ÜberViz" className="w-[400px] h-auto mx-auto" />
                    </h1>
                    <h2 className="text-[12px] tracking-[0.3em] font-normal text-[#999] mb-12 uppercase opacity-0 intro-el" style={{ textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}>Realtime Music Visualizer</h2>

                    <div id="prompt" className="text-xs text-gray-500 mb-12 uppercase tracking-wide opacity-0 intro-el hidden">Drop MP3 here</div>

                    <div id="sound-options" className="flex gap-20 text-center items-start justify-center opacity-0 intro-el">
                        <div className="option clickable group cursor-pointer flex flex-col items-center" id="option-mic" onClick={handleStartMic}>
                            <h3 className="uppercase text-[10px] tracking-[0.2em] text-[#666] mb-5 group-hover:text-white transition-colors border-b border-transparent group-hover:border-white pb-1 underline-offset-4 font-bold">Use Microphone</h3>
                            <div className="icon mic w-[60px] h-[78px] bg-[url('/viz/lantern/res/img/intro/mic.svg')] bg-no-repeat bg-center opacity-70 group-hover:opacity-100 transition-all"></div>
                        </div>

                        <div className="option clickable group cursor-pointer flex flex-col items-center" id="option-sample" onClick={handleSample}>
                            <h3 className="uppercase text-[10px] tracking-[0.2em] text-[#666] mb-5 group-hover:text-white transition-colors border-b border-transparent group-hover:border-white pb-1 underline-offset-4 font-bold">Play Sample Music</h3>
                            <div className="icon play w-[60px] h-[78px] bg-[url('/viz/lantern/res/img/intro/controller-play.svg')] bg-no-repeat bg-center opacity-70 group-hover:opacity-100 transition-all"></div>
                            <p className="text-[9px] text-[#444] mt-2 font-mono leading-relaxed group-hover:text-[#666] transition-colors">"Lantern"<br />by Sbtrkt</p>
                        </div>

                        <div
                            className="option clickable group cursor-pointer flex flex-col items-center"
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <h3 className="uppercase text-[10px] tracking-[0.2em] text-[#666] mb-5 group-hover:text-white transition-colors border-b border-transparent group-hover:border-white pb-1 underline-offset-4 font-bold">Load MP3</h3>
                            <div className="icon mp3 w-[60px] h-[78px] bg-[url('/viz/lantern/res/img/intro/music.svg')] bg-no-repeat bg-center opacity-70 group-hover:opacity-100 transition-all"></div>
                            <p className="text-[9px] text-[#444] mt-2 font-mono leading-relaxed group-hover:text-[#666] transition-colors">Click or Drag and Drop<br />MP3 file here.</p>
                            <input
                                type="file"
                                id="file-upload"
                                className="hidden"
                                accept="audio/*,.mp3"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const file = e.target.files[0];
                                        const url = URL.createObjectURL(file);
                                        const audio = new Audio(url);
                                        // Simple file play logic, skipping sequence handler for now or treat as sample
                                        if (controllerRef.current) {
                                            controllerRef.current.audio.loadAudioElement(audio);
                                            audio.play();
                                            start();
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Info Screen */}
            {showInfo && (
                <div id="info" className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-20 text-center animate-fade-in" onClick={() => setShowInfo(false)}>
                    <div id="info-inner" className="max-w-2xl text-gray-300 space-y-6">
                        <h2 className="text-2xl text-white tracking-widest uppercase mb-8">ÜberViz Live Demo</h2>
                        <p className="text-sm leading-relaxed">
                            Überviz is a generative realtime Music Visualizer. Multiple layered audio-reactive visuals automatically sync to incoming audio from the microphone or MP3. Visuals and Post-Processing FX are selected to create a non-repeating progression over time. Audio Reactivity is achieved by processing a combination of audio inputs: Volume, Frequency Levels, Audio Waveform, Beat Detection and BPM.
                        </p>
                        <div className="text-left space-y-4 mt-8 bg-white/5 p-6 rounded-lg pointer-events-auto" onClick={e => e.stopPropagation()}>
                            <h3 className="text-white uppercase tracking-wider text-xs border-b border-gray-600 pb-2">Automatic Mode</h3>
                            <p className="text-xs">By default Überviz automatically works with the incoming audio. Viz and FXs switch out based on beat detection.</p>

                            <h3 className="text-white uppercase tracking-wider text-xs border-b border-gray-600 pb-2 pt-4">Manual Mode</h3>
                            <p className="text-xs">Hit 'Q' to toggle Control Panel. Uncheck 'AUTOMATIC' for manual control. Use 'AUDIO' 'Gain' to adjust for source volume.</p>

                            <h3 className="text-white uppercase tracking-wider text-xs border-b border-gray-600 pb-2 pt-4">Credits</h3>
                            <ul className="text-xs list-disc pl-4 space-y-1">
                                <li>Sample Music is "Lantern" by Sbtrkt.</li>
                                <li>Built with Three.js, React, WebGL and Web Audio API.</li>
                                <li>Recreated by Antigravity.</li>
                            </ul>
                        </div>
                    </div>
                    <div className="close-btn mt-8 cursor-pointer text-xs uppercase tracking-widest hover:text-white text-gray-500">[ Close ]</div>
                </div>
            )}

            {/* Info Button */}
            {!showOverlay && !loading && (
                <div
                    className="absolute top-4 right-4 z-30 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                    onClick={() => setShowInfo(true)}
                >
                    <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center font-serif italic text-white">i</div>
                </div>
            )}

            {/* Info Button (Intro) */}
            {showOverlay && !loading && !showInfo && (
                <div className="absolute top-4 right-4 z-50 intro-el opacity-0">
                    <div
                        className="cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                        onClick={() => setShowInfo(true)}
                    >
                        <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center font-serif italic text-white">i</div>
                    </div>
                </div>
            )}
        </div>
    );
}
