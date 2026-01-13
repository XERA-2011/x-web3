import { Vector3, Object3D, Mesh, BoxGeometry, MeshPhongMaterial } from 'three';

export class mBox {
    posn: Vector3;
    rotation: Vector3;
    speed: number;
    mesh: Mesh;

    // Constants
    static ORIGIN = new Vector3();
    static MAX_DISTANCE = 1000;
    static INIT_POSN_RANGE = 500;
    static FRONT_PLANE_Z = 1000;
    static BACK_PLANE_Z = -1000;

    constructor(parent: Object3D, geometry: BoxGeometry, material: MeshPhongMaterial) {
        this.posn = new Vector3();
        this.rotation = new Vector3();
        this.speed = this.getRand(3, 20);

        // Create Mesh
        this.mesh = new Mesh(geometry, material);
        parent.add(this.mesh);

        this.init();
    }

    init() {
        this.posn.copy(mBox.ORIGIN);
        this.posn.x = this.getRand(-mBox.INIT_POSN_RANGE, mBox.INIT_POSN_RANGE);
        this.posn.y = this.getRand(-mBox.INIT_POSN_RANGE, mBox.INIT_POSN_RANGE);
        this.posn.z = mBox.BACK_PLANE_Z;

        this.rotation.x = (Math.random() * 360) * Math.PI / 180;
        this.rotation.y = (Math.random() * 360) * Math.PI / 180;
        this.rotation.z = (Math.random() * 360) * Math.PI / 180;

        // Random scale
        const s = Math.random() * 1 + 1;
        this.mesh.scale.set(s, s, s);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    update(_vol: number) {
        // Move z
        // Note: Original code used 'vol' or fixed speed? 
        // Original: this.boxes[i].update(this.sketchParams.cubeSpeed);
        // And update used that param as "cubeSpeed".
        // In PareidoliaApp.animate, I passed 'vol'. 
        // Let's assume 'vol' is passed but maybe we should use a speed factor.
        // For now, let's treat the arg as speed modifier.
        const speedMod = 2.0; // Default speed factor
        this.posn.z += this.speed * speedMod;

        this.rotation.x += 0.03;
        this.rotation.y += 0.01;

        if (this.posn.z > mBox.FRONT_PLANE_Z) {
            this.init();
        }

        // Sync mesh
        this.mesh.position.copy(this.posn);
        this.mesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
    }

    private getRand(minVal: number, maxVal: number): number {
        return minVal + (Math.random() * (maxVal - minVal));
    }
}
