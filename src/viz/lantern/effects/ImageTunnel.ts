
import {
    Scene, Object3D, PlaneGeometry, MeshBasicMaterial,
    Mesh, AdditiveBlending, TextureLoader, DoubleSide, LinearFilter
} from 'three';
import { VizEffect, VizParams } from '../core/VizEffect';
import { AudioAnalyzer } from '../core/AudioAnalyzer';
import { ATUtil } from '../core/ATUtil';
import { BPMManager } from '../core/BPMManager';

import Img0 from '../res/img/tunnel/0.jpg';
import Img1 from '../res/img/tunnel/1.jpg';
import Img2 from '../res/img/tunnel/2.jpg';

const TEXTURES = [Img0, Img1, Img2];

export class ImageTunnel implements VizEffect {
    name = "ImageTunnel";
    params = {
        on: false,
        twist: 0,
        step: true,
        opacity: 0,
        rings: 12
    };

    private holder: Object3D | null = null;
    private tunnelGroup: Object3D | null = null;
    private rings: Mesh[] = [];

    private textures: any[] = [];
    private textureCount = 3;
    private currentTextureIndex = 0;

    private material: MeshBasicMaterial | null = null;

    private ringCount = 24;
    private tunnelDepth = 2000;

    init(scene: Scene, holder: Object3D, tumbler: Object3D) {
        this.holder = holder;

        this.tunnelGroup = new Object3D();
        this.holder.add(this.tunnelGroup);

        const loader = new TextureLoader();
        for (let i = 0; i < this.textureCount; i++) {
            const img = TEXTURES[i];
            const src = (img as any).src || img;
            const texture = loader.load(src);
            texture.minFilter = LinearFilter;
            texture.magFilter = LinearFilter;
            texture.generateMipmaps = false;
            this.textures.push(texture);
        }

        this.material = new MeshBasicMaterial({
            map: this.textures[0],
            transparent: true,
            blending: AdditiveBlending,
            side: DoubleSide,
            depthTest: false,
            depthWrite: false,
            fog: true
        });

        const geometry = new PlaneGeometry(800, 800, 1, 1);

        for (let i = 0; i < this.ringCount; i++) {
            const mesh = new Mesh(geometry, this.material);
            this.tunnelGroup.add(mesh);
            this.rings.push(mesh);
        }

        this.updateParams();
        this.onToggle(this.params.on);
    }

    updateParams() {
        if (!this.material) return;
        this.material.opacity = this.params.opacity;

        for (let i = 0; i < this.ringCount; i++) {
            const ring = this.rings[i];
            if (i < this.params.rings) {
                ring.visible = true;
                ring.rotation.z = i * this.params.twist;
                ring.position.z = (i / this.params.rings) * this.tunnelDepth;
            } else {
                ring.visible = false;
            }
        }
    }

    update(dt: number, audio: AudioAnalyzer, noiseTime: number) {
        if (!this.tunnelGroup) return;

        const time = performance.now();
        const bpm = 120;
        const beatDur = 60000 / bpm;
        const bpmTime = (time % beatDur) / beatDur;

        const H = this.tunnelDepth;
        const r = this.params.rings;

        this.tunnelGroup.position.z = bpmTime * H / r - H / 2;
        this.tunnelGroup.rotation.z += 0.002;
    }

    onBeat(audio: AudioAnalyzer) {
        if (Math.random() < 0.2 && this.params.step) {
            this.currentTextureIndex = (this.currentTextureIndex + 1) % this.textureCount;
            if (this.material) this.material.map = this.textures[this.currentTextureIndex];
        }

        if (Math.random() < 0.2) {
            this.params.rings = ATUtil.randomInt(8, 16);
            this.updateParams();
        }
    }

    onBPMBeat() { }

    onToggle(active: boolean) {
        this.params.on = active;
        if (this.tunnelGroup) this.tunnelGroup.visible = active;
    }

    getParams() { return this.params; }
}
