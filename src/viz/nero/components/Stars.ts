import * as THREE from 'three';
import { NeroApp } from '../NeroApp';
import { ATUtil } from '../../common/ATUtil';
import ParticleImg from '../res/img/particle.png';

export class Stars {
    private app: NeroApp;
    private particles: THREE.Points;
    private geometry: THREE.BufferGeometry;
    private material: THREE.PointsMaterial;
    private positions: Float32Array;
    private count = 2000;

    constructor(app: NeroApp) {
        this.app = app;

        // Setup Geometry
        this.geometry = new THREE.BufferGeometry();
        const positions = [];
        this.positions = new Float32Array(this.count * 3);

        for (let i = 0; i < this.count; i++) {
            positions.push(ATUtil.randomRange(-2000, 2000));
            positions.push(ATUtil.randomRange(-2000, 2000));
            positions.push(ATUtil.randomRange(-2000, 2000));
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        // Material
        // Handle Next.js image import which can be object or string
        const imgSrc = (ParticleImg as any).src || ParticleImg;
        const texture = new THREE.TextureLoader().load(imgSrc);

        this.material = new THREE.PointsMaterial({
            size: 100,
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            color: 0xffffff
        });

        this.particles = new THREE.Points(this.geometry, this.material);
        this.app.scene.add(this.particles);
    }

    update() {
        const time = this.app.clock.getElapsedTime();
        this.material.color.setHSL(Math.sin(time * 0.1), 0.5, 0.5);

        this.particles.rotation.z = time * 0.05;

        // Animate particles (simple)
        // In BufferGeometry, accessing positions is harder than old geometry. 
        // For now, just rotating the whole cloud.
    }
}
