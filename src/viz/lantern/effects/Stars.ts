
import {
    Scene, Object3D, PointsMaterial, Points,
    Vector3, TextureLoader, AdditiveBlending, Color,
    BufferGeometry, Float32BufferAttribute
} from 'three';
import { VizEffect, VizParams } from '../core/VizEffect';
import { AudioAnalyzer } from '../core/AudioAnalyzer';
import { createNoise2D } from 'simplex-noise';
import { ATUtil } from '../core/ATUtil';

export class Stars implements VizEffect {
    name = "Stars";
    params = {
        on: true,
        size: 1.5,    // Original default
        speed: 1,     // Original default
        opacity: 0.5  // Original default
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
        this.holder = tumbler; // Original: VizHandler.getVizTumbler().add(s)

        // Geometry
        const positions: number[] = [];
        const range = 1000;

        for (let i = 0; i < this.particleCount; i++) {
            const x = ATUtil.randomRange(-range, range);
            const y = ATUtil.randomRange(-range, range);
            const z = ATUtil.randomRange(-range, range);
            positions.push(x, y, z);

            // Original: var f={initPos:Math.random()}; c.push(f)
            this.particleData.push({ initPos: Math.random() });
        }

        this.geometry = new BufferGeometry();
        this.geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

        // Texture - Original: THREE.ImageUtils.loadTexture("res/img/particle.png")
        const loader = new TextureLoader();
        const texture = loader.load('/viz/lantern/res/img/particle.png');

        // Original material settings:
        // size: 100, map: texture, blending: AdditiveBlending, 
        // depthTest: false, transparent: true, opacity: 1
        this.material = new PointsMaterial({
            size: 100,  // Base size, will be multiplied in update
            map: texture,
            blending: AdditiveBlending,
            depthTest: false,
            transparent: true,
            opacity: 1,
            // sizeAttenuation: true // default true
        });

        // Original: r.color = new THREE.Color(0xffffff); r.color.setHSL(...)
        this.material.color = new Color(0xffffff);

        this.mesh = new Points(this.geometry, this.material);
        this.mesh.position.z = -500; // Original: particles.position.z = -500

        this.holder.add(this.mesh);
        this.onToggle(this.params.on);
    }

    update(dt: number, audio: AudioAnalyzer, noiseTime: number) {
        if (!this.mesh || !this.geometry || !this.material) return;

        // Increment noise time (original: VizHandler.getNoiseTime() increments by 0.01)
        this.noiseTime += 0.01;

        // Original color logic:
        // l = (simplexNoise.noise(VizHandler.getNoiseTime()/5, 0, 0) + 1) / 2
        // r.color.setHSL(l, 0.8, 0.8)
        const l = (this.noise2D(this.noiseTime / 5, 0) + 1) / 2;
        this.material.color.setHSL(l, 0.8, 0.8);

        // Original: r.opacity = d.opacity
        this.material.opacity = this.params.opacity;

        // Original: r.size = 10 * d.size
        this.material.size = 10 * this.params.size;

        // Update positions
        // Original: t = (n.initPos + VizHandler.getNoiseTime() * d.speed / 10) % 1 * 3e3 - 1e3
        const positions = this.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < this.particleCount; i++) {
            const particle = this.particleData[i];
            const t = (particle.initPos + this.noiseTime * this.params.speed / 10) % 1;
            const z = t * 3000 - 1000;  // Range -1000 to 2000

            positions[i * 3 + 2] = z;
        }

        this.geometry.attributes.position.needsUpdate = true;
    }

    onBeat(audio: AudioAnalyzer) { }
    onBPMBeat() { }

    onToggle(active: boolean) {
        this.params.on = active;
        if (this.mesh) this.mesh.visible = active;
    }

    getParams() { return this.params; }
}
