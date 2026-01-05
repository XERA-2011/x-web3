
import {
    Scene, Object3D, PlaneGeometry, ShaderMaterial,
    Mesh, AdditiveBlending, DoubleSide
} from 'three';
import { VizEffect, VizParams } from '../core/VizEffect';
import { AudioAnalyzer } from '../core/AudioAnalyzer';
import { RipplesShader } from '../shaders/Shaders';
import { ATUtil } from '../core/ATUtil';
import { createNoise2D } from 'simplex-noise';

export class Ripples implements VizEffect {
    name = "Ripples";
    params = {
        on: false,
        lineCount: 50,
        dotSize: 0.3,
        lineSize: 0.1,
        blur: 0.1,
        noiseSpeed: 10,
        noiseSize: 4,
        lineSpeed: 1,
        depth: 80,
        vizMode: 0,
        opacity: 0.7
    };

    private mesh: Mesh | null = null;
    private material: ShaderMaterial | null = null;
    private holder: Object3D | null = null;
    private noise2D = createNoise2D();
    private time = 0;

    init(scene: Scene, holder: Object3D, tumbler: Object3D) {
        this.holder = holder;

        // RipplesShader uniforms need initialization
        const uniforms = {
            noiseTime: { value: 1.0 },
            noiseSize: { value: 2.0 },
            lineTime: { value: 1.0 },
            lineCount: { value: 40.0 },
            dotSize: { value: 0.3 },
            lineSize: { value: 0.1 },
            blur: { value: 0.05 },
            depth: { value: 300.0 },
            opacity: { value: 1.0 }
        };

        this.material = new ShaderMaterial({
            uniforms: uniforms,
            vertexShader: RipplesShader.vertexShader,
            fragmentShader: RipplesShader.fragmentShader,
            depthTest: false,
            blending: AdditiveBlending,
            transparent: true,
            side: DoubleSide
        });

        const geometry = new PlaneGeometry(700, 700, 100, 100);
        this.mesh = new Mesh(geometry, this.material);
        this.mesh.position.z = 0;
        this.mesh.scale.set(4, 4, 4);

        this.holder.add(this.mesh);
        this.onToggle(this.params.on);
        this.updateUniforms();
    }

    updateUniforms() {
        if (!this.material) return;
        this.material.uniforms.lineCount.value = this.params.lineCount;
        this.material.uniforms.blur.value = this.params.blur;
        this.material.uniforms.noiseSize.value = this.params.noiseSize;
        this.material.uniforms.opacity.value = this.params.opacity;
    }

    update(dt: number, audio: AudioAnalyzer, noiseTime: number) {
        if (!this.mesh || !this.material) return;

        this.mesh.rotation.z += 0.002;

        // AutoMode logic from original main.js lines 1385-1392
        const e = 0.1; // noise rate

        // vizMode determines which params are active
        if (this.params.vizMode === 0) {
            this.params.lineSize = (this.noise2D(noiseTime * e, 0) + 1) / 2;
            this.params.dotSize = 0;
        } else if (this.params.vizMode === 1) {
            this.params.dotSize = (this.noise2D(noiseTime * e, 0) + 1) / 2 + 0.5;
            this.params.lineSize = 0;
        } else {
            this.params.lineSize = (this.noise2D(noiseTime * e, 0) + 1) / 2;
            this.params.dotSize = 1 - this.params.lineSize;
        }

        // Other auto params
        this.params.depth = ATUtil.lerp((this.noise2D(noiseTime * e, 10) + 1) / 2, 0, 200);
        this.params.blur = ATUtil.lerp((this.noise2D(noiseTime * e, 20) + 1) / 2, 0, 0.5);
        this.params.noiseSpeed = ATUtil.lerp((this.noise2D(noiseTime * e, 30) + 1) / 2, 0, 10);
        this.params.noiseSize = ATUtil.lerp((this.noise2D(noiseTime * e, 40) + 1) / 2, 0, 7);
        this.params.lineSpeed = ATUtil.lerp((this.noise2D(noiseTime * e, 50) + 1) / 2, 0, 1);
        this.params.opacity = ATUtil.lerp((this.noise2D(noiseTime * e, 60) + 1) / 2, 0.3, 1);

        // Update shader uniforms
        this.material.uniforms.noiseTime.value += this.params.noiseSpeed / 1000;
        this.material.uniforms.lineTime.value += this.params.lineSpeed / 1000;
        this.material.uniforms.dotSize.value = this.params.dotSize * audio.volume;
        this.material.uniforms.lineSize.value = this.params.lineSize * audio.volume;
        this.material.uniforms.depth.value = this.params.depth * audio.smoothedVolume * 2;
        this.material.uniforms.noiseSize.value = this.params.noiseSize;
        this.material.uniforms.blur.value = this.params.blur;
        this.material.uniforms.opacity.value = this.params.opacity;
    }

    onBeat(audio: AudioAnalyzer) {
        if (this.material) {
            this.material.uniforms.noiseTime.value = 10 * Math.random();

            // Random Viz Mode switch
            if (Math.random() < 0.5) {
                this.params.lineCount = ATUtil.randomInt(10, 80);
                this.updateUniforms();
            }
        }
    }

    onBPMBeat() { }

    onToggle(active: boolean) {
        this.params.on = active;
        if (this.mesh) this.mesh.visible = active;
    }

    getParams() { return this.params; }
}
