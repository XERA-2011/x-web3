import {
    Scene, PerspectiveCamera, WebGLRenderer, Object3D
} from 'three';
import { Ripples } from './effects/Ripples';
import { ImagePlayer } from './effects/ImagePlayer';

export class BbngApp {
    container: HTMLElement;
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;

    // Viz Holder
    vizHolder: Object3D;

    // Effects
    ripples: Ripples;
    imagePlayer: ImagePlayer;

    // Audio
    audioContext!: AudioContext;
    analyser!: AnalyserNode;
    source: AudioBufferSourceNode | null = null;
    freqByteData: Uint8Array;
    timeByteData: Uint8Array;

    volume: number = 0;
    smoothedVolume: number = 0;

    renderTime = 0;
    private isRunning = false;

    constructor(container: HTMLElement) {
        this.container = container;

        // Init Three.js
        this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 4000);
        this.camera.position.z = 1000;

        this.scene = new Scene();
        this.renderer = new WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        this.container.appendChild(this.renderer.domElement);

        this.vizHolder = new Object3D();
        this.scene.add(this.vizHolder);

        // Init Effects
        this.ripples = new Ripples(this.vizHolder);
        this.imagePlayer = new ImagePlayer(this);

        // Init Audio Props
        this.freqByteData = new Uint8Array(512);
        this.timeByteData = new Uint8Array(512);

        window.addEventListener('resize', this.onResize.bind(this));
    }

    async initAudio(url: string) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0.1;
        this.analyser.connect(this.audioContext.destination);

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.playBuffer(audioBuffer);
        } catch (e) {
            console.error("Error loading audio:", e);
        }
    }

    playBuffer(buffer: AudioBuffer) {
        if (this.source) {
            this.source.stop();
            this.source.disconnect();
        }
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = buffer;
        this.source.loop = true;
        this.source.connect(this.analyser);
        this.source.start(0);
        this.isRunning = true;
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(this.animate.bind(this));

        const dt = 1 / 60; // Approximate
        this.renderTime += 0.01;

        // Audio update
        this.analyser.getByteFrequencyData(this.freqByteData as any);
        let sum = 0;
        for (let i = 0; i < this.freqByteData.length; i++) {
            sum += this.freqByteData[i];
        }
        this.volume = sum / this.freqByteData.length / 256;
        this.smoothedVolume += (this.volume - this.smoothedVolume) * 0.1;

        // Beat detection (Simple)
        // If volume rises significantly, trigger onBeat
        // (Simplified for portability. Real robust detection requires more logic)
        // BBNG used BPMHandler and manual beat triggers probably, or audio threshold.
        // Let's rely on simple random-ish calls in effects for now or implement better simple detection.
        // Original Ripples.js had onBeat trigger "Jump ripple posn".

        // Simple threshold beat detect
        if (this.volume > 0.4 && Math.random() < 0.1) { // Pseudo-beat
            this.ripples.onBeat();
            this.imagePlayer.onBeat();
        }

        // Effect updates
        this.ripples.update(dt, this);
        this.imagePlayer.update(dt, this);

        this.renderer.render(this.scene, this.camera);
    }

    getVolume() { return this.volume; }
    getSmoothedVolume() { return this.smoothedVolume; }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.isRunning = false;
        if (this.source) this.source.stop();
        if (this.audioContext) this.audioContext.close();
        this.renderer.dispose();
        window.removeEventListener('resize', this.onResize.bind(this));
    }
}
