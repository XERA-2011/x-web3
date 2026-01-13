import {
    Scene, Object3D, BufferGeometry, MeshBasicMaterial,
    Mesh, AdditiveBlending, Color, Float32BufferAttribute
} from 'three';
import { VizEffect } from '../core/VizEffect';
import { AudioAnalyzer } from '../core/AudioAnalyzer';
import { createNoise2D } from 'simplex-noise';

export class ColorWheel implements VizEffect {
    name = "ColorWheel";
    params = {
        on: false,
        hue: 0,
        hueRange: 1,
        opacity: 0.7,
        useTrackHue: false
    };

    private mesh: Mesh | null = null;
    private geometry: BufferGeometry | null = null;
    private material: MeshBasicMaterial | null = null;
    private holder: Object3D | null = null;

    private segments = 64; // Same as original: m = AudioHandler.levelsCount = 64
    private beatOffset = 0;
    private noise2D = createNoise2D();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    init(scene: Scene, holder: Object3D, _tumbler: Object3D) {
        // Original: VizHandler.getVizHolder().add(d) - uses holder, not tumbler
        this.holder = holder;

        // Create a custom BufferGeometry where each segment has its own vertices
        // This allows us to set a single color per segment (simulating FaceColors)
        this.geometry = new BufferGeometry();

        const radius = 10000; // Original: 1e4
        const vertices: number[] = [];
        const colors: number[] = [];

        // For each segment, create a triangle (center, edge1, edge2)
        // This gives us 3 vertices per segment, each with the same color
        for (let i = 0; i < this.segments; i++) {
            const angle1 = (i / this.segments) * Math.PI * 2;
            const angle2 = ((i + 1) / this.segments) * Math.PI * 2;

            // Center vertex
            vertices.push(0, 0, 0);
            // Edge vertex 1
            vertices.push(Math.cos(angle1) * radius, Math.sin(angle1) * radius, 0);
            // Edge vertex 2
            vertices.push(Math.cos(angle2) * radius, Math.sin(angle2) * radius, 0);

            // All 3 vertices of this triangle get the same color (simulating FaceColors)
            colors.push(0, 0, 0); // Will be updated in update()
            colors.push(0, 0, 0);
            colors.push(0, 0, 0);
        }

        this.geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        this.geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

        // Original: s = new THREE.MeshBasicMaterial({
        //   vertexColors: THREE.FaceColors, transparent: true, 
        //   blending: THREE.AdditiveBlending, depthTest: false
        // })
        this.material = new MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            blending: AdditiveBlending,
            depthTest: false,
            opacity: this.params.opacity
        });

        this.mesh = new Mesh(this.geometry, this.material);
        // Original: u.rotation.z = Math.PI/2 + 2*Math.PI/24
        this.mesh.rotation.z = Math.PI / 2 + 2 * Math.PI / 24;
        this.holder.add(this.mesh);

        this.onToggle(this.params.on);
    }

    update(dt: number, audio: AudioAnalyzer, noiseTime: number) {
        if (!this.mesh || !this.geometry || !this.material) return;

        this.material.opacity = this.params.opacity;
        // Original: u.rotation.z -= 0.005
        this.mesh.rotation.z -= 0.005;

        const colorAttr = this.geometry.attributes.color;
        if (!colorAttr) return;
        const colors = colorAttr.array as Float32Array;
        const colorHelper = new Color();

        // Original update logic (line 949-954):
        // for(i=0; i<m; ++i) {
        //   var e = (i + v) / m % 1  // v is beat counter
        //   var n = Math.floor(e * AudioHandler.levelsCount * 0.8)
        //   var o = AudioHandler.getLevelsData()[n]
        //   var a = 1.2 * o
        //   a = Math.min(a * a, 1)
        //   l.faces[i].color.setHSL(c.hue + i/m * c.hueRange, 1, a)
        // }

        for (let i = 0; i < this.segments; i++) {
            // Calculate level index with beat offset
            const e = (i + this.beatOffset) / this.segments % 1;
            const levelIndex = Math.floor(e * audio.levelsCount * 0.8);
            const volume = audio.levelsData[levelIndex] || 0;

            let intensity = 1.2 * volume;
            intensity = Math.min(intensity * intensity, 1);

            const hue = this.params.hue + (i / this.segments) * this.params.hueRange;
            colorHelper.setHSL(hue, 1, intensity);

            // Each triangle has 3 vertices, all get the same color (FaceColors simulation)
            const baseIndex = i * 3 * 3; // 3 vertices * 3 components
            for (let v = 0; v < 3; v++) {
                colors[baseIndex + v * 3] = colorHelper.r;
                colors[baseIndex + v * 3 + 1] = colorHelper.g;
                colors[baseIndex + v * 3 + 2] = colorHelper.b;
            }
        }

        colorAttr.needsUpdate = true;

        // AutoMode: Original line 956 - adjust hueRange and opacity based on noise
        // Only in autoMode: c.hueRange = (simplexNoise.noise(VizHandler.getNoiseTime() / 10, 65) + 1) / 2
        // c.opacity = (simplexNoise.noise(VizHandler.getNoiseTime() / 10, 55) + 1) / 2 + .3
        this.params.hueRange = (this.noise2D(noiseTime / 10, 65) + 1) / 2;
        this.params.opacity = (this.noise2D(noiseTime / 10, 55) + 1) / 2 + 0.3;
        this.material.opacity = this.params.opacity;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onBeat(_audio: AudioAnalyzer) {
        // Original: if Math.random() < 0.5, rotation.z += random * PI * 2
        // Note: Original condition was "Math.random() < .5 || ..." which means 50% chance to skip
        if (this.mesh && Math.random() >= 0.5) {
            this.mesh.rotation.z += Math.random() * Math.PI * 2;
        }
    }

    onBPMBeat() {
        // Original: o() increments v += 1
        this.beatOffset++;
    }

    onToggle(active: boolean) {
        this.params.on = active;
        if (this.mesh) this.mesh.visible = active;
    }

    getParams() { return this.params; }
}
