import * as THREE from 'three';
import { SpliceApp } from '../SpliceApp';

const LeakTexture = '/viz/splice/img/leak03.jpg';

/**
 * LightLeak - Creates a subtle colored sprite that follows the Mover position
 * This creates the atmospheric purple/pink glow effect in the original
 */
export class LightLeak {
    private app: SpliceApp;
    private groupHolder: THREE.Object3D;
    private spriteMaterial: THREE.SpriteMaterial;
    private leak: THREE.Sprite;

    constructor(app: SpliceApp) {
        this.app = app;
        this.groupHolder = new THREE.Object3D();

        // Add to SCENE (not vizHolder) to avoid 3D tilt - matches original
        this.app.scene.add(this.groupHolder);

        // Load leak texture
        const texture = new THREE.TextureLoader().load(LeakTexture);

        this.spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: false,
            opacity: 0.08, // Original: 0.08 - very subtle
            fog: false,
        });

        this.leak = new THREE.Sprite(this.spriteMaterial);
        const spriteScale = 600; // Original: 600
        this.leak.scale.set(spriteScale, spriteScale, spriteScale);
        this.groupHolder.add(this.leak);
    }

    update(moverPos: THREE.Vector3) {
        // LightLeak follows Mover position
        this.groupHolder.position.copy(moverPos);

        // Slow rotation
        this.spriteMaterial.rotation += 0.01;
    }
}
