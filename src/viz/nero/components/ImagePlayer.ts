import * as THREE from 'three';
import { NeroApp } from '../NeroApp';

const SplashImg = '/viz/nero/img/nero-splash.png';

export class ImagePlayer {
    private app: NeroApp;
    private container: THREE.Object3D;
    private material: THREE.MeshBasicMaterial;
    private mesh: THREE.Mesh;

    public params = {
        on: true,
        freakOut: false
    };

    constructor(app: NeroApp) {
        this.app = app;
        this.container = new THREE.Object3D();
        // 添加到 vizHolder，原版: VizHandler.getScene().add(c) 实际上 main.js 里是 scene.add(c) 吗？
        // 查 main.js: 13513: c = new THREE.Object3D, VizHandler.getScene().add(c)
        // 看起来 ImagePlayer 是直接加到 Scene 的，不受 Tilt 影响？
        // 让我们再确认一下。
        // VizHandler的 update 旋转的是 j。
        // VizHandler init: h.add(j) ... activeViz[l].init()
        // Stars init: VizHandler.getVizHolder().add(f) -> f 加到了 j
        // ImagePlayer init: VizHandler.getScene().add(c) -> c 加到了 h (scene)

        // 等等！如 ImagePlayer 不受 Tilt 影响，那它就是静止的。
        // 原版代码：VizHandler.getScene() 返回的是 h。 VizHandler.getVizHolder() 返回的是 j。
        // ImagePlayer 这里写的是 VizHandler.getScene().add(c)

        // 既然如此，ImagePlayer 应该保持在 scene 中，不受 vizHolder 旋转影响。
        // 或者因为它是全屏覆盖的，所以无所谓？
        // 如果它是 800x600 的面片，并且位置在 z=0，那么相机动了它也会动（相对运动）。
        // 但如果它不在 vizHolder 里，vizHolder 转了它不转。

        // 让我们看看实际效果。如果 ImagePlayer 也要跟着转，那就加到 vizHolder。
        // 但原版代码写的是 VizHandler.getScene().add(c)。
        // 让我们保持 scene.add(this.container) 不变。
        this.app.scene.add(this.container);

        const texture = new THREE.TextureLoader().load(SplashImg);

        // 原版使用 AdditiveBlending 和 depthTest: false
        this.material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthTest: false
        });

        // 原版: PlaneGeometry(800, 600, 1, 1), scale.x = scale.y = 1.8
        const geometry = new THREE.PlaneGeometry(800, 600);
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.scale.set(1.8, 1.8, 1);
        this.container.add(this.mesh);

        // z = 0 意味着在相机前面，但不太靠前
        this.mesh.position.z = 0;
    }

    getMesh() {
        return this.mesh;
    }

    updateVisibility() {
        this.container.visible = this.params.on;
    }

    update() {
        // 原版没有在 update 中做什么特别的事情
    }
}
