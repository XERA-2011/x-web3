import {
    CatmullRomCurve3, Vector3, Color
} from 'three';
import { ClipBoxes } from './effects/ClipBoxes';
import { Rails } from './effects/Rails';
import { SpliceData } from './SpliceData';

// Simple Math Utils replacement
const randomRange = (min: number, max: number) => min + Math.random() * (max - min);

export class SpliceViz {
    private static instance: SpliceViz;

    // Effects
    clipBoxes: ClipBoxes;
    rails: Rails;

    constructor(scene: any, clipBoxes: ClipBoxes, rails: Rails) {
        SpliceViz.instance = this;
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

        // Tracks & Clips
        const hues = [71, 342, 284, 185, 138];
        let clipCount = 0;

        trackData.forEach((track: any, i: number) => {
            const trackCol = new Color();
            const r = Math.floor(Math.random() * hues.length);
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
                        }
                        // Ribbon logic omitted for now
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
    }
}
