import {
    Scene, PerspectiveCamera, WebGLRenderer, Object3D, Fog, Vector2
} from 'three';
import { FXHandler } from './FXHandler';
import { SpliceViz } from './SpliceViz';
import { ClipBoxes } from './effects/ClipBoxes';
import { Rails } from './effects/Rails';
import { Tubes } from './effects/Tubes';
import { Stars } from './components/Stars';
import { SkyBox } from './components/SkyBox';
import { ImprovedNoise } from '../../viz/loop/ImprovedNoise';
import { SpliceData } from './SpliceData';
import gsap from 'gsap';

export class SpliceApp {
    container: HTMLElement;
    scene: Scene;
    camera: PerspectiveCamera;
    renderer: WebGLRenderer;
    vizHolder: Object3D;

    // Effects
    clipBoxes: ClipBoxes;
    rails: Rails;
    tubes: Tubes;
    stars: Stars;
    skyBox: SkyBox;
    spliceViz: SpliceViz;
    fxHandler: FXHandler;

    // Audio
    audioContext!: AudioContext;
    analyser!: AnalyserNode;
    source: AudioBufferSourceNode | null = null;
    startTime = 0;

    private isPlaying = false; // Audio playing state
    private isRendering = false; // Render loop state
    private loaded = false;

    // Camera Logic
    private simplexNoise = new ImprovedNoise();
    private CAMERA_LAG_OFFSET = 0.0038;

    // Mouse Interaction
    private mousePos = new Vector2(0, 0);
    private camOffset = new Vector2(0, 0);
    private CAM_RANGE = 70;

    constructor(container: HTMLElement) {
        this.container = container;

        // INIT 3D SCENE
        this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
        this.scene = new Scene();
        this.scene.add(this.camera);

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
        this.tubes = new Tubes(this);
        this.stars = new Stars(this);
        this.skyBox = new SkyBox(this);

        // Init Logic
        this.spliceViz = new SpliceViz(this, this.clipBoxes, this.rails);
        this.fxHandler = new FXHandler(this);

        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
    }

    private onMouseMove(event: MouseEvent) {
        this.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    async init(seqUrl: string) {
        // Load Seq
        const seqRes = await fetch(seqUrl);
        const seqData = await seqRes.json();
        this.spliceViz.onSequenceLoaded(seqData);

        // Init tubes after sequence loaded (needs spline)
        this.tubes.init();

        // Start rendering loop immediately
        if (!this.isRendering) {
            this.isRendering = true;
            this.animate();
        }

        // Fade Up
        gsap.to(this.fxHandler.params, { brightness: 0, duration: 2, ease: "power1.out" });
    }

    async loadAudio(audioUrl: string) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        try {
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            // Prepare source but don't play
            this.prepareSource(audioBuffer);
            this.loaded = true;
        } catch (e) {
            console.error("Error loading audio:", e);
        }
    }

    private prepareSource(buffer: AudioBuffer) {
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = buffer;
        this.source.loop = false;
        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
    }

    play() {
        if (!this.loaded || !this.source || !this.audioContext) return;

        // Resume context if suspended (browser directive)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.startTime = this.audioContext.currentTime;
        this.source.start(0);
        this.isPlaying = true;
    }


    animate() {
        if (!this.isRendering) return;
        requestAnimationFrame(this.animate.bind(this));

        let currentTime = 0;
        if (this.isPlaying && this.audioContext) {
            currentTime = this.audioContext.currentTime - this.startTime;
        }

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

        // Apply Mouse Offset logic
        this.camOffset.x += (this.mousePos.x - this.camOffset.x) * 0.1;
        this.camOffset.y += (this.mousePos.y - this.camOffset.y) * 0.1;
        this.camera.position.x += this.camOffset.x * this.CAM_RANGE;
        this.camera.position.y += this.camOffset.y * this.CAM_RANGE;

        // LookAt
        if (songPos + 0.00001 <= 1) {
            this.camera.lookAt(spline.getPoint(songPos + 0.00001));
        }

        // Noise Rotation
        const noise = this.simplexNoise.noise(songPos * 20, 0, 0);
        this.camera.rotation.z = noise * Math.PI;

        // Updates
        this.clipBoxes.update(currentTime);
        this.spliceViz.update(songPos);
        this.stars.update();
        this.skyBox.update();
        this.tubes.update();

        this.fxHandler.update();
    }

    getSmoothedVolume(): number {
        if (!this.analyser) return 0;
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        return sum / dataArray.length / 256;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.fxHandler) this.fxHandler.resize();
    }

    dispose() {
        this.isRendering = false;
        this.isPlaying = false;
        if (this.source) this.source.stop();
        if (this.audioContext) this.audioContext.close();
        this.renderer.dispose();
        window.removeEventListener('resize', this.onResize.bind(this));
    }
}
