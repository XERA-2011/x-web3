export class AudioHandler {
    private context: AudioContext;
    private analyser: AnalyserNode;
    private gainNode: GainNode;
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

    // Public params for GUI
    public params = {
        useMic: false,
        autoPlayAudio: false,
        showDebug: false,
        mute: false,
        gain: 1,
        beatHoldTime: 30,
        beatDecayRate: 0.97,
        beatThreshold: 0.15,
        smoothing: 0.5
    };

    // Beat Detection
    private beatCutOff = 0;
    private beatTime = 0;

    // Status
    public isPlaying = false;
    public hasWebAudio = true;

    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.analyser = this.context.createAnalyser();
        this.analyser.smoothingTimeConstant = 0.3;
        this.analyser.fftSize = 1024;

        this.binCount = this.analyser.frequencyBinCount; // 512
        this.freqByteData = new Uint8Array(this.binCount);
        this.timeByteData = new Uint8Array(this.binCount);

        this.gainNode = this.context.createGain();
        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.context.destination);

        // Init levels
        for (let i = 0; i < this.levelBinCount; i++) {
            this.levelsData.push(0);
        }
        for (let i = 0; i < this.historyLength; i++) {
            this.volumeHistory.push(0);
        }
    }

    updateMute() {
        this.gainNode.gain.value = this.params.mute ? 0 : this.params.gain;
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.analyser.getByteFrequencyData(this.freqByteData as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        if (this.volume > this.beatCutOff && this.volume > this.params.beatThreshold) {
            this.onBeat();
            this.beatCutOff = this.volume * 1.1;
            this.beatTime = 0;
        } else {
            if (this.beatTime <= this.params.beatHoldTime) {
                this.beatTime++;
            } else {
                this.beatCutOff *= this.params.beatDecayRate;
                this.beatCutOff = Math.max(this.beatCutOff, this.params.beatThreshold);
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
