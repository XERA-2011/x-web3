import {
    Scene, PerspectiveCamera, WebGLRenderer, Object3D, Fog
} from 'three';
import { Bars } from './effects/Bars';
import { WhiteRing } from './effects/WhiteRing';

export class WordProblemsApp {
    container: HTMLElement;
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;

    // Viz Holder
    vizHolder: Object3D;

    // Effects
    bars: Bars;
    whiteRing: WhiteRing;

    // Audio
    audioContext!: AudioContext;
    analyser!: AnalyserNode;
    source: AudioBufferSourceNode | null = null;
    freqByteData: Uint8Array;
    timeByteData: Uint8Array;

    volume: number = 0;
    smoothedVolume: number = 0;
    levelsData: number[] = [];
    levelBins: number = 0;
    levelsCount = 16;

    renderTime = 0;
    private isRunning = false;

    constructor(container: HTMLElement) {
        this.container = container;

        // Init Three.js
        this.camera = new PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
        this.camera.position.z = 1000;

        this.scene = new Scene();
        this.scene.fog = new Fog(0x000000, 2000, 3000);

        this.renderer = new WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        this.container.appendChild(this.renderer.domElement);

        this.vizHolder = new Object3D();
        this.scene.add(this.vizHolder);

        // Init Effects
        this.bars = new Bars(this.vizHolder);
        this.whiteRing = new WhiteRing(this.vizHolder);

        // Init Audio Props
        this.freqByteData = new Uint8Array(512);
        this.timeByteData = new Uint8Array(512);

        // Init levels data
        for (let i = 0; i < this.levelsCount; i++) this.levelsData.push(0);

        window.addEventListener('resize', this.onResize.bind(this));

        this.isRunning = true;
        this.animate();
    }

    async initAudio(url: string) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0.3;
        this.analyser.connect(this.audioContext.destination);

        this.levelBins = Math.floor(this.analyser.frequencyBinCount / this.levelsCount);

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.playBuffer(audioBuffer);
        } catch (e) {
            console.error("Error loading audio:", e);
            // Even if audio fails, we keep running
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
        // isRunning is already true
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(this.animate.bind(this));

        const dt = 1 / 60;
        this.renderTime += 0.01;

        this.updateAudio();

        // Simple beat detection
        if (this.volume > 0.4 && Math.random() < 0.1) {
            this.bars.onBeat();
            this.whiteRing.onBeat();
        }

        // Effect updates
        this.bars.update(dt, this);
        this.whiteRing.update(dt, this);

        this.renderer.render(this.scene, this.camera);
    }

    updateAudio() {
        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(this.freqByteData as any);
        this.analyser.getByteTimeDomainData(this.timeByteData as any);

        // Calculate Levels
        // normalize levelsData from freqByteData
        // Original logic from AudioHandler.js
        const volSens = 1.0; // from ControlsHandler default

        for (let i = 0; i < this.levelsCount; i++) {
            let sum = 0;
            for (let j = 0; j < this.levelBins; j++) {
                sum += this.freqByteData[(i * this.levelBins) + j];
            }
            this.levelsData[i] = sum / this.levelBins / 256 * volSens;
        }

        // Get Avg Level (Volume)
        let sum = 0;
        for (let j = 0; j < this.levelsCount; j++) {
            sum += this.levelsData[j];
        }
        this.volume = sum / this.levelsCount;
        this.smoothedVolume += (this.volume - this.smoothedVolume) / 5;
    }

    getVolume() { return this.volume; }
    getSmoothedVolume() { return this.smoothedVolume; }
    getLevelsData() { return this.levelsData; }
    getBPMTime() { return 0; } // Placeholder, original used BPMHandler, but we can treat as 0 or time

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
