import * as THREE from 'three';
import { BbngApp } from '../BbngApp';

const IMAGES = [
    '/viz/bbng/img/0.png',
    '/viz/bbng/img/1.png',
    '/viz/bbng/img/2.png',
    '/viz/bbng/img/3.png'
];

export class ImagePlayer {
    private app: BbngApp;
    private container: THREE.Object3D;
    private textures: THREE.Texture[] = [];
    private material: THREE.MeshBasicMaterial;
    private mesh: THREE.Mesh;
    private count = 4;
    private currentIdx = 0;

    private displayTime = 0;
    private maxDisplayTime = 0.15; // Seconds

    constructor(app: BbngApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        this.app.scene.add(this.container);

        const loader = new THREE.TextureLoader();
        for (let i = 0; i < this.count; i++) {
            const img = IMAGES[i];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const src = (img as any).src || img;
            this.textures[i] = loader.load(src);
        }

        this.material = new THREE.MeshBasicMaterial({
            map: this.textures[0],
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });

        const geometry = new THREE.PlaneGeometry(300, 300);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.container.add(this.mesh);
        this.mesh.visible = false;
    }

    show(idx: number) {
        if (idx >= 0 && idx < this.count) {
            this.material.map = this.textures[idx];
            this.mesh.visible = true;
            this.currentIdx = idx;
            this.displayTime = this.maxDisplayTime;
        }
    }

    hide() {
        this.mesh.visible = false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update(dt: number, app: any) {
        if (this.mesh.visible) {
            this.displayTime -= dt;
            if (this.displayTime <= 0) {
                this.hide();
            }
            // Scale pulse
            const s = 1 + app.getVolume() * 0.5;
            this.mesh.scale.set(s, s, s);
            this.mesh.rotation.z += 0.01;
        }
    }

    onBeat() {
        // Randomly show image
        if (Math.random() < 0.6) {
            const idx = Math.floor(Math.random() * this.count);
            this.show(idx);
        }
    }
}
