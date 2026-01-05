import {
    Scene, Object3D, TetrahedronGeometry, MeshBasicMaterial,
    Mesh, AdditiveBlending, DoubleSide
} from 'three';
import { VizEffect, VizParams } from '../core/VizEffect';
import { AudioAnalyzer } from '../core/AudioAnalyzer';
import { ATUtil } from '../core/ATUtil';
import { createNoise2D } from 'simplex-noise';

// Original Crystal from main.js:981-1082
// - Uses 5 tetrahedral meshes (d=4, loop 0 to d inclusive = 5)
// - Each has random color, random opacity 0.1-0.6
// - freakout mode spreads them out
// - scale.x = 2 for each mesh
// - Rest position and max position for animation

export class Crystal implements VizEffect {
    name = "Crystal";
    params = {
        on: false,
        scale: 1.6,
        freakout: false,
        opacity: 0.7
    };

    private group: Object3D | null = null;
    private meshes: Mesh[] = [];
    private noise2D = createNoise2D();
    private meshCount = 5; // d=4, 0 to d inclusive

    init(scene: Scene, holder: Object3D, tumbler: Object3D) {
        // Original: VizHandler.getVizTumbler().add(s)
        this.group = new Object3D();
        tumbler.add(this.group);

        const size = 300;
        const geometry = new TetrahedronGeometry(size);

        for (let i = 0; i < this.meshCount; i++) {
            const mat = new MeshBasicMaterial({
                color: Math.random() * 0xffffff,
                blending: AdditiveBlending,
                side: DoubleSide,
                opacity: ATUtil.randomRange(0.1, 0.6),
                transparent: true,
                depthTest: false
            });

            const mesh = new Mesh(geometry, mat) as any;
            mesh.scale.x = 2; // Original: v.scale.x = 2

            // Rest position
            const restRange = 100;
            mesh.restPosn = {
                x: ATUtil.randomRange(-restRange, restRange),
                y: ATUtil.randomRange(-restRange, restRange),
                z: ATUtil.randomRange(-restRange, restRange)
            };

            // Max position for freakout
            const maxRange = 600;
            mesh.maxPosn = {
                x: ATUtil.randomRange(-maxRange, maxRange),
                y: ATUtil.randomRange(-maxRange, maxRange),
                z: ATUtil.randomRange(-maxRange, maxRange)
            };

            // Set initial rest position
            mesh.position.set(mesh.restPosn.x, mesh.restPosn.y, mesh.restPosn.z);

            this.group.add(mesh);
            this.meshes.push(mesh);
        }

        this.onToggle(this.params.on);
    }

    update(dt: number, audio: AudioAnalyzer, noiseTime: number) {
        if (!this.group) return;

        // Original: s.rotation.z += 0.01; s.rotation.x += 0.01
        this.group.rotation.z += 0.01;
        this.group.rotation.x += 0.01;

        // Scale based on audio
        // Original: e = 0.2 + 0.6 * smoothedVolume * scale + 0.1 * volume
        const s = 0.2 + 0.6 * audio.smoothedVolume * this.params.scale + 0.1 * audio.volume;
        this.group.scale.set(s, s, s);

        // AutoMode scale adjustment (original line 1055)
        // u.scale = ATUtil.lerp(simplexNoise.noise(VizHandler.getNoiseTime()/10,60)/2+.5, 1, 2.5)
        this.params.scale = ATUtil.lerp((this.noise2D(noiseTime / 10, 60) + 1) / 2, 1, 2.5);

        // Freakout mode
        if (this.params.freakout) {
            // Original: n = Math.sin(BPMHandler.getBPMTime() * Math.PI)
            // Simplified: use time
            const t = (performance.now() * 0.001) % 1;
            const n = Math.sin(t * Math.PI);

            this.meshes.forEach((mesh: any) => {
                mesh.material.color.setHex(Math.random() * 0xffffff);
                mesh.position.x = n * mesh.maxPosn.x;
                mesh.position.y = n * mesh.maxPosn.y;
                mesh.position.z = n * mesh.maxPosn.z;
            });
        } else {
            this.meshes.forEach((mesh: any) => {
                mesh.position.x = mesh.restPosn.x;
                mesh.position.y = mesh.restPosn.y;
                mesh.position.z = mesh.restPosn.z;
            });
        }
    }

    onBeat(audio: AudioAnalyzer) {
        // Original: randomly rotate and scale one mesh
        if (this.meshes.length === 0) return;

        const idx = ATUtil.randomInt(0, this.meshes.length - 1);
        const mesh = this.meshes[idx] as any;

        // Random rotation
        mesh.rotation.x = Math.random() * Math.PI * 2;
        mesh.rotation.y = Math.random() * Math.PI * 2;
        mesh.rotation.z = Math.random() * Math.PI * 2;

        // Random scale
        mesh.scale.set(
            ATUtil.randomRange(0.5, 3),
            ATUtil.randomRange(0.5, 3),
            ATUtil.randomRange(0.5, 3)
        );

        // Random opacity
        mesh.material.opacity = ATUtil.randomRange(0.1, 0.6) * this.params.opacity;
        mesh.material.color.setHex(Math.random() * 0xffffff);
    }

    onBPMBeat() {
        // Original: jump rotation
        if (this.group) {
            this.group.rotation.x = Math.random() * Math.PI * 2;
            this.group.rotation.z = Math.random() * Math.PI * 2;
        }
    }

    onToggle(active: boolean) {
        this.params.on = active;
        if (this.group) this.group.visible = active;
    }

    getParams() { return this.params; }
}
