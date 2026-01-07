import {
    CatmullRomCurve3, Vector3, Color, RingGeometry, MeshBasicMaterial, Mesh, DoubleSide
} from 'three';
import { ClipBoxes } from './effects/ClipBoxes';
import { Rails } from './effects/Rails';
import { Ribbon } from './effects/Ribbon';
import { SpliceData } from './SpliceData';
import { SpliceApp } from './SpliceApp';
import { ImprovedNoise } from '../../viz/loop/ImprovedNoise';

// Simple Math Utils replacement
const randomRange = (min: number, max: number) => min + Math.random() * (max - min);

export class SpliceViz {
    private static instance: SpliceViz;

    private app: SpliceApp;

    // Effects
    clipBoxes: ClipBoxes;
    rails: Rails;
    ribbons: Ribbon[] = [];

    // Mover
    mover!: Mesh;
    private snoise = new ImprovedNoise();

    constructor(app: SpliceApp, clipBoxes: ClipBoxes, rails: Rails) {
        SpliceViz.instance = this;
        this.app = app;
        this.clipBoxes = clipBoxes;
        this.rails = rails;
    }

    onSequenceLoaded(data: any) {
        console.log("SpliceViz: Sequence Loaded");
        SpliceData.trackDuration = data.duration;
        const trackData = data.tracks;

        this.createSpline();

        // Init Effects
        this.rails.init();

        // Init Mover
        const geom = new RingGeometry(30, 50, 3, 2);
        const mat = new MeshBasicMaterial({
            color: 0xFFFFFF,
            wireframe: true,
            opacity: 0.2,
            transparent: true,
            side: DoubleSide
        });

        this.mover = new Mesh(geom, mat);
        this.mover.frustumCulled = false;
        this.mover.scale.multiplyScalar(0.2);
        this.app.vizHolder.add(this.mover); // Add to vizHolder instead of creating separate seqHolder for now

        // Tracks & Clips
        const hues = [71, 342, 284, 185, 138];
        let clipCount = 0;

        trackData.forEach((track: any, i: number) => {
            const trackCol = new Color();
            const r = i % hues.length;
            trackCol.setHSL(hues[r] / 360, 1, 0.6);

            const dist = 30;
            const ang = Math.random() * Math.PI * 2;
            const trackOffset = new Vector3(Math.cos(ang) * dist, Math.sin(ang) * dist, 0);

            SpliceData.tracks.push({
                offset: trackOffset,
                color: trackCol,
                size: track.size || 1
            });

            // Clips
            if (track.clips) {
                track.clips.forEach((clip: any) => {
                    const clipLen = clip.end - clip.start;
                    if (clip.notes && clip.notes.length > 1) {
                        clip.notes.forEach((note: any) => {
                            this.clipBoxes.addClip(clip.start + note.from / 1000, i);
                            clipCount++;
                        });
                    } else {
                        if (clipLen < 4) {
                            this.clipBoxes.addClip(clip.start, i);
                            clipCount++;
                        } else {
                            // Ribbon logic
                            const ribbon = new Ribbon(this.app, clip.start, clip.end, trackCol.clone(), trackOffset);
                            this.ribbons.push(ribbon);
                        }
                    }
                });
            }
        });

        this.clipBoxes.onClipsCreated();
        console.log(`Created ${clipCount} clips`);
    }

    createSpline() {
        const controlPoints: Vector3[] = [];
        const ZSTEP = 700;
        const MAX_RAILS_SIDE_STEP = 300;
        const CONTROL_COUNT = 40;

        const lastPos = new Vector3();
        for (let i = 0; i < CONTROL_COUNT; i++) {
            lastPos.x = randomRange(-MAX_RAILS_SIDE_STEP, MAX_RAILS_SIDE_STEP);
            lastPos.y = randomRange(-MAX_RAILS_SIDE_STEP, MAX_RAILS_SIDE_STEP);
            lastPos.z += ZSTEP;
            controlPoints.push(lastPos.clone());
        }

        // Straight start
        controlPoints[0].set(0, 0, ZSTEP);
        controlPoints[1].set(0, 0, ZSTEP * 2);

        SpliceData.splineCurve = new CatmullRomCurve3(controlPoints);
        SpliceData.splineCurve = new CatmullRomCurve3(controlPoints);
    }

    update(songPos: number) {
        if (!this.mover || !SpliceData.splineCurve) return;

        // Move Mover
        const point = SpliceData.splineCurve.getPoint(songPos);
        if (point) {
            this.mover.position.copy(point);
            const lookAtPoint = SpliceData.splineCurve.getPoint(songPos + 0.01);
            if (lookAtPoint) this.mover.lookAt(lookAtPoint);

            this.mover.position.y -= 5;
            this.mover.rotation.z = this.snoise.noise(songPos * 30, 100, 0) * Math.PI;
        }
    }

    getMoverPos() {
        return this.mover ? this.mover.position : new Vector3();
    }
}
