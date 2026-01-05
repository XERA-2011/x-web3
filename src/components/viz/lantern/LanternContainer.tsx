
'use client';

import React, { useEffect, useRef, useState } from 'react';
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
            setLoading(false);
            animate();
        });

        let animationId: number;
        const animate = () => {
            controller.update();
            animationId = requestAnimationFrame(animate);
        };

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, []);

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

            // Fade in from black (original: TweenMax.fromTo brightness -1 to 0)
            ctrl.fx.passes.super.uniforms.brightness.value = -1;
            const fadeIn = () => {
                const bv = ctrl.fx.passes.super.uniforms.brightness.value;
                if (bv < 0) {
                    ctrl.fx.passes.super.uniforms.brightness.value = Math.min(bv + 0.02, 0);
                    requestAnimationFrame(fadeIn);
                }
            };
            fadeIn();
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

            // Fade in from black
            ctrl.fx.passes.super.uniforms.brightness.value = -1;
            const fadeIn = () => {
                const bv = ctrl.fx.passes.super.uniforms.brightness.value;
                if (bv < 0) {
                    ctrl.fx.passes.super.uniforms.brightness.value = Math.min(bv + 0.02, 0);
                    requestAnimationFrame(fadeIn);
                }
            };
            fadeIn();
        }
    };

    const handleLoadMp3 = (e: React.DragEvent) => {
        e.preventDefault();
        // Implement drag drop if possible, or just click
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white select-none">
            <div ref={containerRef} className="absolute inset-0 z-0 bg-black" />

            {/* Loading */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black">
                    <img src="/viz/lantern/res/img/intro/loader.gif" alt="Loading..." />
                </div>
            )}

            {/* Intro Overlay */}
            {showOverlay && !loading && (
                <div
                    id="intro"
                    className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center animate-fade-in"
                // Transparent background as requested
                >
                    <h1 className="mb-4">
                        <img src="/viz/lantern/res/img/intro/logo-400.png" alt="ÜberViz" className="w-[400px] h-auto" />
                    </h1>
                    <h2 className="text-sm tracking-[0.3em] font-light text-gray-300 mb-8 uppercase text-shadow">Realtime Music Visualizer</h2>

                    <div id="prompt" className="text-xs text-gray-500 mb-12 uppercase tracking-wide opacity-50 hidden">Drop MP3 here</div>

                    <div id="sound-options" className="flex gap-12 text-center">
                        <div className="option clickable group cursor-pointer" onClick={handleStartMic}>
                            <h3 className="uppercase text-xs tracking-widest text-gray-400 mb-4 group-hover:text-white transition-colors border-b border-transparent group-hover:border-white pb-1">Use Microphone</h3>
                            <div className="icon mic w-[60px] h-[60px] bg-[url('/viz/lantern/res/img/intro/mic.svg')] bg-no-repeat bg-center opacity-70 group-hover:opacity-100 transition-all mx-auto"></div>
                        </div>

                        <div className="option clickable group cursor-pointer" onClick={handleSample}>
                            <h3 className="uppercase text-xs tracking-widest text-gray-400 mb-4 group-hover:text-white transition-colors border-b border-transparent group-hover:border-white pb-1">Play Sample Music</h3>
                            <div className="icon play w-[60px] h-[60px] bg-[url('/viz/lantern/res/img/intro/controller-play.svg')] bg-no-repeat bg-center opacity-70 group-hover:opacity-100 transition-all mx-auto"></div>
                            <p className="text-[10px] text-gray-500 mt-2 font-mono">"Lantern"<br />by Sbtrkt</p>
                        </div>

                        <div className="option group cursor-not-allowed opacity-50">
                            <h3 className="uppercase text-xs tracking-widest text-gray-400 mb-4">Load MP3</h3>
                            <div className="icon mp3 w-[60px] h-[60px] mx-auto bg-gray-800 rounded-full flex items-center justify-center text-xs">MP3</div>
                            <p className="text-[10px] text-gray-500 mt-2 font-mono">Drag and Drop<br />MP3 file here.</p>
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
                <div
                    className="absolute top-4 right-4 z-50 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                    onClick={() => setShowInfo(true)}
                >
                    <div className="w-8 h-8 rounded-full border border-white flex items-center justify-center font-serif italic text-white">i</div>
                </div>
            )}
        </div>
    );
}
