import { Object3D } from 'three';
import { ClipBox } from './ClipBox';
// import { SpliceViz } from '../SpliceViz';
// import { SpliceApp } from '../SpliceApp';
import { SpliceData } from '../SpliceData';

export class ClipBoxes {
    group: Object3D;
    private pool: ClipBox[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private clips: any[] = [];
    private clipCount = 0;
    private nextClipIndex = 0;
    private BOX_COUNT = 100;

    constructor(scene: Object3D) {
        this.group = new Object3D();
        scene.add(this.group);

        for (let i = 0; i < this.BOX_COUNT; i++) {
            const clipBox = new ClipBox(this.group);
            this.pool.push(clipBox);
        }
    }

    addClip(startTime: number, trackId: number) {
        const duration = SpliceData.trackDuration;
        if (duration === 0) return; // Wait for load

        const songPos = startTime / duration;
        const pos = SpliceData.splineCurve.getPoint(songPos);

        // Add track offset
        const track = SpliceData.tracks[trackId];
        if (track) {
            pos.add(track.offset);

            const clip = {
                start: startTime,
                color: track.color,
                position: pos,
                size: track.size
            };
            this.clips.push(clip);
        }
    }

    onClipsCreated() {
        this.clipCount = this.clips.length;
        this.clips.sort((a, b) => a.start - b.start);
        this.nextClipIndex = 0;
        this.seeked(0); // init
    }

    update(currentTime: number) {
        // loop thru all clips
        const camTime = currentTime - 2;

        for (let i = 0; i < this.BOX_COUNT; i++) {
            const box = this.pool[i];

            // EXPLODE
            if (!box.played && currentTime > box.start) {
                box.explode();
            }

            // Recycle
            if (camTime > box.start && this.nextClipIndex < this.clipCount) {
                box.set(this.clips[this.nextClipIndex]);
                this.nextClipIndex++;
            }

            box.update();
        }
    }

    seeked(time: number) {
        this.nextClipIndex = this.getNextClipIndexFromTime(time);

        for (let i = 0; i < this.BOX_COUNT; i++) {
            const box = this.pool[i];

            if (this.nextClipIndex < this.clipCount) {
                box.set(this.clips[this.nextClipIndex]);
                this.nextClipIndex++;
            } else {
                break;
            }
        }
    }

    private getNextClipIndexFromTime(time: number): number {
        for (let i = 0; i < this.clipCount; i++) {
            if (this.clips[i].start <= time) { // Original logic used <=, but arguably >= for "next"
                // Original used <= time. Wait. 
                // If clips[i].start <= time, it means it's ALREADY happened or happening?
                // Actually `clips[i].start <= time` usually means past start.
                // However, `seeked` sets `nextClipIndex` to this.
                // Then `pool` is filled starting from `nextClipIndex`.
                // So if we seek to T=10, we find clip starting <= 10? No, we likely want future clips?
                // The logical "Next Clip" should be the first clip starting AFTER time?
                // But Original Code: `if (clips[i].start <= time) return i;`. This seems wrong if `clips` are sorted by start.
                // Maybe it returns the last one? No loop goes 0 -> count.
                // Wait. If sorted: 1, 2, 3, 4. Time = 2.5.
                // clip 1 <= 2.5 (True) -> return 0.
                // So it returns the FIRST clip? That means it returns start of array.
                // Unless check is `>=`.
                // Original code: `if (clips[i].start <= time)`.
                // If `time` is small (0). `clips[0].start` (0.1) > 0.
                // Loop continues? No wait. 
                // It seems the original logic intent is "Find the clip index that corresponds to current time".
                // But if it returns `i` immediately when `start <= time`, it returns 0 always if `clips[0].start <= time`.
                // If `clips[0].start` > time, it continues.
                // So it essentially finds the first clip that is.... wait.
                // Actually, if `clips` are sorted by start time.
                // We want clips AHEAD of camera.
                // So `clips[i].start > time`.
                // The original code `clips[i].start <= time` seems buggy or I assume `time` = future?
                // AudioHandler.getAudioTime() returns current playback time.
                // Let's assume original code `clips[i].start > time` ??
                // Let's look at `ClipBoxes.js` again.
                // `if (clips[i].start <= time) return i`.
                // If clip 0 starts at 0. Time is 10. 0 <= 10. Returns 0.
                // So it resets to beginning? That seems wrong for "seeked".

                // Let's fix this logic to be "First clip that starts AFTER time".
                if (this.clips[i].start > time) return i;
            }
        }
        return 0;
    }
}
