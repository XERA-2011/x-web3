export class AudioHandler {
    private context: AudioContext;
    private analyser: AnalyserNode;
    private gain: GainNode;
    private source: AudioBufferSourceNode | null = null;
    private audioBuffer: AudioBuffer | null = null;

    // Data arrays
    private freqByteData: Uint8Array;
    private timeByteData: Uint8Array;

    // Analysis data
    private levelsData: number[] = [];
    private volume = 0;
    private volumeHistory: number[] = [];

    // Config
    private binCount: number;
    private levelBinCount = 16;
    private historyLength = 256;
    private smoothing = 0.5;

    // Beat Detection
    private beatCutOff = 0;
    private beatThreshold = 0.3; // Default threshold, auto-adjusts
    private beatTime = 0;
    private beatHoldTime = 15; // Frames to hold before next beat
    private beatDecayRate = 0.98;

    // Status
    public isPlaying = false;
    public hasWebAudio = true;

    constructor() {
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.context.createAnalyser();
        this.analyser.smoothingTimeConstant = 0.3;
        this.analyser.fftSize = 1024;

        this.binCount = this.analyser.frequencyBinCount; // 512
        this.freqByteData = new Uint8Array(this.binCount);
        this.timeByteData = new Uint8Array(this.binCount);

        this.gain = this.context.createGain();
        this.analyser.connect(this.gain);
        this.gain.connect(this.context.destination);

        // Init levels
        for (let i = 0; i < this.levelBinCount; i++) {
            this.levelsData.push(0);
        }
        for (let i = 0; i < this.historyLength; i++) {
            this.volumeHistory.push(0);
        }
    }

    async loadAudio(url: string) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Failed to load audio:', error);
        }
    }

    play() {
        if (!this.audioBuffer) return;
        if (this.source) this.source.stop();

        this.source = this.context.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.connect(this.analyser);
        this.source.start(0);
        this.isPlaying = true;
    }

    update() {
        if (!this.isPlaying) return;

        this.analyser.getByteFrequencyData(this.freqByteData as any);
        this.analyser.getByteTimeDomainData(this.timeByteData as any);

        // Calculate levels (16 bins)
        const binSize = Math.floor(this.binCount / this.levelBinCount);
        let totalSum = 0;

        for (let i = 0; i < this.levelBinCount; i++) {
            let sum = 0;
            for (let j = 0; j < binSize; j++) {
                sum += this.freqByteData[i * binSize + j];
            }
            this.levelsData[i] = (sum / binSize) / 256; // Normalize 0-1
            totalSum += this.levelsData[i];
        }

        // Calculate overall volume
        const targetVolume = totalSum / this.levelBinCount;
        this.volume += (targetVolume - this.volume) * 0.1; // Smooth it

        // Update History
        this.volumeHistory.unshift(this.volume);
        if (this.volumeHistory.length > this.historyLength) {
            this.volumeHistory.pop();
        }

        // Simple Beat Detection
        if (this.volume > this.beatCutOff && this.volume > this.beatThreshold) {
            this.onBeat();
            this.beatCutOff = this.volume * 1.1;
            this.beatTime = 0;
        } else {
            if (this.beatTime <= this.beatHoldTime) {
                this.beatTime++;
            } else {
                this.beatCutOff *= this.beatDecayRate;
                this.beatCutOff = Math.max(this.beatCutOff, this.beatThreshold);
            }
        }
    }

    private onBeat() {
        window.dispatchEvent(new CustomEvent('onBeat'));
    }

    // Getters
    getVolume() { return this.volume; }
    getLevels() { return this.levelsData; }
    getVolumeHistory() { return this.volumeHistory; }

    resume() {
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    dispose() {
        if (this.source) this.source.stop();
        this.context.close();
    }
}
