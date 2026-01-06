import {
    Object3D, MeshBasicMaterial, PlaneGeometry, Mesh, Float32BufferAttribute, DynamicDrawUsage
} from 'three';
import { ImprovedNoise } from '../../loop/ImprovedNoise';
// import { WordProblemsApp } from '../WordProblemsApp';

export class Bars {
    groupHolder: Object3D;

    private BAR_COUNT = 16;
    private vertDistance = 0;
    private fillFactor = 0.8;
    private planeWidth = 2000;
    private segments = 10;

    private simplexNoise = new ImprovedNoise();

    constructor(scene: Object3D) {
        this.groupHolder = new Object3D();
        scene.add(this.groupHolder);
        this.init();
    }

    init() {
        this.groupHolder.position.z = 300;
        this.vertDistance = 1580 / this.BAR_COUNT;
        this.groupHolder.rotation.z = Math.PI / 4;

        for (let j = 0; j < this.BAR_COUNT; j++) {
            const planeMat = new MeshBasicMaterial({
                color: 0xebff33,
            });
            planeMat.color.setHSL(j / this.BAR_COUNT, 1.0, 0.5);

            // PlaneGeometry(width, height, widthSegments, heightSegments)
            const geometry = new PlaneGeometry(this.planeWidth, this.vertDistance, this.segments, this.segments);

            // Mark for dynamic updates
            // (geometry.attributes.position as any).usage = DynamicDrawUsage;

            const mesh = new Mesh(geometry, planeMat);
            mesh.position.y = this.vertDistance * j - this.vertDistance * this.BAR_COUNT / 2;
            mesh.scale.y = (j + 1) / this.BAR_COUNT * this.fillFactor;

            this.groupHolder.add(mesh);
        }
    }

    displaceMesh() {
        // rejigger z disps
        const MAX_DISP = Math.random() * 600;
        const rnd = Math.random();

        for (let j = 0; j < this.BAR_COUNT; j++) {
            const mesh = this.groupHolder.children[j] as Mesh;
            const geometry = mesh.geometry;
            const position = geometry.attributes.position;

            // position count ok?
            for (let i = 0; i < position.count; i++) {
                const x = position.getX(i);
                // simplexNoise noise(x, y, z)
                const disp = this.simplexNoise.noise(x / this.planeWidth * 100, rnd, 0) * MAX_DISP;
                position.setZ(i, disp);
            }
            position.needsUpdate = true;
        }
    }

    update(dt: number, app: any) { // app: WordProblemsApp (using any to avoid cycle)
        // slowly move up
        this.groupHolder.position.y = app.getBPMTime() * this.vertDistance; // simplified

        const levelsData = app.getLevelsData(); // Needs implementation in App
        if (levelsData) {
            // scale bars on levels
            for (let j = 0; j < this.BAR_COUNT; j++) {
                // Protected check in case arrays mismatched, though mostly safe
                if (j < this.groupHolder.children.length && j < levelsData.length) {
                    const val = levelsData[j];
                    this.groupHolder.children[j].scale.y = val * val + 0.00001;
                }
            }
        }
    }

    onBeat() {
        this.groupHolder.rotation.z = Math.PI / 4 * Math.floor(Math.random() * 4);
        // slight Y rotate
        const rRange = Math.PI / 4;
        this.groupHolder.rotation.y = Math.random() * (rRange * 2) - rRange;

        this.displaceMesh();
    }
}
