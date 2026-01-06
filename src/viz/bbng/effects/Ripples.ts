import {
    Object3D, ShaderMaterial, PlaneGeometry, Mesh, AdditiveBlending, SphereGeometry
} from 'three';
import { RipplesShader } from '../shaders/RipplesShader';
import { ImprovedNoise } from '../../loop/ImprovedNoise'; // Reuse utils
// import { BbngApp } from '../BbngApp'; // Circular dependency

export class Ripples {
    groupHolder: Object3D;
    material!: ShaderMaterial;

    private simplexNoise = new ImprovedNoise();

    // Params
    params = {
        on: true,
        lineCount: 50.0,
        dotSize: 0.3,
        lineSize: 0.1,
        blur: 0.1,
        noiseSpeed: 10,
        noiseSize: 4,
        lineSpeed: 1,
        depth: 80,
        auto: true,
        vizMode: 0 // 0 lines, 1 dots, 2 both
    };

    constructor(scene: Object3D) {
        this.groupHolder = new Object3D();
        scene.add(this.groupHolder);
        this.init();
    }

    init() {
        this.material = new ShaderMaterial({
            uniforms: {
                noiseTime: { value: 1.0 },
                noiseSize: { value: 2.0 },
                lineTime: { value: 1.0 },
                lineCount: { value: 40.0 },
                dotSize: { value: 0.3 },
                lineSize: { value: 0.1 },
                blur: { value: 0.05 },
                depth: { value: 300 },
            },
            vertexShader: RipplesShader.vertexShader,
            fragmentShader: RipplesShader.fragmentShader,
            depthTest: false,
            blending: AdditiveBlending,
        });

        // Add Plane
        const planeGeometry = new PlaneGeometry(600, 600, 100, 100);
        const plane = new Mesh(planeGeometry, this.material);
        plane.scale.set(4, 4, 1);
        this.groupHolder.add(plane);

        this.onParamsChange();
    }

    onParamsChange() {
        this.material.uniforms.lineCount.value = this.params.lineCount;
        this.material.uniforms.blur.value = this.params.blur;
        this.material.uniforms.noiseSize.value = this.params.noiseSize;
    }

    update(dt: number, app: any) {
        if (!this.groupHolder.visible) return;

        const volume = app.getVolume();
        const smoothedVolume = app.getSmoothedVolume();
        const renderTime = app.renderTime;

        // Simple rotate
        this.groupHolder.rotation.z += 0.002;

        // Auto Lerp
        if (this.params.auto) {
            const n1 = this.simplexNoise.noise(renderTime / 4, 0, 0) / 2 + 0.5;

            if (this.params.vizMode == 0) {
                this.params.lineSize = n1;
                this.params.dotSize = 0;
            } else if (this.params.vizMode == 1) {
                this.params.dotSize = n1 + 0.5;
                this.params.lineSize = 0;
            } else {
                this.params.lineSize = n1;
                this.params.dotSize = 1 - this.params.lineSize;
            }

            // Lerp other params (Simplified logic)
            // Original: vizParams.depth = ATUtil.lerp(simplexNoise.noise(VizHandler.getRenderTime()/4,10)/2 +.5,0,600);
            this.params.depth = (this.simplexNoise.noise(renderTime / 4, 10, 0) / 2 + 0.5) * 600;
            // ... omitting other strict lerps for brevity, sticking to main visual keys
        }

        this.material.uniforms.noiseTime.value += this.params.noiseSpeed / 1000;
        this.material.uniforms.lineTime.value += this.params.lineSpeed / 1000;

        // Audio Reactive
        this.material.uniforms.dotSize.value = this.params.dotSize * volume;
        this.material.uniforms.lineSize.value = this.params.lineSize * volume;
        this.material.uniforms.depth.value = this.params.depth * smoothedVolume * 2;
    }

    onBeat() {
        // Jump ripple pos
        this.material.uniforms.noiseTime.value = Math.random() * 10;

        if (this.params.auto && Math.random() < 0.5) {
            this.params.lineCount = Math.floor(Math.random() * (80 - 10 + 1)) + 10;
            this.params.vizMode = Math.floor(Math.random() * 2); // 0 or 1
            this.onParamsChange();
        }
    }
}
