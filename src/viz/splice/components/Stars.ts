import * as THREE from 'three';
import { SpliceApp } from '../SpliceApp';

const StarTexture = '/viz/splice/img/dot.png';

export class Stars {
    private app: SpliceApp;
    private container: THREE.Object3D;
    private points: THREE.Points;
    private geometry: THREE.BufferGeometry;
    private material: THREE.PointsMaterial;
    private count = 1800;
    private spread = 600;

    constructor(app: SpliceApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        this.app.vizHolder.add(this.container);

        // Load Texture with optimized filtering to prevent flickering
        const texture = new THREE.TextureLoader().load(StarTexture);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        // Geometry
        const positions = new Float32Array(this.count * 3);
        const origZ = new Float32Array(this.count);

        for (let i = 0; i < this.count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 2 * this.spread;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 2 * this.spread;
            positions[i * 3 + 2] = Math.random() * 1000;
            // Store original Z? Not strictly needed if we just reset relative to camera
        }

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Material
        this.material = new THREE.PointsMaterial({
            size: 2, // Original: 2
            map: texture,
            blending: THREE.AdditiveBlending,
            depthTest: false, // Original: false (Confirmed)
            depthWrite: false,
            transparent: true,
            opacity: 0.3, // Original: 0.3 (Confirmed)
            side: THREE.DoubleSide,
            color: 0xFFFFFF
        });

        const color = new THREE.Color();
        color.setHSL(Math.random(), 1.0, 1.0);
        this.material.color = color;

        this.points = new THREE.Points(this.geometry, this.material);
        this.points.frustumCulled = false;
        this.points.renderOrder = -998; // Render after SkyBox
        this.container.add(this.points);
    }

    update() {
        if (!this.app.camera) return;

        const positions = this.geometry.attributes.position.array as Float32Array;
        const camZ = this.app.camera.position.z;

        for (let i = 0; i < this.count; i++) {
            let zIndex = i * 3 + 2;
            positions[zIndex] -= 1; // Move closer

            if (positions[zIndex] < camZ) {
                positions[zIndex] = camZ + Math.random() * 600 + 200;
            }
        }

        this.geometry.attributes.position.needsUpdate = true;
    }
}
