
import {
    Scene, Object3D, PlaneGeometry, MeshBasicMaterial,
    Mesh, AdditiveBlending, TextureLoader, LinearFilter, Texture
} from 'three';
import { VizEffect } from '../core/VizEffect';
import { AudioAnalyzer } from '../core/AudioAnalyzer';
import { ATUtil } from '../core/ATUtil';
import Img0 from '../res/img/light-leak/0.jpg';

const TEXTURES = [Img0];

export class LightLeak implements VizEffect {
    name = "LightLeak";
    params = {
        on: true,
        freakOut: false,
        opacity: 0.15
    };

    private mesh: Mesh | null = null;
    private material: MeshBasicMaterial | null = null;
    private holder: Object3D | null = null;

    private textures: Texture[] = [];
    private textureCount = 1;  // Original: c = 1
    private toggleState = true;  // Original: m = !0

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(scene: Scene, _holder: Object3D, _tumbler: Object3D) {
        // Original: l = new THREE.Object3D, VizHandler.getScene().add(l)
        this.holder = new Object3D();
        scene.add(this.holder);

        const loader = new TextureLoader();

        // Original: for(var t=0;c>t;t++) u[t]=THREE.ImageUtils.loadTexture("res/img/light-leak/"+t+".jpg"),
        //           u[t].minFilter = u[t].magFilter = THREE.LinearFilter
        for (let i = 0; i < this.textureCount; i++) {
            const img = TEXTURES[i];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const src = (img as any).src || img;
            const texture = loader.load(src);
            texture.minFilter = LinearFilter;
            texture.magFilter = LinearFilter;
            this.textures.push(texture);
        }

        // Original: d = new THREE.MeshBasicMaterial({map:u[0], transparent:!0, 
        //           blending:THREE.AdditiveBlending, opacity:.2, fog:!1, depthTest:!1})
        this.material = new MeshBasicMaterial({
            map: this.textures[0],
            transparent: true,
            blending: AdditiveBlending,
            opacity: 0.2,
            fog: false,
            depthTest: false
        });

        // Original: var m = new THREE.PlaneGeometry(800, 800, 1, 1)
        const geometry = new PlaneGeometry(800, 800, 1, 1);

        // Original: s = new THREE.Mesh(m, d), l.add(s)
        this.mesh = new Mesh(geometry, this.material);
        this.holder.add(this.mesh);

        // Original: s.scale.x = s.scale.y = 8, s.position.z = -1e3
        this.mesh.scale.x = 12;
        this.mesh.scale.y = 12;
        this.mesh.position.z = -1000;

        this.onToggle(this.params.on);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    update(_dt: number, _audio: AudioAnalyzer, _noiseTime: number) {
        if (!this.holder || !this.material) return;

        // Original: l.rotation.z += .005 - slightly reduced for smoother appearance
        this.holder.rotation.z += 0.003;

        if (this.params.freakOut) {
            this.toggleState = !this.toggleState;
            this.material.opacity = this.toggleState ? 0 : 1;
        } else {
            this.material.opacity = this.params.opacity;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBeat(_audio: AudioAnalyzer) {
        // Original: Math.random() < .7 || (...) means 30% chance to execute
        if (this.mesh && this.material && Math.random() >= 0.7) {
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
