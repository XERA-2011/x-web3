import * as THREE from 'three';
import { NeroApp } from '../NeroApp';
import { ATUtil } from '../../common/ATUtil';

class Segment {
    public center: THREE.Object3D;
    public plane: THREE.Mesh;
    private speed: number;
    private smoothedScale = 1;
    private gotoScale = 1;

    constructor(material: THREE.Material) {
        this.center = new THREE.Object3D();
        this.speed = ATUtil.randomRange(0.01, 0.05);
        if (Math.random() > 0.5) this.speed = -this.speed;

        this.center.rotation.y = -Math.PI / 2;

        const radius = 400 + ATUtil.randomRange(-150, 150);
        // SphereGeometry args: radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength
        const geometry = new THREE.SphereGeometry(
            radius,
            30,
            1,
            ATUtil.randomRange(0, 2 * Math.PI),
            ATUtil.randomRange(Math.PI / 4, Math.PI),
            ATUtil.randomRange(Math.PI / 16, 15 * Math.PI / 16),
            ATUtil.randomRange(Math.PI / 48, Math.PI / 16)
        );

        this.plane = new THREE.Mesh(geometry, material);
        this.center.add(this.plane);
    }

    setScale() {
        this.gotoScale = ATUtil.randomRange(0.4, 1);
    }

    update() {
        this.center.rotation.y += this.speed;
        this.smoothedScale += (this.gotoScale - this.smoothedScale) / 8;
        this.center.scale.set(this.smoothedScale, this.smoothedScale, this.smoothedScale);
    }
}

export class Segments {
    private app: NeroApp;
    private container: THREE.Object3D;
    private segments: Segment[] = [];
    private material: THREE.MeshNormalMaterial;

    private count = 40;

    // Strobe logic
    private strobeCounter = 0;
    private k = 1; // current global scale
    private l = 1; // target global scale

    public params = {
        on: false,
        useAudio: true,
        scale: 1,
        strobe: false
    };

    constructor(app: NeroApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        this.app.scene.add(this.container);

        this.material = new THREE.MeshNormalMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            opacity: ATUtil.randomRange(0.2, 0.6)
        });

        for (let i = 0; i < this.count; i++) {
            const seg = new Segment(this.material);
            this.segments.push(seg);
            this.container.add(seg.center);
        }

        this.updateVisibility();
    }

    updateVisibility() {
        this.container.visible = this.params.on;
    }

    onBeat() {
        if (Math.random() < 0.3) {
            this.l = ATUtil.randomRange(2, 8); // Randomize target global scale
        }

        for (const seg of this.segments) {
            seg.setScale();
        }
    }

    update() {
        if (!this.params.on) {
            if (this.container.visible) this.container.visible = false;
            return;
        }
        this.container.visible = true;

        // Strobe logic
        if (this.params.strobe) {
            this.strobeCounter++;
            this.strobeCounter %= 4;
            if (this.strobeCounter > 1) {
                this.container.rotation.x += Math.PI;
            }
        }

        // Smooth global scale
        this.k += (this.l - this.k) / 15;
        this.container.scale.set(this.k, this.k, this.k);

        for (const seg of this.segments) {
            seg.update();
        }
    }
}
