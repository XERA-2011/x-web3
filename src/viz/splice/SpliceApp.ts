import {
    Scene, PerspectiveCamera, WebGLRenderer, Object3D, Fog, Vector2
} from 'three';
import { SpliceViz } from './SpliceViz';
import { ClipBoxes } from './effects/ClipBoxes';
import { Rails } from './effects/Rails';
import { ImprovedNoise } from '../../viz/loop/ImprovedNoise';
import { SpliceData } from './SpliceData';

export class SpliceApp {
    container: HTMLElement;
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    vizHolder: Object3D;

    // Effects
    clipBoxes: ClipBoxes;
    rails: Rails;
    spliceViz: SpliceViz;

    // Audio
    audioContext!: AudioContext;
    analyser!: AnalyserNode;
    source: AudioBufferSourceNode | null = null;
    startTime = 0;

    private isRunning = false;
    private loaded = false;

    // Camera Logic
    private simplexNoise = new ImprovedNoise();
    private CAMERA_LAG_OFFSET = 0.0038;

    constructor(container: HTMLElement) {
        this.container = container;

        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        this.scene = new Scene();
        this.scene.fog = new Fog(0x000000, 0, 1200);

        this.renderer = new WebGLRenderer({});
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        this.container.appendChild(this.renderer.domElement);

        this.vizHolder = new Object3D();
        this.scene.add(this.vizHolder);

        // Init Effects
        this.clipBoxes = new ClipBoxes(this.vizHolder);
        this.rails = new Rails(this.vizHolder);

        // Init Logic
        this.spliceViz = new SpliceViz(this.scene, this.clipBoxes, this.rails);

        window.addEventListener('resize', this.onResize.bind(this));
    }

    async init(audioUrl: string, seqUrl: string) {
        // Load Seq
        const seqRes = await fetch(seqUrl);
        const seqData = await seqRes.json();
        this.spliceViz.onSequenceLoaded(seqData);
        this.loaded = true;

        // Init Audio
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        try {
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.playBuffer(audioBuffer);
        } catch (e) {
            console.error("Error loading audio:", e);
        }
    }

    playBuffer(buffer: AudioBuffer) {
        if (!this.loaded) return;

        this.source = this.audioContext.createBufferSource();
        this.source.buffer = buffer;
        this.source.loop = false; // Usually true? Scream checks `trackDuration`.
        this.source.connect(this.audioContext.destination);

        this.startTime = this.audioContext.currentTime;
        this.source.start(0);
        this.isRunning = true;
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;
        requestAnimationFrame(this.animate.bind(this));

        const currentTime = this.audioContext.currentTime - this.startTime;
        const duration = SpliceData.trackDuration;
        const songPos = currentTime / duration;

        const spline = SpliceData.splineCurve;
        if (!spline) return;

        // Camera Logic
        const camPos = songPos - this.CAMERA_LAG_OFFSET;

        if (camPos < 0) {
            this.camera.position.copy(spline.getPoint(0));
            this.camera.position.z += camPos * 30000;
        } else if (camPos <= 1) {
            this.camera.position.copy(spline.getPoint(camPos));
        }

        // LookAt
        if (songPos + 0.00001 <= 1) {
            this.camera.lookAt(spline.getPoint(songPos + 0.00001));
        }

        // Noise Rotation
        const noise = this.simplexNoise.noise(songPos * 20, 0, 0);
        this.camera.rotation.z = noise * Math.PI;

        // Updates
        this.clipBoxes.update(currentTime);

        this.renderer.render(this.scene, this.camera);
    }

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
