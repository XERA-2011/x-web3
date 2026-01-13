import * as THREE from 'three';
import { NeroApp } from '../NeroApp';
import { DisplacementMatShader } from '../shaders/NeroShaders';
import { ATUtil } from '../../common/ATUtil';

const TEXTURE_IMAGES = [
    '/viz/nero/img/disp-tube/00.jpg',
    '/viz/nero/img/disp-tube/01.jpg',
    '/viz/nero/img/disp-tube/02.jpg',
    '/viz/nero/img/disp-tube/03.jpg',
    '/viz/nero/img/disp-tube/04.jpg',
    '/viz/nero/img/disp-tube/05.jpg',
    '/viz/nero/img/disp-tube/06.jpg',
    '/viz/nero/img/disp-tube/07.jpg',
    '/viz/nero/img/disp-tube/08.jpg',
    '/viz/nero/img/disp-tube/09.jpg',
    '/viz/nero/img/disp-tube/10.jpg',
    '/viz/nero/img/disp-tube/11.jpg',
    '/viz/nero/img/disp-tube/12.jpg',
    '/viz/nero/img/disp-tube/13.jpg',
    '/viz/nero/img/disp-tube/14.jpg',
    '/viz/nero/img/disp-tube/15.jpg',
    '/viz/nero/img/disp-tube/16.jpg',
    '/viz/nero/img/disp-tube/17.jpg'
];

export class DisplacementTube {
    private app: NeroApp;
    private container: THREE.Object3D;
    private mesh: THREE.Mesh;
    private material: THREE.ShaderMaterial;
    private textures: THREE.Texture[] = [];

    private count = 18;
    private freakOutCounter = 0;

    public params = {
        on: false, // Default off
        sliceXSpeed: 3,
        sliceYSpeed: 5,
        stretch: 1.8,
        depth: 100,
        scale: 1,
        audioDepth: 100,
        freakOut: false,
        freakOutPeriod: 2,
        rotSpeed: 0.04,
        numStrips: 20
    };

    constructor(app: NeroApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        this.app.vizHolder.add(this.container);

        // Load textures
        const loader = new THREE.TextureLoader();
        for (let i = 0; i < this.count; i++) {
            const img = TEXTURE_IMAGES[i];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const src = (img as any).src || img;
            this.textures[i] = loader.load(src);
        }

        // Clone uniforms so we can modify them
        const uniforms = THREE.UniformsUtils.clone(DisplacementMatShader.uniforms);
        uniforms.texture.value = this.textures[0];

        // Initialize levels array for shader
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        uniforms.levels.value = new Array(16).fill(0) as any;

        this.material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: DisplacementMatShader.vertexShader,
            fragmentShader: DisplacementMatShader.fragmentShader,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthTest: true
        });

        // CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded)
        const geometry = new THREE.CylinderGeometry(200, 200, 800, 250, 250, true);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.visible = false; // Default hidden
        this.container.add(this.mesh);

        this.updateParams();
        this.updateVisibility();
    }

    updateVisibility() {
        this.container.visible = this.params.on;
        if (this.mesh) this.mesh.visible = this.params.on;
    }

    updateParams() {
        // Safe check in case shader compilation failed or not ready
        if (this.material && this.material.uniforms) {
            this.material.uniforms.stretch.value = this.params.stretch;
            this.material.uniforms.depth.value = this.params.depth;
            this.material.uniforms.numStrips.value = this.params.numStrips;
            this.container.scale.set(this.params.scale, this.params.scale, this.params.scale);
        }
    }

    onBeat() {
        const idx = ATUtil.randomInt(0, this.count - 1);
        this.material.uniforms.texture.value = this.textures[idx];
    }

    update() {
        if (!this.params.on) {
            if (this.container.visible) this.updateVisibility();
            return;
        }
        this.container.visible = true;

        this.material.uniforms.audioDepth.value = this.params.audioDepth;
        this.material.uniforms.timeX.value += this.params.sliceXSpeed / 1000;
        this.material.uniforms.timeY.value += this.params.sliceYSpeed / 1000;

        if (this.app.audioHandler) {
            // Need to map LevelsData (array of floats) to uniform
            this.material.uniforms.levels.value = this.app.audioHandler.getLevels();

            const vol = this.app.audioHandler.getVolume();
            const s = 1 + 0.5 * vol;
            this.mesh.scale.set(s, s, s);
        }

        this.container.rotation.y += this.params.rotSpeed;

        if (this.params.freakOut) {
            this.freakOutCounter++;
            if (this.freakOutCounter > this.params.freakOutPeriod) {
                this.freakOutCounter = 0;
                const idx = ATUtil.randomInt(0, this.count - 1);
                this.material.uniforms.texture.value = this.textures[idx];
            }
        }
    }
}
