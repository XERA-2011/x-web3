import { Scene, Object3D } from 'three';
import { AudioAnalyzer } from './AudioAnalyzer';

export interface VizParams {
    on: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface VizEffect {
    name: string;
    init(scene: Scene, holder: Object3D, tumbler: Object3D): void;
    update(dt: number, audio: AudioAnalyzer, noiseTime: number): void;
    onBeat(audio: AudioAnalyzer): void;
    onBPMBeat(): void;
    onToggle(active: boolean): void;
    getParams(): VizParams;
}
