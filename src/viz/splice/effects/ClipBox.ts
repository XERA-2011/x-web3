import {
    Object3D, MeshBasicMaterial, Mesh, AdditiveBlending, SpriteMaterial, Sprite,
    TextureLoader, DoubleSide, BoxGeometry, TetrahedronGeometry, Texture
} from 'three';
import gsap from 'gsap';
import ParticleImg from '../../res/img/particle.png';

let glowTexture: Texture | null = null;
const boxSize = 5;
const clipBoxGeom1 = new BoxGeometry(boxSize, boxSize, boxSize);
const clipBoxGeom2 = new TetrahedronGeometry(boxSize);

export class ClipBox {
    group: Object3D;
    material: MeshBasicMaterial;
    mesh: Mesh;
    mesh2: Mesh;
    glow: Sprite;
    glowMaterial: SpriteMaterial;

    played = false;
    start = 0;

    constructor(parent: Object3D) {
        if (!glowTexture) {
            const imgSrc = (ParticleImg as any).src || ParticleImg;
            glowTexture = new TextureLoader().load(imgSrc);
        }

        this.group = new Object3D();
        parent.add(this.group);

        this.material = new MeshBasicMaterial({
            blending: AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            transparent: true,
            opacity: 0.3
        });

        // Geom
        const geom1 = Math.random() < 0.5 ? clipBoxGeom1 : clipBoxGeom2;
        const geom2 = Math.random() < 0.5 ? clipBoxGeom1 : clipBoxGeom2;

        this.mesh = new Mesh(geom1, this.material);
        this.mesh2 = new Mesh(geom2, this.material);
        this.group.add(this.mesh);
        this.group.add(this.mesh2);

        // Random rotate
        this.mesh.rotation.x = Math.random() * Math.PI * 2;
        this.mesh.rotation.y = Math.random() * Math.PI * 2;

        this.mesh2.rotation.x = Math.random() * Math.PI * 2;
        this.mesh2.rotation.y = Math.random() * Math.PI * 2;
        this.mesh2.rotation.z = Math.random() * Math.PI * 2;

        const mesh2Offset = 2;
        this.mesh2.position.set(
            (Math.random() - 0.5) * 2 * mesh2Offset,
            (Math.random() - 0.5) * 2 * mesh2Offset,
            (Math.random() - 0.5) * 2 * mesh2Offset
        );

        // Glow
        this.glowMaterial = new SpriteMaterial({
            map: glowTexture!,
            opacity: 0.05,
            blending: AdditiveBlending,
            fog: true
        });

        this.glow = new Sprite(this.glowMaterial);
        const scl = 40;
        this.glow.scale.set(scl, scl, scl);
        this.group.add(this.glow);
    }

    set(clipData: any) {
        this.start = clipData.start;
        this.group.position.copy(clipData.position);

        this.material.color.set(clipData.color);
        this.glowMaterial.color.set(clipData.color);

        this.played = false;

        const scl = (Math.random() * 0.4 + 0.4) * clipData.size;
        this.group.scale.set(scl, scl, scl);

        // Reset
        this.mesh.scale.set(1, 1, 1);
        this.mesh2.scale.set(1, 1, 1);
        this.glow.scale.set(40, 40, 40);
        this.material.opacity = 0.15;
        this.glowMaterial.opacity = 0.05;
    }

    explode() {
        this.played = true;

        const POP_TIME = 0.3;
        const scl1 = 6;
        const scl2 = 3;

        gsap.fromTo(this.mesh.scale, { x: scl1, y: scl1, z: scl1 }, { duration: POP_TIME, x: 1, y: 1, z: 1 });
        gsap.fromTo(this.mesh2.scale, { x: scl2, y: scl2, z: scl2 }, { duration: POP_TIME, x: 1, y: 1, z: 1, delay: 0.2 });
        gsap.fromTo(this.material, { opacity: 0.5 }, { duration: POP_TIME, opacity: 0.1 });

        const glowscl = 100;
        gsap.to(this.glow.scale, { duration: 0.3, x: glowscl, y: glowscl, ease: "expo.out" });
        gsap.fromTo(this.glowMaterial, { opacity: 0.05 }, { duration: 1, opacity: 0 });
    }

    update() {
        this.mesh.rotation.z += 0.05;
        this.mesh2.rotation.z += 0.02;
    }
}
