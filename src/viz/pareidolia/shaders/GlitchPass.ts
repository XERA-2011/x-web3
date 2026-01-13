
import {
    ShaderMaterial,
    UniformsUtils,
    OrthographicCamera,
    Scene,
    Mesh,
    PlaneGeometry,
    DataTexture,
    RGBFormat,
    FloatType,
    NearestFilter,
    MathUtils
} from 'three';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { DigitalGlitch } from './DigitalGlitch';

export class GlitchPass extends Pass {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uniforms: any;
    material: ShaderMaterial;
    camera: OrthographicCamera;
    scene: Scene;
    quad: Mesh;
    goWild: boolean;
    curF: number;
    randX: number;

    constructor(dt_size: number = 64) {
        super();

        const shader = DigitalGlitch;
        this.uniforms = UniformsUtils.clone(shader.uniforms);

        this.uniforms["tDisp"].value = this.generateHeightmap(dt_size);

        this.material = new ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader
        });

        this.enabled = true;
        this.needsSwap = true;

        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.scene = new Scene();

        this.quad = new Mesh(new PlaneGeometry(2, 2), this.material);
        this.quad.frustumCulled = false; // Add this to prevent culling issues
        this.scene.add(this.quad);

        this.goWild = false;
        this.curF = 0;
        this.randX = 0;
        this.generateTrigger();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    render(renderer: any, writeBuffer: any, readBuffer: any, deltaTime: any, maskActive: any) {
        this.uniforms["tDiffuse"].value = readBuffer.texture;
        this.uniforms['seed'].value = Math.random(); // default seeding
        this.uniforms['byp'].value = 0;

        if (this.curF % this.randX == 0 || this.goWild == true) {
            this.uniforms['amount'].value = Math.random() / 30;
            this.uniforms['angle'].value = MathUtils.randFloat(-Math.PI, Math.PI);
            this.uniforms['seed_x'].value = MathUtils.randFloat(-1, 1);
            this.uniforms['seed_y'].value = MathUtils.randFloat(-1, 1);
            this.uniforms['distortion_x'].value = MathUtils.randFloat(0, 1);
            this.uniforms['distortion_y'].value = MathUtils.randFloat(0, 1);
            this.curF = 0;
            this.generateTrigger();
        } else if (this.curF % this.randX < this.randX / 5) {
            this.uniforms['amount'].value = Math.random() / 90;
            this.uniforms['angle'].value = MathUtils.randFloat(-Math.PI, Math.PI);
            this.uniforms['distortion_x'].value = MathUtils.randFloat(0, 1);
            this.uniforms['distortion_y'].value = MathUtils.randFloat(0, 1);
            this.uniforms['seed_x'].value = MathUtils.randFloat(-0.3, 0.3);
            this.uniforms['seed_y'].value = MathUtils.randFloat(-0.3, 0.3);
        } else if (this.goWild == false) {
            this.uniforms['byp'].value = 1;
        }
        this.curF++;

        if (this.renderToScreen) {
            renderer.setRenderTarget(null);
            renderer.render(this.scene, this.camera);
        } else {
            renderer.setRenderTarget(writeBuffer);
            if (this.clear) renderer.clear();
            renderer.render(this.scene, this.camera);
        }
    }

    generateTrigger() {
        this.randX = MathUtils.randInt(120, 240);
    }

    generateHeightmap(dt_size: number) {
        const data_arr = new Float32Array(dt_size * dt_size * 3);
        const length = dt_size * dt_size;

        for (let i = 0; i < length; i++) {
            const val = MathUtils.randFloat(0, 1);
            data_arr[i * 3 + 0] = val;
            data_arr[i * 3 + 1] = val;
            data_arr[i * 3 + 2] = val;
        }

        const texture = new DataTexture(data_arr, dt_size, dt_size, RGBFormat, FloatType);
        texture.minFilter = NearestFilter;
        texture.magFilter = NearestFilter;
        texture.needsUpdate = true;
        texture.flipY = false;
        return texture;
    }
}
