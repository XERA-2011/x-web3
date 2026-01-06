

export class BPMManager {
    bpm: number = 120;
    beatDuration: number = 500; // ms
    intervalId: any;
    lastBeatTime: number = 0;

    // Tap tempo
    private tapCount: number = 0;
    private firstTapTime: number = 0;
    private lastTapTimestamp: number = 0;

    events: { onBPMBeat: () => void } = { onBPMBeat: () => { } };

    constructor() {
    }

    setBPM(bpm: number) {
        this.bpm = bpm;
        this.beatDuration = 60000 / bpm;
        this.restartInterval();
        console.log(`BPM set to: ${bpm}`);
    }

    restartInterval() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = setInterval(this.tick.bind(this), this.beatDuration);
    }

    tick() {
        this.lastBeatTime = Date.now();
        this.events.onBPMBeat();
    }

    getBPMTime(): number {
        // 0 to 1 progress within a beat
        const time = Date.now();
        return (time - this.lastBeatTime) / this.beatDuration;
    }

    onBPMTap() {
        const now = Date.now();

        // Reset if more than 2 seconds since last tap
        if (now - this.lastTapTimestamp > 2000) {
            this.tapCount = 0;
        }

        if (this.tapCount === 0) {
            this.firstTapTime = now;
            this.tapCount = 1;
        } else {
            const elapsed = now - this.firstTapTime;
            const calculatedBPM = Math.round((60000 * this.tapCount) / elapsed);
            this.setBPM(calculatedBPM);
            this.tick(); // Trigger beat
            this.tapCount++;
        }

        this.lastTapTimestamp = now;
    }
}
