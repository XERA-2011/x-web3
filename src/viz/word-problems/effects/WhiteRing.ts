import {
    Object3D, MeshBasicMaterial, Mesh, RingGeometry
} from 'three';
// import { WordProblemsApp } from '../WordProblemsApp';

export class WhiteRing {
    groupHolder: Object3D;
    material!: MeshBasicMaterial;

    private shapes: Mesh[] = [];
    private scl = 0;
    private shapesCount = 0;

    constructor(scene: Object3D) {
        this.groupHolder = new Object3D();
        scene.add(this.groupHolder);
        this.init();
    }

    init() {
        const radius = 1000;

        this.material = new MeshBasicMaterial({
            color: 0xFFFFFF,
            wireframe: false,
            depthWrite: false,
            depthTest: false,
            transparent: true,
            opacity: 1
        });

        // empty square
        let geometry = new RingGeometry(radius * .6, radius, 4, 1, 0, Math.PI * 2);
        let mesh = new Mesh(geometry, this.material);
        this.groupHolder.add(mesh);
        this.shapes.push(mesh);

        // empty tri
        geometry = new RingGeometry(radius * .6, radius, 3, 1, 0, Math.PI * 2);
        mesh = new Mesh(geometry, this.material);
        this.groupHolder.add(mesh);
        this.shapes.push(mesh);

        this.shapesCount = this.shapes.length;
    }

    showNewShape() {
        // random rotation
        this.groupHolder.rotation.z = Math.random() * Math.PI;

        // hide shapes
        for (let i = 0; i < this.shapesCount; i++) {
            this.shapes[i].rotation.y = Math.PI / 2; // hiding by turning
        }

        // show a shape sometimes
        if (Math.random() < .5) {
            const r = Math.floor(Math.random() * this.shapesCount);
            this.shapes[r].rotation.y = Math.random() * Math.PI / 4 - Math.PI / 8;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update(dt: number, app: any) {
        this.groupHolder.rotation.z += 0.01;

        const gotoScale = app.getVolume() * 1.2 + 0.1;
        this.scl += (gotoScale - this.scl) / 3;

        this.groupHolder.scale.set(this.scl, this.scl, this.scl);
    }

    onBeat() {
        this.showNewShape();
    }
}
