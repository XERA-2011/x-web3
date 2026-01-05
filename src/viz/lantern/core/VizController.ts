import {
    Scene, PerspectiveCamera, WebGLRenderer, Object3D, Fog
} from 'three';
import { AudioAnalyzer } from './AudioAnalyzer';
import { ConfigManager } from './ConfigManager';
import { FXManager } from './FXManager';
import { BPMManager } from './BPMManager';
import { VizEffect } from './VizEffect';
import { SequenceHandler } from './SequenceHandler';
import { createNoise2D } from 'simplex-noise';
import { ColorWheel } from '../effects/ColorWheel';
import { Ripples } from '../effects/Ripples';
import { Stars } from '../effects/Stars';
import { StarBars } from '../effects/StarBars';
import { Eclipse } from '../effects/Eclipse';
import { LightLeak } from '../effects/LightLeak';
import { ImageTunnel } from '../effects/ImageTunnel';
import { ImageRipple } from '../effects/ImageRipple';
import { Crystal } from '../effects/Crystal';

export class VizController {
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;

    holder: Object3D;
    tumbler: Object3D;

    audio: AudioAnalyzer;
    config: ConfigManager;
    fx: FXManager;
    bpm: BPMManager;
    sequence: SequenceHandler;

    effects: VizEffect[] = [];

    noise2D = createNoise2D();
    noiseTime = 0;
    tumblerProgress = 0;
    autoMode = true;

    private container: HTMLElement | null = null;

    constructor() {
        this.config = new ConfigManager();
        this.audio = new AudioAnalyzer();
        this.bpm = new BPMManager();

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(70, 1, 1, 4000);
        this.camera.position.z = 1000;

        this.renderer = new WebGLRenderer({ alpha: false });
        this.renderer.setClearColor(0x000000);
        this.renderer.sortObjects = false;

        this.holder = new Object3D();
        this.tumbler = new Object3D();
        this.holder.add(this.tumbler);
        this.scene.add(this.holder);

        this.fx = new FXManager(this.scene, this.camera, this.renderer);
        this.sequence = new SequenceHandler(this);

        // Register Effects
        this.addEffect(new ColorWheel());
        this.addEffect(new Ripples());
        this.addEffect(new Stars());
        this.addEffect(new StarBars());
        this.addEffect(new Eclipse());
        this.addEffect(new LightLeak());
        this.addEffect(new ImageTunnel());
        this.addEffect(new ImageRipple());
        this.addEffect(new Crystal());
    }

    async init(container: HTMLElement) {
        this.container = container;
        await this.config.load();

        this.camera.aspect = this.config.config.displayWidth / this.config.config.displayHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        this.scene.fog = new Fog(0x000000, 0, 2000);

        this.audio.init();
        this.fx.init();

        // Initialize Effects
        this.effects.forEach(eff => eff.init(this.scene, this.holder, this.tumbler));

        // Listeners
        this.audio.events.onBeat = () => this.onBeat();
        this.bpm.events.onBPMBeat = () => this.effects.forEach(e => e.onBPMBeat());

        // Sequence Init
        const seq = new (await import('./SequenceHandler')).SequenceHandler(this);
        seq.init();

        window.addEventListener('resize', this.onResize.bind(this));
        this.onResize();
    }

    addEffect(effect: VizEffect) {
        this.effects.push(effect);
    }

    getEffect(name: string) {
        return this.effects.find(e => e.name === name);
    }

    onResize() {
        if (!this.container) return;
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.fx.resize(width, height);
    }

    update() {
        this.noiseTime += 0.01;
        this.audio.update();
        this.sequence.update(); // Check for sequence transitions

        // AutoMode: dynamically adjust tilt (from original VizHandler.update)
        if (this.autoMode) {
            this.fx.params.tiltAmount = (this.noise2D(this.noiseTime / 20, 99) + 1) / 2 * 0.25;
            this.fx.params.tiltSpeed = (this.noise2D(this.noiseTime / 20, 9999) + 1) / 2 * 0.25;
        }

        // Move Tumbler
        this.tumblerProgress += 0.01 * this.fx.params.tiltSpeed;

        const tiltAmount = Math.PI * this.fx.params.tiltAmount;
        this.tumbler.rotation.x = this.noise2D(this.tumblerProgress, 0) * tiltAmount / 4;
        this.tumbler.rotation.y = this.noise2D(this.tumblerProgress, 100) * tiltAmount;
        this.tumbler.rotation.z = this.noise2D(this.tumblerProgress, 200) * tiltAmount;

        this.effects.forEach(eff => {
            if (eff.getParams().on) {
                eff.update(1, this.audio, this.noiseTime);
            }
        });

        this.fx.update(1, this.audio);
    }

    onBeat() {
        this.effects.forEach(e => e.onBeat(this.audio));
        this.fx.onBeat();
    }
}
