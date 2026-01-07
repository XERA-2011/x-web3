import * as THREE from 'three';
import { NeroApp } from '../NeroApp';
import { ATUtil } from '../../common/ATUtil';
import { createNoise2D } from 'simplex-noise';

const ParticleImg = '/viz/nero/img/particle.png';

export class Stars {
    private app: NeroApp;
    private container: THREE.Object3D;
    private particles: THREE.Points;
    private geometry: THREE.BufferGeometry;
    private material: THREE.PointsMaterial;
    private particleData: { initPos: number }[] = [];
    private noise2D = createNoise2D();
    private renderTime = 0;

    public params = {
        on: true,
        size: 2.5,
        speed: 1,
        opacity: 1.0 // 提高透明度以增强可见性
    };

    private count = 300;  // 原版: h = 300
    private range = 1000; // 原版: k = 1e3

    constructor(app: NeroApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        // 原版: VizHandler.getVizHolder().add(f)
        this.app.vizHolder.add(this.container);

        // Setup Geometry
        this.geometry = new THREE.BufferGeometry();
        const positions: number[] = [];

        for (let i = 0; i < this.count; i++) {
            positions.push(
                ATUtil.randomRange(-this.range, this.range),
                ATUtil.randomRange(-this.range, this.range),
                ATUtil.randomRange(-this.range, this.range)
            );
            // 原版: j.push({ initPos: Math.random() })
            this.particleData.push({ initPos: Math.random() });
        }

        this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        // Material - 原版配置
        const texture = new THREE.TextureLoader().load(ParticleImg);
        this.material = new THREE.PointsMaterial({
            size: 100,  // 原版初始 size: 100
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            opacity: 1,
            color: 0xffffff
        });

        this.particles = new THREE.Points(this.geometry, this.material);
        // 原版: particles.position.z = -500
        this.particles.position.z = -500;
        this.container.add(this.particles);
    }

    update() {
        // 累计渲染时间，模拟原版的 VizHandler.getRenderTime()
        // 原版 VizHandler.update 中 k += 0.01
        this.renderTime += 0.01;

        // 原版: e = (simplexNoise.noise(VizHandler.getRenderTime() / 5, 0, 0) + 1) / 2
        // 原版: d.color.setHSL(e, .8, .8)
        const hue = (this.noise2D(this.renderTime / 5, 0) + 1) / 2;
        this.material.color.setHSL(hue, 0.8, 0.8);

        // 原版: d.opacity = g.opacity, d.size = 10 * g.size
        this.material.opacity = this.params.opacity;
        this.material.size = 10 * this.params.size;

        // Animate particles along Z axis
        // 原版: b = (a.initPos + VizHandler.getRenderTime() * g.speed / 10) % 1 * 3e3 - 1e3
        const positionAttribute = this.geometry.getAttribute('position');
        const positions = positionAttribute.array as Float32Array;

        for (let i = 0; i < this.count; i++) {
            const data = this.particleData[i];
            const z = ((data.initPos + this.renderTime * this.params.speed / 10) % 1) * 3000 - 1000;
            positions[i * 3 + 2] = z;
        }
        positionAttribute.needsUpdate = true;
    }
}
