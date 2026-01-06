import {
    Scene, PerspectiveCamera, WebGLRenderer, Color, FogExp2
} from 'three';
import { LoopVisualizer } from './LoopVisualizer';

export class LoopApp {
    container: HTMLElement;
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;

    visualizer: LoopVisualizer;

    audioContext!: AudioContext;
    analyser!: AnalyserNode;
    source: AudioBufferSourceNode | null = null;

    freqByteData: Uint8Array;
    timeByteData: Uint8Array;

    mouseX = 0;
    mouseY = 0;
    windowHalfX = 0;
    windowHalfY = 0;

    isRunning = false;

    constructor(container: HTMLElement) {
        this.container = container;
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;

        // Init Three.js
        this.camera = new PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000000);
        this.camera.position.z = 350;

        this.scene = new Scene();
        // this.scene.fog = new FogExp2(0x000000, 0.001); // Original didn't seem to have fog in snippet

        this.renderer = new WebGLRenderer({
            antialias: false,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        container.appendChild(this.renderer.domElement);

        this.scene.add(this.camera);

        // Init Visualizer
        this.visualizer = new LoopVisualizer();
        this.scene.add(this.visualizer.loopHolder);
        this.visualizer.init();

        // Init Audio Props
        const BIN_COUNT = 512;
        this.freqByteData = new Uint8Array(BIN_COUNT);
        this.timeByteData = new Uint8Array(BIN_COUNT);

        // Listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this));
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

        if (this.analyser) {
            this.visualizer.update(this.analyser, this.freqByteData, this.timeByteData);
        }

        this.visualizer.updateTilt(this.mouseX, this.mouseY, window.innerWidth, window.innerHeight);
        this.renderer.render(this.scene, this.camera);
    }

    onDocumentMouseMove(event: MouseEvent) {
        this.mouseX = (event.clientX - this.windowHalfX) * 2;
        this.mouseY = (event.clientY - this.windowHalfY) * 2;
    }

    onWindowResize() {
        this.windowHalfX = window.innerWidth / 2;
        this.windowHalfY = window.innerHeight / 2;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    dispose() {
        this.isRunning = false;
        if (this.source) {
            this.source.stop();
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.visualizer.remove();
        this.renderer.dispose();
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        document.removeEventListener('mousemove', this.onDocumentMouseMove.bind(this));
    }
}
