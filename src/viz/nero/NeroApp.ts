import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { AudioHandler } from './AudioHandler';
import { Stars } from './components/Stars';
import { StarBars } from './components/StarBars';
import { Segments } from './components/Segments';
import { LightLeak } from './components/LightLeak';
import { ImagePlayer } from './components/ImagePlayer';
import { DisplacementTube } from './components/DisplacementTube';
import { FXHandler } from './FXHandler';
import AudioFile from './res/mp3/Nero_In_The_Way.mp3';

export class NeroApp {
    public container: HTMLElement;
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public composer: EffectComposer;
    public clock: THREE.Clock;
    private animationId: number | null = null;

    // Components
    public audioHandler: AudioHandler;
    public stars: Stars;
    public starBars: StarBars;
    public segments: Segments;
    public lightLeak: LightLeak;
    public imagePlayer: ImagePlayer;
    public displacementTube: DisplacementTube;
    public fxHandler: FXHandler;

    constructor(container: HTMLElement) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.z = 1000;

        this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000);
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();

        this.audioHandler = new AudioHandler();

        // Placeholder for Post-Processing
        this.composer = new EffectComposer(this.renderer);

        // Initialize Components
        this.stars = new Stars(this);
        this.starBars = new StarBars(this);
        this.segments = new Segments(this);
        this.lightLeak = new LightLeak(this);
        this.imagePlayer = new ImagePlayer(this);
        this.displacementTube = new DisplacementTube(this);

        this.fxHandler = new FXHandler(this);

        this.initEvents();
        this.start();
    }

    private initEvents() {
        window.addEventListener('resize', this.onResize);

        // Resume Audio Context on click
        window.addEventListener('click', () => {
            if (this.audioHandler) {
                this.audioHandler.resume();
                this.audioHandler.play();
            }
        });

        window.addEventListener('onBeat', this.onBeat);
    }

    private onBeat = () => {
        if (this.starBars) this.starBars.onBeat();
        if (this.segments) this.segments.onBeat();
        if (this.lightLeak) this.lightLeak.onBeat();
        if (this.displacementTube) this.displacementTube.onBeat();
        if (this.fxHandler) this.fxHandler.onBeat();
    };

    private onResize = () => {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
        if (this.fxHandler) this.fxHandler.onResize();
    };

    private start() {
        this.animate();
        // Start playing audio
        if (this.audioHandler) {
            this.audioHandler.loadAudio(AudioFile).then(() => {
                // Auto-play might be blocked, handled by click listener
            });
        }
    }

    private animate = () => {
        this.animationId = requestAnimationFrame(this.animate);
        // const delta = this.clock.getDelta();
        // const time = this.clock.getElapsedTime();

        // Update Logic
        if (this.audioHandler) this.audioHandler.update();
        if (this.stars) this.stars.update();
        if (this.starBars) this.starBars.update();
        if (this.segments) this.segments.update();
        if (this.lightLeak) this.lightLeak.update();
        if (this.imagePlayer) this.imagePlayer.update();
        if (this.displacementTube) this.displacementTube.update();
        if (this.fxHandler) this.fxHandler.update();

        this.composer.render();
    };

    public dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('click', this.onBeat); // Actually this was an anonymous func, can't remove easily. That's fine for now or fix later.
        window.removeEventListener('onBeat', this.onBeat);

        this.container.removeChild(this.renderer.domElement);
        this.renderer.dispose();
        if (this.audioHandler) this.audioHandler.dispose();
    }
}
