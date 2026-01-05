
export class BPMManager {
    bpm: number = 120;
    beatDuration: number = 500; // ms
    intervalId: any;
    lastBeatTime: number = 0;

    events: { onBPMBeat: () => void } = { onBPMBeat: () => { } };

    constructor() {
    }

    setBPM(bpm: number) {
        this.bpm = bpm;
        this.beatDuration = 60000 / bpm;
        this.restartInterval();
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
}
