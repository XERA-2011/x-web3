import * as THREE from 'three';
import { NeroApp } from '../NeroApp';
import SplashImg from '../res/img/nero-splash.png';

export class ImagePlayer {
    private app: NeroApp;
    private container: THREE.Object3D;
    private material: THREE.MeshBasicMaterial;

    constructor(app: NeroApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        this.app.scene.add(this.container);

        const imgSrc = (SplashImg as any).src || SplashImg;
        const texture = new THREE.TextureLoader().load(imgSrc);

        this.material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });

        const geometry = new THREE.PlaneGeometry(800, 600); // Adjust size as needed
        const mesh = new THREE.Mesh(geometry, this.material);
        this.container.add(mesh);

        this.container.visible = true; // Initially visible?
    }

    update() {
        // Simple logic: fade out over time or controlled by events
        // For now, mirroring original behavior which seemed static or controlled externally
        // this.container.rotation.z += 0.001; 
    }
}
