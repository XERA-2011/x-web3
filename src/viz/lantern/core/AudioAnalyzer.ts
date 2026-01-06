
import { DataTexture, RGBFormat } from 'three';
import { ATUtil } from './ATUtil';

export interface AudioParams {
    gain: number;
    beatHoldTime: number;
    beatThreshold: number;
    beatDecayRate: number;
    smoothing: number;
    drawAudio: boolean;
    useAudioElement: boolean;
}

export class AudioAnalyzer {
    context: AudioContext | null = null;
    gainNode: GainNode | null = null;
    analyser: AnalyserNode | null = null;
    source: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | AudioBufferSourceNode | null = null;

    freqByteData: Uint8Array | null = null;
    timeByteData: Uint8Array | null = null;
    levelsData: number[] = [];
    volumeHistory: number[] = [];
    smoothedVolumeHistory: number[] = [];

    levelsTexture: DataTexture | null = null;
    levelsTextureData: Uint8Array | null = null;

    volume = 0;
    smoothedVolume = 0;
    beatCutOff = 0;
    beatTime = 0;

    levelsCount = 64;
    binCount = 0;
    levelBins = 0;

    params: AudioParams = {
        gain: 0.9,
        beatHoldTime: 50,
        beatThreshold: 0.05,
        beatDecayRate: 0.97,
        smoothing: 0.5,
        drawAudio: true,
        useAudioElement: false,
    };

    events: { onBeat: () => void } = { onBeat: () => { } };

    constructor() { }

    init(): boolean {
        try {
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContextClass();
        } catch (e) {
            console.error("Web Audio API not supported", e);
            return false;
        }

        if (!this.context) return false;

        this.gainNode = this.context.createGain();
        this.gainNode.connect(this.context.destination);

        this.analyser = this.context.createAnalyser();
        this.analyser.smoothingTimeConstant = 0.3;
        this.analyser.fftSize = 1024;

        this.binCount = this.analyser.frequencyBinCount;
        this.levelBins = Math.floor(this.binCount / this.levelsCount);

        this.freqByteData = new Uint8Array(this.binCount);
        this.timeByteData = new Uint8Array(this.binCount);

        for (let i = 0; i < 256; i++) {
            this.volumeHistory.push(0);
            this.smoothedVolumeHistory.push(0);
        }

        for (let i = 0; i < this.levelsCount; i++) {
            this.levelsData.push(0);
        }

        this.levelsTextureData = new Uint8Array(this.levelsCount * 3);
        this.levelsTexture = new DataTexture(this.levelsTextureData, this.levelsCount, 1, RGBFormat);

        return true;
    }

    update() {
        if (!this.analyser || !this.context || !this.freqByteData || !this.timeByteData) return;

        // Don't process audio if no source is connected (prevents phantom beats during intro)
        if (!this.source) return;

        // TypeScript strictness override
        this.analyser.getByteFrequencyData(this.freqByteData as any);
        this.analyser.getByteTimeDomainData(this.timeByteData as any);

        let totalLevel = 0;

        for (let i = 0; i < this.levelsCount; i++) {
            let sum = 0;
            for (let j = 0; j < this.levelBins; j++) {
                sum += this.freqByteData[i * this.levelBins + j];
            }

            let val = (sum / this.levelBins / 256) * this.params.gain;
            val *= (1 + i / (4 * this.levelsCount));
            val = ATUtil.clamp(val, 0, 1);

            this.levelsData[i] = val;

            if (this.levelsTextureData) {
                this.levelsTextureData[3 * i] = Math.floor(255 * val);
                this.levelsTextureData[3 * i + 1] = 0;
                this.levelsTextureData[3 * i + 2] = 0;
            }

            totalLevel += val;
        }

        if (this.levelsTexture) {
            this.levelsTexture.needsUpdate = true;
        }

        this.volume = totalLevel / this.levelsCount;
        this.smoothedVolume += (this.volume - this.smoothedVolume) / 5;

        this.volumeHistory.unshift(this.volume);
        this.volumeHistory.pop();
        this.smoothedVolumeHistory.unshift(this.smoothedVolume);
        this.smoothedVolumeHistory.pop();

        // Only trigger beat if we actually have an audio source connected
        if (this.source && this.volume > this.beatCutOff && this.volume > this.params.beatThreshold) {
            this.events.onBeat();
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

    setMicStream(stream: MediaStream) {
        this.disconnectSource();
        if (!this.context) return;
        this.source = this.context.createMediaStreamSource(stream);
        this.source.connect(this.analyser!);
    }

    loadAudioElement(element: HTMLAudioElement) {
        this.disconnectSource();
        if (!this.context) return;
        this.source = this.context.createMediaElementSource(element);
        this.source.connect(this.analyser!);
        this.source.connect(this.gainNode!);
        this.params.useAudioElement = true;
    }

    disconnectSource() {
        if (this.source) {
            this.source.disconnect();
            this.source = null;
        }
    }

    setSmoothing(val: number) {
        if (this.analyser) {
            this.analyser.smoothingTimeConstant = val;
        }
        this.params.smoothing = val;
    }
}
