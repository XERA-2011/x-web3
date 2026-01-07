import * as THREE from 'three';
import { SpliceApp } from '../SpliceApp';

const CrossesTexture = '/viz/splice/img/crosses.png';

export class SkyBox {
    private app: SpliceApp;
    private container: THREE.Object3D;
    private mesh: THREE.Mesh;
    private material: THREE.MeshBasicMaterial;

    constructor(app: SpliceApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        this.app.vizHolder.add(this.container);

        const texture = new THREE.TextureLoader().load(CrossesTexture);
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(12, 12); // Original: 12 (Confirmed Step 758)

        this.material = new THREE.MeshBasicMaterial({
            blending: THREE.AdditiveBlending,
            map: texture,
            transparent: true,
            depthTest: true,
            opacity: 1, // Original: 1
            fog: false,
            side: THREE.BackSide
            // No color property - original uses default white
        });

        const geometry = new THREE.BoxGeometry(600, 600, 600); // Original: 600 (Confirmed)
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.renderOrder = -999; // Ensure background renders first
        // Original: backMesh.scale.x = -1;
        // Since we use BackSide, we might not need negative scale, 
        // but let's stick to original geometry logic if needed, or simply use BackSide.
        // Original logic: scale.x = -1 flips normals inwards.

        this.container.add(this.mesh);
    }

    update() {
        if (this.app.camera) {
            this.mesh.position.copy(this.app.camera.position);
        }
    }
}
