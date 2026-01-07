import * as THREE from 'three';
import { SpliceApp } from '../SpliceApp';
import { SpliceData } from '../SpliceData';

const TubeTexture = '/viz/splice/img/card2.jpg';

export class Tubes {
    private app: SpliceApp;
    private container: THREE.Object3D;
    private material: THREE.MeshBasicMaterial;
    private tubeTexture: THREE.Texture;
    private tubes: THREE.Mesh[] = [];
    private mytime = 0;

    constructor(app: SpliceApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        this.app.vizHolder.add(this.container);

        this.tubeTexture = new THREE.TextureLoader().load(TubeTexture);
        this.tubeTexture.wrapS = this.tubeTexture.wrapT = THREE.RepeatWrapping;

        this.material = new THREE.MeshBasicMaterial({
            wireframe: false,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide,
            map: this.tubeTexture
        });
    }

    init() {
        if (!SpliceData.splineCurve || !SpliceData.trackDuration) return;

        this.createTube(72.5 / SpliceData.trackDuration);
        this.createTube(162.5 / SpliceData.trackDuration);
    }

    private createTube(startPos: number) {
        if (!SpliceData.splineCurve || !SpliceData.trackDuration) return;

        const controlPoints: THREE.Vector3[] = [];
        const pointCount = 10;
        const clipLen = 2.0 / SpliceData.trackDuration;

        for (let i = 0; i < pointCount; i++) {
            const t = startPos + (clipLen / pointCount) * i;
            const point = SpliceData.splineCurve.getPoint(t);
            controlPoints.push(point);
        }

        const tubeCurve = new THREE.CatmullRomCurve3(controlPoints);
        const tubeGeom = new THREE.TubeGeometry(tubeCurve, pointCount * 2, 30, 32, false);
        const tube = new THREE.Mesh(tubeGeom, this.material);
        this.container.add(tube);
        this.tubes.push(tube);
    }

    update() {
        this.mytime += 0.4;
        this.tubeTexture.offset.x = (this.tubeTexture.offset.x + 0.008) % 1;
        this.tubeTexture.offset.y = (this.tubeTexture.offset.y + 0.002) % 1;
    }
}
