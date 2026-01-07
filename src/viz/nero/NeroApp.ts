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
import { ControlsHandler } from './ControlsHandler';
import { createNoise2D } from 'simplex-noise';

const AudioFile = '/viz/nero/audio/Nero_In_The_Way.mp3';

export class NeroApp {
    public container: HTMLElement;
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public composer: EffectComposer;
    public clock: THREE.Clock;
    public vizHolder: THREE.Object3D;
    private animationId: number | null = null;
    private noise2D = createNoise2D();
    private noiseTime = 0;
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();
    public isPlaying = false;

    // Components
    public audioHandler: AudioHandler;
    public stars: Stars;
    public starBars: StarBars;
    public segments: Segments;
    public lightLeak: LightLeak;
    public imagePlayer: ImagePlayer;
    public displacementTube: DisplacementTube;
    public fxHandler: FXHandler;
    public controlsHandler: ControlsHandler;

    constructor(container: HTMLElement) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.z = 1000;

        this.vizHolder = new THREE.Object3D();
        this.scene.add(this.vizHolder);

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

        // Initialize Controls (dat.gui)
        this.controlsHandler = new ControlsHandler(this);

        this.initEvents();
        this.start();
    }

    private initEvents() {
        window.addEventListener('resize', this.onResize);

        // Resume Audio Context on click (modified for logo interaction)
        window.addEventListener('click', this.onClick);
        window.addEventListener('mousemove', this.onMouseMove);

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

        // Update VizHolder Rotation
        if (this.fxHandler) { // Always rotate
            this.noiseTime += 0.01 * this.fxHandler.params.tiltSpeed;
            const tiltAmount = Math.PI * this.fxHandler.params.tiltAmount;

            // Simplex noise returns -1 to 1. Original used 2D noise with (n, constant).
            this.vizHolder.rotation.x = this.noise2D(this.noiseTime, 0) * tiltAmount / 4;
            this.vizHolder.rotation.y = this.noise2D(this.noiseTime, 100) * tiltAmount;
            this.vizHolder.rotation.z = this.noise2D(this.noiseTime, 200) * tiltAmount;
        }

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

    private onClick = (event: MouseEvent) => {
        if (this.isPlaying) return;

        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObject(this.imagePlayer.getMesh());

        if (intersects.length > 0) {
            if (this.audioHandler) {
                this.audioHandler.resume();
                this.audioHandler.play();
                this.isPlaying = true;
                this.container.style.cursor = 'default';
            }
        }
    };

    private onMouseMove = (event: MouseEvent) => {
        if (this.isPlaying) return;

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObject(this.imagePlayer.getMesh());

        if (intersects.length > 0) {
            this.container.style.cursor = 'pointer';
        } else {
            this.container.style.cursor = 'default';
        }
    };

    public dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('onBeat', this.onBeat);
        window.removeEventListener('click', this.onClick);
        window.removeEventListener('mousemove', this.onMouseMove);

        if (this.controlsHandler) this.controlsHandler.dispose();

        this.container.removeChild(this.renderer.domElement);
        this.renderer.dispose();
        if (this.audioHandler) this.audioHandler.dispose();
    }
}
