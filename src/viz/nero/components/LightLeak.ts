import * as THREE from 'three';
import { NeroApp } from '../NeroApp';
import { ATUtil } from '../../common/ATUtil';

const LEAK_IMAGES = [
    '/viz/nero/img/light-leak/leak00.jpg',
    '/viz/nero/img/light-leak/leak01.jpg',
    '/viz/nero/img/light-leak/leak02.jpg',
    '/viz/nero/img/light-leak/leak03.jpg'
];

export class LightLeak {
    private app: NeroApp;
    private container: THREE.Object3D;
    private mesh: THREE.Mesh;
    private textures: THREE.Texture[] = [];
    private material: THREE.MeshBasicMaterial;
    private freakOutFlip = true;
    private count = 4;

    public params = {
        on: true,
        freakOut: false,
        opacity: 0.15  // 大幅降低透明度以匹配原版微弱效果
    };

    constructor(app: NeroApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        // 原版: VizHandler.getScene().add(g)
        this.app.scene.add(this.container);

        // 加载纹理
        const loader = new THREE.TextureLoader();
        for (let i = 0; i < this.count; i++) {
            this.textures[i] = loader.load(LEAK_IMAGES[i]);
        }

        // 原版材质配置
        this.material = new THREE.MeshBasicMaterial({
            map: this.textures[0],
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 0.2  // 原版初始 opacity
        });

        // 原版: PlaneGeometry(800, 600), scale = 10, position.z = -1000
        const geometry = new THREE.PlaneGeometry(800, 600);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.scale.set(10, 10, 1);
        this.container.add(this.mesh);

        // 放在场景后面
        this.mesh.position.z = -1000;

        // 初始化随机状态
        this.randomize();
    }

    private randomize() {
        // 原版: g.rotation.z = Math.random() * Math.PI * 2
        this.container.rotation.z = Math.random() * Math.PI * 2;
        // 原版: i.map = j[ATUtil.randomInt(0, k - 1)]
        this.material.map = this.textures[ATUtil.randomInt(0, this.count - 1)];
    }

    onBeat() {
        // 原版: Math.random() < .7 || b() - 30%概率触发
        if (Math.random() >= 0.7) {
            this.randomize();
        }
    }

    update() {
        // 原版: g.rotation.z += .005
        this.container.rotation.z += 0.005;

        // 原版: m.freakOut ? (l = !l, i.opacity = l ? 0 : 1) : i.opacity = m.opacity
        if (this.params.freakOut) {
            this.freakOutFlip = !this.freakOutFlip;
            this.material.opacity = this.freakOutFlip ? 0 : 1;
        } else {
            this.material.opacity = this.params.opacity;
        }
    }
}
