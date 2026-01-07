import * as THREE from 'three';
import { SpliceApp } from '../SpliceApp';
import { SpliceViz } from '../SpliceViz';
import { SpliceData } from '../SpliceData';

export class Ribbon {
    private app: SpliceApp;
    private container: THREE.Object3D;
    private material!: THREE.MeshBasicMaterial;
    private mesh!: THREE.Mesh;
    private trackOffset: THREE.Vector3;

    constructor(app: SpliceApp, startTime: number, endTime: number, trackColor: THREE.Color, trackOffset: THREE.Vector3) {
        this.app = app;
        this.container = new THREE.Object3D();
        this.app.vizHolder.add(this.container);
        this.trackOffset = trackOffset;

        this.init(startTime, endTime, trackColor);
    }

    private init(startTime: number, endTime: number, trackColor: THREE.Color) {
        if (!SpliceData.splineCurve || !SpliceData.trackDuration) return;

        const startPos = startTime / SpliceData.trackDuration;
        const clipLen = (endTime - startTime) / SpliceData.trackDuration;

        this.material = new THREE.MeshBasicMaterial({
            color: trackColor,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            transparent: true,
            opacity: 0.2 + Math.random() * 0.8
        });

        const controlPoints: THREE.Vector3[] = [];
        const pointCount = Math.floor(clipLen * 1000); // Or adjust for path resolution

        for (let i = 0; i < pointCount; i++) {
            const t = startPos + (clipLen / pointCount) * i;
            const point = SpliceData.splineCurve.getPoint(t);
            point.add(this.trackOffset);
            controlPoints.push(point);
        }

        if (controlPoints.length < 2) return;

        const splineCurve = new THREE.CatmullRomCurve3(controlPoints);
        const thickness = Math.random() * 2.4 + 0.8;
        const geometry = new THREE.TubeGeometry(splineCurve, pointCount * 2, thickness, 3, false); // Removed debug param (true)

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.container.add(this.mesh);
    }
}
