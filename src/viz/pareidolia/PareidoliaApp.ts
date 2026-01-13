import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { MirrorShader } from './shaders/MirrorShader';
import { GlitchPass } from './shaders/GlitchPass';
import { mBox } from './components/mBox';

// Assets
const StarsImg = '/viz/pareidolia/img/stars.jpg';
const StripesImg = '/viz/pareidolia/img/stripes.jpg';
const Stripes2Img = '/viz/pareidolia/img/stripes2.jpg';

import { TextureLoader } from 'three';

export class PareidoliaApp {
    private container: HTMLElement;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private composer!: EffectComposer;
    private clock: THREE.Clock;
    private animationId: number | null = null;

    // Audio
    private audioContext: AudioContext;
    private analyser: AnalyserNode;
    private dataArray: Uint8Array;
    private isAudioInitialized = false;

    // Objects
    private boxes: mBox[] = [];
    private holder: THREE.Object3D;
    private bgStars!: THREE.Mesh;
    private bgStripes!: THREE.Mesh;

    // Effects
    private glitchPass!: GlitchPass;
    private rgbPass!: ShaderPass;
    private mirrorPass!: ShaderPass;

    private params = {
        mirror: false,
        glitch: false,
        rgbShift: false,
        shake: 0
    };

    constructor(container: HTMLElement) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000000, 1000, 5000);

        this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
        this.camera.position.z = 1000;

        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();

        this.holder = new THREE.Object3D();
        this.scene.add(this.holder);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(0, 1, 1).normalize();
        this.scene.add(dirLight);

        // Init Audio
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        this.initObjects();
        this.initPostProcessing();

        window.addEventListener('resize', this.onResize);
        this.animate();
    }

    private initObjects() {
        // Shared Geometry & Material for Boxes
        const cubesize = 100;

        const geometry = new THREE.BoxGeometry(cubesize, cubesize, cubesize);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgTextureBoxes = new TextureLoader().load((StripesImg as any).src || StripesImg);
        const cubeMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            specular: 0x999999,
            shininess: 30,
            flatShading: true,
            map: imgTextureBoxes
        });

        // Boxes
        for (let i = 0; i < 50; i++) {
            const box = new mBox(this.holder, geometry, cubeMaterial);
            this.boxes.push(box);
        }

        // Backgrounds
        const bgGeom = new THREE.PlaneGeometry(8000, 4000);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgTextureStars = new TextureLoader().load((StarsImg as any).src || StarsImg);
        const bgMatStars = new THREE.MeshBasicMaterial({ map: imgTextureStars, side: THREE.DoubleSide });
        this.bgStars = new THREE.Mesh(bgGeom, bgMatStars);
        this.bgStars.position.z = -2000;
        this.scene.add(this.bgStars);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgTextureStripes2 = new TextureLoader().load((Stripes2Img as any).src || Stripes2Img);
        const bgMatStripes = new THREE.MeshBasicMaterial({ map: imgTextureStripes2, side: THREE.DoubleSide, transparent: true, blending: THREE.AdditiveBlending });
        this.bgStripes = new THREE.Mesh(bgGeom, bgMatStripes);
        this.bgStripes.position.z = -1800;
        this.scene.add(this.bgStripes);


        // Center Beams (Optional - replicating original main.js logic roughly)
        const beamGeom = new THREE.PlaneGeometry(100, 4000);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgTextureStripes = new TextureLoader().load((StripesImg as any).src || StripesImg);
        const beamMat = new THREE.MeshBasicMaterial({ map: imgTextureStripes, side: THREE.DoubleSide, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.3 });

        const beam1 = new THREE.Mesh(beamGeom, beamMat);
        beam1.rotation.y = Math.PI / 2;
        this.scene.add(beam1);
    }

    private initPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        // Mirror
        this.mirrorPass = new ShaderPass(MirrorShader);
        this.mirrorPass.enabled = false;
        this.composer.addPass(this.mirrorPass);

        // RGB Shift
        this.rgbPass = new ShaderPass(RGBShiftShader);
        this.rgbPass.uniforms['amount'].value = 0.005;
        this.rgbPass.enabled = false;
        this.composer.addPass(this.rgbPass);

        // Glitch
        this.glitchPass = new GlitchPass();
        this.glitchPass.goWild = false;
        this.glitchPass.enabled = false;
        this.composer.addPass(this.glitchPass);
    }

    async initAudio(url: string) {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.loop = true;
            source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            source.start(0);

            this.isAudioInitialized = true;
        } catch (e) {
            console.error(e);
        }
    }

    triggerEffect() {
        this.params.glitch = true;
        this.glitchPass.enabled = true;
        this.glitchPass.goWild = true;
        this.params.mirror = true;
        this.mirrorPass.enabled = true;
    }

    stopEffect() {
        this.params.glitch = false;
        this.glitchPass.enabled = false;
        this.glitchPass.goWild = false;
        this.params.mirror = false;
        this.mirrorPass.enabled = false;
    }

    private onResize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    private animate = () => {
        this.animationId = requestAnimationFrame(this.animate);

        if (this.isAudioInitialized) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            this.analyser.getByteFrequencyData(this.dataArray as any);
        }

        const time = this.clock.getElapsedTime();
        let vol = 0;
        if (this.dataArray) {
            vol = this.dataArray[0] / 256.0; // Rough volume
        }

        // Rotate scene slightly
        this.holder.rotation.y += 0.002;
        this.holder.rotation.x = Math.sin(time * 0.5) * 0.1;

        // Update Boxes
        this.boxes.forEach(box => box.update(vol));

        // Shake effect
        if (this.params.glitch) {
            this.camera.position.x += (Math.random() - 0.5) * 20;
            this.camera.position.y += (Math.random() - 0.5) * 20;
        } else {
            // Reset cam roughly
            this.camera.position.x += (0 - this.camera.position.x) * 0.1;
            this.camera.position.y += (0 - this.camera.position.y) * 0.1;
        }

        this.composer.render();
    }

    dispose() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.renderer.dispose();
        this.audioContext.close();
        window.removeEventListener('resize', this.onResize);
    }
}
