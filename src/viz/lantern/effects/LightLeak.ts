
import {
    Scene, Object3D, PlaneGeometry, MeshBasicMaterial,
    Mesh, AdditiveBlending, TextureLoader, DoubleSide
} from 'three';
import { VizEffect } from '../core/VizEffect';
import { AudioAnalyzer } from '../core/AudioAnalyzer';
import { ATUtil } from '../core/ATUtil';

export class LightLeak implements VizEffect {
    name = "LightLeak";
    params = {
        on: true,
        freakOut: false,
        opacity: 0.2
    };

    private mesh: Mesh | null = null;
    private material: MeshBasicMaterial | null = null;
    private holder: Object3D | null = null;

    private textures: any[] = [];
    private textureCount = 1;
    private toggleState = true;

    init(scene: Scene, holder: Object3D, tumbler: Object3D) {
        this.holder = scene; // "VizHandler.getScene().add(l)" - added to SCENE directly? 
        // Wait, original: `l=new THREE.Object3D,VizHandler.getScene().add(l)`
        // It sits outside the tumbler I guess.

        this.textureCount = 1; // "c=1" in original for light leak folder
        const loader = new TextureLoader();

        // Original loop: for(var t=0;c>t;t++) u[t]=load... "res/img/light-leak/"+t+".jpg"
        // We found only 0.jpg in folder.
        this.textures.push(loader.load('/viz/lantern/res/img/light-leak/0.jpg'));

        this.material = new MeshBasicMaterial({
            map: this.textures[0],
            transparent: true,
            blending: AdditiveBlending,
            opacity: 0.2,
            fog: false,
            depthTest: false
        });

        const geometry = new PlaneGeometry(800, 800, 1, 1);
        this.mesh = new Mesh(geometry, this.material);

        // Scale and position
        this.mesh.scale.set(8, 8, 1);
        this.mesh.position.z = -1000;

        // We need a holder object or just add mesh to scene
        const localHolder = new Object3D();
        localHolder.add(this.mesh);
        this.holder.add(localHolder);
        this.holder = localHolder; // Repurpose holder reference to the wrapper

        this.onToggle(this.params.on);
    }

    update(dt: number, audio: AudioAnalyzer, noiseTime: number) {
        if (!this.holder || !this.material) return;

        this.holder.rotation.z += 0.005;

        if (this.params.freakOut) {
            this.toggleState = !this.toggleState;
            this.material.opacity = this.toggleState ? 0 : 1;
        } else {
            this.material.opacity = this.params.opacity;
        }
    }

    onBeat(audio: AudioAnalyzer) {
        if (this.mesh && this.material && Math.random() < 0.7) {
            // Random rotation
            this.mesh.rotation.z = Math.random() * Math.PI * 2;
            // Random texture if multiple
            if (this.textures.length > 0) {
                this.material.map = this.textures[ATUtil.randomInt(0, this.textures.length - 1)];
            }
        }
    }

    onBPMBeat() { }

    onToggle(active: boolean) {
        this.params.on = active;
        if (this.holder) this.holder.visible = active;
    }

    getParams() { return this.params; }
}
