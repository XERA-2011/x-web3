import {
    Scene, Object3D, CircleGeometry, MeshBasicMaterial,
    Mesh, AdditiveBlending, Color
} from 'three';
import { VizEffect, VizParams } from '../core/VizEffect';
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
    private geometry: CircleGeometry | null = null;
    private material: MeshBasicMaterial | null = null;
    private holder: Object3D | null = null;

    private segments = 64;
    private beatOffset = 0;
    private noise2D = createNoise2D();

    init(scene: Scene, holder: Object3D, tumbler: Object3D) {
        // Original: VizHandler.getVizHolder().add(d) - uses holder, not tumbler
        this.holder = holder;

        // Original: l = new THREE.CircleGeometry(1e4, m, 0, 2*Math.PI)
        this.geometry = new CircleGeometry(10000, this.segments, 0, 2 * Math.PI);

        // Original: s = new THREE.MeshBasicMaterial({
        //   vertexColors: THREE.FaceColors, transparent: true, 
        //   blending: THREE.AdditiveBlending, depthTest: false
        // })
        // Note: FaceColors is deprecated in modern Three.js - we use vertex colors instead
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

        // Initialize vertex colors
        this.initColors();
        this.onToggle(this.params.on);
    }

    private initColors() {
        if (!this.geometry) return;

        const count = this.geometry.attributes.position.count;
        const colors = new Float32Array(count * 3);

        // Initialize all to black
        for (let i = 0; i < count * 3; i++) colors[i] = 0;

        this.geometry.setAttribute('color', new (require('three').Float32BufferAttribute)(colors, 3));
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

        // Original update logic:
        // for(i=0; i<m; ++i) {
        //   var e = (i + v) / m % 1  // v is beat counter
        //   var n = Math.floor(e * AudioHandler.levelsCount * 0.8)
        //   var o = AudioHandler.getLevelsData()[n]
        //   var a = 1.2 * o
        //   a = Math.min(a * a, 1)
        //   l.faces[i].color.setHSL(c.hue + i/m * c.hueRange, 1, a)
        // }

        // Center vertex stays black
        colors[0] = 0; colors[1] = 0; colors[2] = 0;

        // In modern Three.js CircleGeometry:
        // Vertex 0 = center
        // Vertices 1 to segments = rim points
        // We need to color each segment based on audio levels

        for (let i = 0; i < this.segments; i++) {
            // Calculate level index with beat offset
            const e = (i + this.beatOffset) / this.segments % 1;
            const levelIndex = Math.floor(e * audio.levelsCount * 0.8);
            const volume = audio.levelsData[levelIndex] || 0;

            let intensity = 1.2 * volume;
            intensity = Math.min(intensity * intensity, 1);

            const hue = this.params.hue + (i / this.segments) * this.params.hueRange;
            colorHelper.setHSL(hue, 1, intensity);

            // Each rim vertex (1 to segments inclusive)
            const vIndex = i + 1;
            colors[vIndex * 3] = colorHelper.r;
            colors[vIndex * 3 + 1] = colorHelper.g;
            colors[vIndex * 3 + 2] = colorHelper.b;
        }

        // Close loop - last vertex mirrors first rim vertex
        if (this.segments + 1 < colorAttr.count) {
            colors[(this.segments + 1) * 3] = colors[3];
            colors[(this.segments + 1) * 3 + 1] = colors[4];
            colors[(this.segments + 1) * 3 + 2] = colors[5];
        }

        colorAttr.needsUpdate = true;

        // AutoMode: Original line 956 - adjust hueRange and opacity based on noise
        // c.hueRange = (simplexNoise.noise(VizHandler.getNoiseTime() / 10, 65) + 1) / 2
        // c.opacity = (simplexNoise.noise(VizHandler.getNoiseTime() / 10, 55) + 1) / 2 + .3
        this.params.hueRange = (this.noise2D(noiseTime / 10, 65) + 1) / 2;
        this.params.opacity = (this.noise2D(noiseTime / 10, 55) + 1) / 2 + 0.3;
        this.material.opacity = this.params.opacity;
    }

    onBeat(audio: AudioAnalyzer) {
        // Original: if Math.random() < 0.5, rotation.z += random * PI * 2
        if (this.mesh && Math.random() < 0.5) {
            this.mesh.rotation.z += Math.random() * Math.PI * 2;
        }
        // Increment beat offset for color cycling
        this.beatOffset++;
    }

    onBPMBeat() {
        // Also increment on BPM beat
        this.beatOffset++;
    }

    onToggle(active: boolean) {
        this.params.on = active;
        if (this.mesh) this.mesh.visible = active;
    }

    getParams() { return this.params; }
}
