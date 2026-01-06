import * as THREE from 'three';
import { NeroApp } from '../NeroApp';
import { ATUtil } from '../../common/ATUtil';
import Leak00 from '../res/img/light-leak/leak00.jpg';
import Leak01 from '../res/img/light-leak/leak01.jpg';
import Leak02 from '../res/img/light-leak/leak02.jpg';
import Leak03 from '../res/img/light-leak/leak03.jpg';

const LEAK_IMAGES = [Leak00, Leak01, Leak02, Leak03];

export class LightLeak {
    private app: NeroApp;
    private container: THREE.Object3D;
    private plane: THREE.Mesh;
    private textures: THREE.Texture[] = [];
    private material: THREE.MeshBasicMaterial;

    // Params
    private count = 4;
    private show = false;
    private lastBeatTime = 0;

    constructor(app: NeroApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        this.app.scene.add(this.container);

        // Load textures
        const loader = new THREE.TextureLoader();
        for (let i = 0; i < this.count; i++) {
            const img = LEAK_IMAGES[i];
            const src = (img as any).src || img;
            this.textures[i] = loader.load(src);
        }

        this.material = new THREE.MeshBasicMaterial({
            map: this.textures[0],
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            side: THREE.DoubleSide
        });

        const geometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);
        this.plane = new THREE.Mesh(geometry, this.material);
        this.container.add(this.plane);

        // Put in front of camera
        this.container.position.z = 900;
    }

    onBeat() {
        if (Math.random() > 0.7) {
            this.show = true;
            this.material.opacity = 1;
            const idx = ATUtil.randomInt(0, this.count - 1);
            this.material.map = this.textures[idx];

            // Random rotation/flip
            this.plane.rotation.z = Math.random() * Math.PI;
        }
    }

    update() {
        if (this.show) {
            this.material.opacity *= 0.9;
            if (this.material.opacity < 0.01) {
                this.material.opacity = 0;
                this.show = false;
            }
        }
    }
}
