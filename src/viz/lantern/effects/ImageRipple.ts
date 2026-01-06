
import {
    Scene, Object3D, PlaneGeometry, ShaderMaterial,
    Mesh, AdditiveBlending, TextureLoader, DoubleSide
} from 'three';
import { VizEffect, VizParams } from '../core/VizEffect';
import { AudioAnalyzer } from '../core/AudioAnalyzer';
import { ImageRippleShader } from '../shaders/Shaders';
import { gsap } from 'gsap';

import Img0 from '../res/img/img-overlay/sbtrkt/0.jpg';
import Img1 from '../res/img/img-overlay/sbtrkt/1.jpg';
import Img2 from '../res/img/img-overlay/sbtrkt/2.jpg';
import Img3 from '../res/img/img-overlay/sbtrkt/3.jpg';
import Img4 from '../res/img/img-overlay/sbtrkt/4.jpg';
import Img5 from '../res/img/img-overlay/sbtrkt/5.jpg';

const TEXTURES = [Img0, Img1, Img2, Img3, Img4, Img5];

export class ImageRipple implements VizEffect {
    name = "ImageRipple";
    params = {
        on: false,
        freak: false,
        step: true,
        size: 0.8,
        strobe: false,
        autoHide: false,
        audioDepth: 900,
        numStrips: 30
    };

    private mesh: Mesh | null = null;
    private material: ShaderMaterial | null = null;
    private holder: Object3D | null = null;

    private textures: any[] = [];
    private textureCount = 6;
    private currentTextureIndex = 0;

    private isStrobing = false;
    private toggleState = true;

    init(scene: Scene, holder: Object3D, tumbler: Object3D) {
        this.holder = tumbler;

        const loader = new TextureLoader();
        for (let i = 0; i < this.textureCount; i++) {
            const img = TEXTURES[i];
            const src = (img as any).src || img;
            this.textures.push(loader.load(src));
        }

        this.material = new ShaderMaterial({
            uniforms: {
                tMap: { value: this.textures[0] },
                audioDepth: { value: 400.0 },
                levels: { value: [] },
                numStrips: { value: 60.0 },
                opacity: { value: 1.0 }
            },
            vertexShader: ImageRippleShader.vertexShader,
            fragmentShader: ImageRippleShader.fragmentShader,
            side: DoubleSide,
            blending: AdditiveBlending,
            depthTest: false,
            transparent: true
        });

        const geometry = new PlaneGeometry(800, 600, 100, 100);
        this.mesh = new Mesh(geometry, this.material);
        this.mesh.position.z = 100;

        this.mesh.scale.set(3, 3, 3);

        this.holder.add(this.mesh);
        this.onToggle(this.params.on);
    }

    update(dt: number, audio: AudioAnalyzer, noiseTime: number) {
        if (!this.mesh || !this.material) return;

        this.material.uniforms.audioDepth.value = this.params.audioDepth;

        const history = audio.smoothedVolumeHistory.slice(0, 100);
        this.material.uniforms.levels.value = history;

        const s = (audio.smoothedVolume * audio.smoothedVolume * 1.5 + 0.4) * this.params.size;
        this.mesh.scale.set(s, s, s);

        this.material.uniforms.numStrips.value = this.params.numStrips;

        if (this.params.strobe) {
            this.toggleState = !this.toggleState;
            this.material.uniforms.opacity.value = this.toggleState ? 0 : 1;
        } else {
            this.material.uniforms.opacity.value = 1;
        }
    }

    onBeat(audio: AudioAnalyzer) {
        if (this.params.step) {
            this.currentTextureIndex = (this.currentTextureIndex + 1) % this.textureCount;
            if (this.material) this.material.uniforms.tMap.value = this.textures[this.currentTextureIndex];
        }

        if (this.params.on && this.params.autoHide) {
            if (this.mesh) this.mesh.visible = Math.random() < 0.5;
        }
    }

    onBPMBeat() { }

    onToggle(active: boolean) {
        this.params.on = active;
        if (this.mesh) this.mesh.visible = active;
    }

    getParams() { return this.params; }
}
