
import {
    Scene, Object3D, PlaneGeometry, ShaderMaterial,
    Mesh, AdditiveBlending, DoubleSide, DataTexture
} from 'three';
import { VizEffect, VizParams } from '../core/VizEffect';
import { AudioAnalyzer } from '../core/AudioAnalyzer';
import { createNoise2D } from 'simplex-noise';
import { EclipseShader } from '../shaders/Shaders';

export class Eclipse implements VizEffect {
    name = "Eclipse";
    params = {
        on: false,
        radius: 0.07, // Default in original code was .07, .25 in shader default
        brightness: 0.005,
        opacity: 1
    };

    private mesh: Mesh | null = null;
    private material: ShaderMaterial | null = null;
    private holder: Object3D | null = null;
    private noise2D = createNoise2D();
    private noiseTime = 0;

    init(scene: Scene, holder: Object3D, tumbler: Object3D) {
        this.holder = holder; // VizHandler.getVizHolder().add(r) -> holder, not tumbler

        const uniforms = Object.assign({}, EclipseShader.uniforms);
        // Clone uniforms to avoid singleton conflict if needed, though Shader object redefines them.
        // Three.js ShaderMaterial takes uniforms object.

        // We need to map the AudioAnalyzer's texture to the uniform.
        // levelsTexture: {value: 2} -> This 2 was slot? Or placeholder?
        // We should pass the texture object.

        this.material = new ShaderMaterial({
            uniforms: {
                radius: { value: 0.25 },
                brightness: { value: 0.02 },
                opacity: { value: 1.0 },
                time: { value: 0 },
                levelsTexture: { value: null }
            },
            vertexShader: EclipseShader.vertexShader,
            fragmentShader: EclipseShader.fragmentShader,
            depthTest: false,
            blending: AdditiveBlending,
            transparent: true
        });

        const geometry = new PlaneGeometry(1200, 1200, 1, 1);
        this.mesh = new Mesh(geometry, this.material);
        this.mesh.scale.set(4, 4, 1);
        this.mesh.position.z = 0;

        this.holder.add(this.mesh);
        this.onToggle(this.params.on);
        this.updateUniforms();
    }

    updateUniforms() {
        if (!this.material) return;
        this.material.uniforms.radius.value = this.params.radius;
        this.material.uniforms.brightness.value = this.params.brightness;
        this.material.uniforms.opacity.value = this.params.opacity;
    }

    update(dt: number, audio: AudioAnalyzer, noiseTime: number) {
        if (!this.mesh || !this.material) return;

        this.mesh.rotation.z += 0.002;
        this.material.uniforms.time.value += 0.002;

        // Important: Bind Texture
        if (audio.levelsTexture) {
            this.material.uniforms.levelsTexture.value = audio.levelsTexture;
        }

        // Auto Automation using passed noiseTime
        // Original: s.radius=(simplexNoise.noise(VizHandler.getNoiseTime()/10,0)+1)/2*.05+.06
        const n = this.noise2D(noiseTime / 10, 0);
        const nNorm = (n + 1) / 2;

        this.params.radius = nNorm * 0.05 + 0.06;
        this.params.brightness = ((this.noise2D(noiseTime / 10, 5) + 1) / 2) * 0.01;

        this.updateUniforms();
    }

    onBeat(audio: AudioAnalyzer) { }
    onBPMBeat() { }

    onToggle(active: boolean) {
        this.params.on = active;
        if (this.mesh) this.mesh.visible = active;
    }

    getParams() { return this.params; }
}
