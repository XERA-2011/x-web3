import {
    Object3D, LineBasicMaterial, Line, Vector3,
    BufferGeometry, Float32BufferAttribute,
    AdditiveBlending, DynamicDrawUsage
} from 'three';
import { ImprovedNoise } from './ImprovedNoise';

export class LoopVisualizer {
    loopHolder: Object3D;

    private RINGCOUNT = 60;
    private INIT_RADIUS = 50;
    private SEGMENTS = 512;
    private VOL_SENS = 2;
    private BIN_COUNT = 512;

    private rings: Line[] = [];
    private materials: LineBasicMaterial[] = [];
    private levels: number[] = [];
    private colors: number[] = [];

    private perlin = new ImprovedNoise();
    private noisePos = 0;

    private sharedGeometry: BufferGeometry | null = null;
    private basePositions: Vector3[] = [];

    constructor() {
        this.loopHolder = new Object3D();
    }

    init() {
        this.rings = [];
        this.materials = [];
        this.levels = [];
        this.colors = [];

        // 1. Create Shared Geometry
        this.sharedGeometry = new BufferGeometry();
        const positions: number[] = [];

        this.basePositions = [];

        for (let i = 0; i < this.SEGMENTS; i++) {
            const angle = (i / this.SEGMENTS) * Math.PI * 2;
            const x = Math.cos(angle) * this.INIT_RADIUS;
            const y = Math.sin(angle) * this.INIT_RADIUS;

            // Store base (x, y) for updates
            this.basePositions.push(new Vector3(x, y, 0));
            positions.push(x, y, 0);
        }

        // Close the loop (add first point at the end)
        this.basePositions.push(this.basePositions[0].clone());
        positions.push(positions[0], positions[1], positions[2]);

        this.sharedGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
        // Mark as dynamic for frequent updates
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.sharedGeometry.attributes.position as any).usage = DynamicDrawUsage;

        let scale = 1;

        // 2. Create Rings
        for (let i = 0; i < this.RINGCOUNT; i++) {
            const material = new LineBasicMaterial({
                color: 0xffffff,
                linewidth: 1,
                opacity: 1,
                blending: AdditiveBlending,
                transparent: true
            });

            const line = new Line(this.sharedGeometry, material);

            this.rings.push(line);
            this.materials.push(material);

            scale *= 1.02;
            line.scale.set(scale, scale, 1);

            this.loopHolder.add(line);

            this.levels.push(0);
            this.colors.push(0);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update(analyser: AnalyserNode, freqByteData: any, timeByteData: any) {
        if (!this.sharedGeometry) return;

        analyser.getByteFrequencyData(freqByteData);
        analyser.getByteTimeDomainData(timeByteData);

        // Get average level
        let sum = 0;
        for (let i = 0; i < this.BIN_COUNT; i++) {
            sum += freqByteData[i];
        }
        const aveLevel = sum / this.BIN_COUNT;
        const scaled_average = (aveLevel / 256) * this.VOL_SENS;
        this.levels.push(scaled_average);

        // Noise color pos
        this.noisePos += 0.005;
        const n = Math.abs(this.perlin.noise(this.noisePos, 0, 0));
        this.colors.push(n);

        this.levels.shift();
        this.colors.shift();

        // Update Geometry (Waveform)
        const positionAttribute = this.sharedGeometry.attributes.position;
        const positions = positionAttribute.array as Float32Array;

        for (let j = 0; j < this.SEGMENTS; j++) {
            // Original: loopGeom.vertices[j].z = (timeByteData[j]- 128); // remove stretch? original comment said "stretch by 2" but code didn't?
            // Original code: loopGeom.vertices[j].z = (timeByteData[j]- 128);

            // In BufferGeometry, index is j*3 + 2 for Z component
            positions[j * 3 + 2] = timeByteData[j] - 128;
        }

        // Link up last segment (close the loop)
        positions[this.SEGMENTS * 3 + 2] = positions[2]; // Z of first point

        positionAttribute.needsUpdate = true;

        // Update Rings (Colors, Opacity, Width)
        for (let i = 0; i < this.RINGCOUNT; i++) {
            const ringId = this.RINGCOUNT - i - 1; // Reverse order logic from original

            // Note: Original code had: 
            // for( i = 0; i < RINGCOUNT ; i++) {
            //   var ringId = RINGCOUNT - i - 1;
            //   var normLevel = levels[ringId] + 0.01;
            //   var hue = colors[i];
            //   ... 
            // }
            // So ring 0 gets level[59] and color[0]

            const normLevel = this.levels[ringId] + 0.01;
            const hue = this.colors[i];

            const mat = this.materials[i];
            mat.color.setHSL(hue, 1, normLevel);
            // mat.linewidth = normLevel * 3; // Note: GL_LINES linewidth is ignored in most modern WebGL implementations (always 1)
            mat.opacity = normLevel;

            // Scale Z
            this.rings[i].scale.z = normLevel / 3;
        }
    }

    // Auto tilt logic from original update() called from render()
    updateTilt(mouseX: number, mouseY: number, windowW: number, windowH: number) {
        const xrot = (mouseX / windowW) * Math.PI + Math.PI;
        const yrot = (mouseY / windowH) * Math.PI + Math.PI;

        // Simple damping
        this.loopHolder.rotation.x += (-yrot - this.loopHolder.rotation.x) * 0.3;
        this.loopHolder.rotation.y += (xrot - this.loopHolder.rotation.y) * 0.3;
    }

    remove() {
        // Cleanup if needed
        if (this.loopHolder) {
            this.loopHolder.clear();
        }
    }
}
