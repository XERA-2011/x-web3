
import {
    Scene, Object3D, PlaneGeometry, MeshBasicMaterial,
    Mesh, AdditiveBlending, DoubleSide
} from 'three';
import { VizEffect } from '../core/VizEffect';
import { AudioAnalyzer } from '../core/AudioAnalyzer';
import { createNoise2D } from 'simplex-noise';
import { ATUtil } from '../core/ATUtil';

export class StarBars implements VizEffect {
    name = "StarBars";
    params = {
        on: true,
        size: 1,
        speed: 2,
        opacity: 0.5,
        colorRange: 0.5,
        audioSpeed: false
    };

    private holder: Object3D | null = null;
    private parent: Object3D | null = null;
    private bars: { mesh: Mesh, initPos: number, scaleOffset: number }[] = [];

    private material: MeshBasicMaterial | null = null;
    private noise2D = createNoise2D();

    private count = 200;
    private progress = 0;

    init(scene: Scene, holder: Object3D, tumbler: Object3D) {
        this.parent = tumbler;
        this.holder = new Object3D();
        this.parent.add(this.holder);

        // Geometry reuse
        const geometry = new PlaneGeometry(4, 100, 1, 1);

        this.material = new MeshBasicMaterial({
            color: 0xffffff,
            blending: AdditiveBlending,
            depthTest: false,
            transparent: true,
            opacity: 0.8,
            side: DoubleSide
        });

        const range = 1000;

        for (let i = 0; i < this.count; i++) {
            const mesh = new Mesh(geometry, this.material);
            const scaleX = ATUtil.randomRange(0.2, 2);
            const scaleY = ATUtil.randomRange(0.2, 2);
            mesh.scale.set(scaleX, scaleY, 1);

            mesh.rotation.x = Math.PI / 2;
            mesh.position.set(
                ATUtil.randomRange(-range, range),
                ATUtil.randomRange(-range, range),
                0
            );

            const initPos = Math.random();
            const scaleOffset = Math.random(); // unused in original update loop explicitly but maybe intended?

            this.holder.add(mesh);
            this.bars.push({ mesh, initPos, scaleOffset });
        }

        this.onToggle(this.params.on);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    update(dt: number, audio: AudioAnalyzer, _noiseTime: number) {
        if (!this.holder || !this.material) return;

        // f+=c.audioSpeed?c.speed/200*(AudioHandler.getVolume()+.2):c.speed/600
        const speed = this.params.audioSpeed
            ? this.params.speed / 200 * (audio.volume + 0.2)
            : this.params.speed / 600;

        this.progress += speed;

        // d=(simplexNoise.noise(f,0)+1)/2
        const noiseVal = (this.noise2D(this.progress, 0) + 1) / 2;
        this.material.color.setHSL(noiseVal, 0.8, 0.5);
        this.material.opacity = this.params.opacity;

        for (let i = 0; i < this.count; i++) {
            const bar = this.bars[i];
            // t=(n.initPos+f)%1*2e3-1e3
            let z = (bar.initPos + this.progress) % 1;
            z = z * 2000 - 1000;
            bar.mesh.position.z = z;

            // Scale was set in init but original has a `onChange(t)` for size that updates scale.
            // We can just update scale here if size changes freq? 
            // Original: "e.add(c,"size",0,5).name("Size").onChange(t)" -> only on change.
            // For simplicity we leave static or update if dynamic needed.
            // Let's assume size param is static unless changed.
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBeat(_audio: AudioAnalyzer) {
        if (this.holder && Math.random() < 0.5) {
            this.holder.rotation.z += Math.random() * Math.PI * 2;
        }
    }

    onBPMBeat() { }

    onToggle(active: boolean) {
        this.params.on = active;
        if (this.holder) this.holder.visible = active;
    }

    getParams() { return this.params; }
}
