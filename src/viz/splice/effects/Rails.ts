import {
    Object3D, LineBasicMaterial, BufferGeometry, Vector3, Line, MeshBasicMaterial, Mesh, RingGeometry, AdditiveBlending, DoubleSide
} from 'three';
import { SpliceData } from '../SpliceData';

export class Rails {
    group: Object3D;

    constructor(scene: Object3D) {
        this.group = new Object3D();
        scene.add(this.group);
    }

    init() {
        const pointCount = 60 * 120; // Resolution

        // LINE TRACK
        const trackMaterial = new LineBasicMaterial({
            color: 0xFFFFFF,
            linewidth: 4, // Note: WebGL linewidth limitations apply
            blending: AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.4
        });

        // Points
        const points: Vector3[] = [];
        points.push(new Vector3(0, 0, -500)); // Start point

        const splinePoints = SpliceData.splineCurve.getPoints(pointCount);
        points.push(...splinePoints);

        const trackGeometry = new BufferGeometry().setFromPoints(points);
        const track = new Line(trackGeometry, trackMaterial);
        track.frustumCulled = false;
        track.position.y = -5;
        this.group.add(track);


        // BEAT RINGS
        const beatsPerSecond = 128 / 60; // Scream BPM approx?
        const beatTime = 1 / beatsPerSecond;
        const duration = SpliceData.trackDuration;

        // Rings every 4 beats
        const ringsGeom = new RingGeometry(30, 30.5, 64, 2);
        const ringMat = new MeshBasicMaterial({
            color: 0xFFFFFF,
            opacity: 0.3,
            transparent: true,
            blending: AdditiveBlending,
            depthTest: false,
            side: DoubleSide
        });

        const beatsPerRing = 4;
        const numBeats = Math.floor(duration / (beatTime * beatsPerRing));

        for (let i = 0; i < numBeats; i++) {
            if (i % 4 === 0) continue;

            const t = (i * beatTime * beatsPerRing) / duration;
            if (t > 1) break;

            const ring = new Mesh(ringsGeom, ringMat);
            const pos = SpliceData.splineCurve.getPoint(t);
            ring.position.copy(pos);
            ring.lookAt(SpliceData.splineCurve.getPoint(Math.min(t + 0.01, 1)));
            this.group.add(ring);
        }

        // Squares usually
        // ... (Skipping squares for brevity or implementing if easy)
        // 4 squares every 16 beats
        const squareGeom = new RingGeometry(40, 40.5, 4, 2);
        // Note: RingGeometry with thetaSegments=4 creates a square if rotated correctly (Standard Ring is circular).

        const beatsPerSquare = 16;
        const numSquares = Math.floor(duration / (beatTime * beatsPerSquare));

        for (let i = 0; i < numSquares; i++) {
            const t = (i * beatTime * beatsPerSquare) / duration;
            if (t > 1) break;

            for (let j = 0; j < 4; j++) {
                const ring = new Mesh(squareGeom, ringMat);
                const pos = SpliceData.splineCurve.getPoint(Math.min(t + 0.0002 * j, 1));
                ring.position.copy(pos);
                ring.lookAt(SpliceData.splineCurve.getPoint(Math.min(t + 0.0002 * j + 0.01, 1)));
                this.group.add(ring);
            }
        }
    }
}
