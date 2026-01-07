import * as THREE from 'three';
import { NeroApp } from '../NeroApp';
import { ATUtil } from '../../common/ATUtil';

export class StarBars {
    private app: NeroApp;
    private container: THREE.Object3D;
    private geometry: THREE.PlaneGeometry;
    private material: THREE.MeshBasicMaterial;
    private meshes: THREE.Mesh[] = [];

    private count = 150;
    private n = 0; // noise/time counter

    public params = {
        on: false, // Default off in original? Check main.js. It says `on: false` initially.
        size: 5,
        speed: 2,
        opacity: 0.7,
        colorRange: 0.5
    };

    constructor(app: NeroApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        this.app.vizHolder.add(this.container);

        this.geometry = new THREE.PlaneGeometry(4, 100, 1, 1);
        this.material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const range = 1000;

        for (let i = 0; i < this.count; i++) {
            const mesh = new THREE.Mesh(this.geometry, this.material);

            mesh.scale.y = ATUtil.randomRange(0.2, 2);
            mesh.scale.x = ATUtil.randomRange(0.2, 2);
            mesh.scale.z = ATUtil.randomRange(0.2, 2);

            (mesh as any).initPos = Math.random(); // Custom prop

            this.container.add(mesh);
            mesh.rotation.x = Math.PI / 2;
            mesh.position.set(
                ATUtil.randomRange(-range, range),
                ATUtil.randomRange(-range, range),
                0
            );

            this.meshes.push(mesh);
        }

        // Initial visibility
        this.updateVisibility();
    }

    updateVisibility() {
        this.container.visible = this.params.on;
    }

    onBeat() {
        if (Math.random() < 0.5) return;
        this.container.rotation.z += Math.random() * Math.PI * 2;
    }

    update() {
        if (!this.params.on) {
            if (this.container.visible) this.container.visible = false;
            return;
        }
        this.container.visible = true;

        // Logic from main.js c()
        // n += k.speed / 200 * (AudioHandler.getVolume() + .2)
        const vol = this.app.audioHandler ? this.app.audioHandler.getVolume() : 0;
        this.n += this.params.speed / 200 * (vol + 0.2);

        // h = (simplexNoise.noise(n, 0) + 1) / 2
        const h = (Math.sin(this.n) + 1) / 2;

        this.material.color.setHSL(h, 0.8, 0.5);
        this.material.opacity = this.params.opacity;

        for (let i = 0; i < this.count; i++) {
            const mesh = this.meshes[i];
            const initPos = (mesh as any).initPos;

            // b = (a.initPos + n) % 1 * 2e3 - 1e3
            const z = ((initPos + this.n) % 1) * 2000 - 1000;
            mesh.position.z = z;
        }
    }
}
