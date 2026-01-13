
import {
    Scene, Object3D, PointsMaterial, Points,
    TextureLoader, AdditiveBlending, Color,
    BufferGeometry, Float32BufferAttribute, LinearFilter
} from 'three';
import { VizEffect } from '../core/VizEffect';
import { AudioAnalyzer } from '../core/AudioAnalyzer';
import { createNoise2D } from 'simplex-noise';
import { ATUtil } from '../core/ATUtil';
import ParticleImg from '../res/img/particle.png';

export class Stars implements VizEffect {
    name = "Stars";
    params = {
        on: true,
        size: 1.5,
        speed: 1,
        opacity: 0.5
    };

    private mesh: Points | null = null;
    private material: PointsMaterial | null = null;
    private geometry: BufferGeometry | null = null;
    private holder: Object3D | null = null;

    private noise2D = createNoise2D();
    private noiseTime = 0;

    private particleCount = 600;
    private particleData: { initPos: number }[] = [];

    init(scene: Scene, holder: Object3D, tumbler: Object3D) {
        this.holder = tumbler;

        // Geometry
        const positions: number[] = [];
        const range = 1000;

        for (let i = 0; i < this.particleCount; i++) {
            const x = ATUtil.randomRange(-range, range);
            const y = ATUtil.randomRange(-range, range);
            const z = ATUtil.randomRange(-range, range);
            positions.push(x, y, z);

            this.particleData.push({ initPos: Math.random() });
        }

        this.geometry = new BufferGeometry();
        this.geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

        // Texture
        const loader = new TextureLoader();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imgSrc = (ParticleImg as any).src || ParticleImg;
        const texture = loader.load(imgSrc);
        texture.minFilter = LinearFilter;
        texture.magFilter = LinearFilter;
        texture.generateMipmaps = false;

        this.material = new PointsMaterial({
            size: 100,
            map: texture,
            blending: AdditiveBlending,
            depthTest: false,
            transparent: true,
            opacity: 1,
        });

        this.material.color = new Color(0xffffff);

        this.mesh = new Points(this.geometry, this.material);
        this.mesh.position.z = -500;

        this.holder.add(this.mesh);
        this.onToggle(this.params.on);
    }

    update(dt: number, audio: AudioAnalyzer, noiseTime: number) {
        if (!this.mesh || !this.geometry || !this.material) return;

        const l = (this.noise2D(noiseTime / 5, 0) + 1) / 2;
        this.material.color.setHSL(l, 0.8, 0.8);

        this.material.opacity = this.params.opacity;
        this.material.size = 10 * this.params.size;

        const positions = this.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < this.particleCount; i++) {
            const particle = this.particleData[i];
            const t = (particle.initPos + noiseTime * this.params.speed / 10) % 1;
            const z = t * 3000 - 1000;  // Range -1000 to 2000

            positions[i * 3 + 2] = z;
        }

        this.geometry.attributes.position.needsUpdate = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBeat(_audio: AudioAnalyzer) { }
    onBPMBeat() { }

    onToggle(active: boolean) {
        this.params.on = active;
        if (this.mesh) this.mesh.visible = active;
    }

    getParams() { return this.params; }
}
