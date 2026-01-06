import * as dat from 'dat.gui';
import Stats from 'stats.js';
import { AudioAnalyzer } from './AudioAnalyzer';
import { VizEffect } from './VizEffect';
import { FXManager } from './FXManager';
import { FXConfig } from './ConfigManager';
import { BPMManager } from './BPMManager';

export class ControlsHandler {
    private gui: dat.GUI | null = null;
    private audioFolder: dat.GUI | null = null;
    private vizFolder: dat.GUI | null = null;
    private fxFolder: dat.GUI | null = null;
    private stats: Stats | null = null;
    private bpmCanvas: HTMLCanvasElement | null = null;
    private bpmCtx: CanvasRenderingContext2D | null = null;
    private audioCanvas: HTMLCanvasElement | null = null;
    private audioCtx: CanvasRenderingContext2D | null = null;

    public params = {
        autoMode: true
    };

    private container: HTMLElement | null = null;
    private bpm: BPMManager | null = null;

    init(container: HTMLElement, bpm: BPMManager, showControls: boolean = false) {
        this.container = container;
        this.bpm = bpm;

        // Import dat.GUI CSS if not already loaded
        if (typeof document !== 'undefined' && !document.getElementById('dat-gui-css')) {
            const style = document.createElement('style');
            style.id = 'dat-gui-css';
            style.textContent = `
                .dg.main { 
                    font-family: 'Lucida Grande', sans-serif;
                    font-size: 11px;
                }
                .dg .cr.function .property-name {
                    width: 100%;
                }
                .dg .c input[type=text] {
                    background: #1a1a1a;
                }
                /* Custom scrollbar styles */
                #controls-holder::-webkit-scrollbar {
                    width: 8px;
                }
                #controls-holder::-webkit-scrollbar-track {
                    background: #1a1a1a;
                }
                #controls-holder::-webkit-scrollbar-thumb {
                    background: #666;
                    border-radius: 4px;
                }
                #controls-holder::-webkit-scrollbar-thumb:hover {
                    background: #888;
                }
                /* Firefox */
                #controls-holder {
                    scrollbar-width: thin;
                    scrollbar-color: #666 #1a1a1a;
                }
                #controls-header {
                    background: #1a1a1a;
                    padding: 5px 10px;
                    font-family: 'Lucida Grande', sans-serif;
                    font-size: 11px;
                    color: #fff;
                }
                #bpm-container {
                    background: #1a1a1a;
                    padding: 5px 10px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                #bpm-text {
                    font-family: 'Lucida Grande', sans-serif;
                    font-size: 11px;
                    color: #0f0;
                }
            `;
            document.head.appendChild(style);
        }

        // Find or create controls container - append to BODY to avoid canvas z-index issues
        let controlsHolder = document.getElementById('controls-holder') as HTMLElement;
        if (!controlsHolder) {
            controlsHolder = document.createElement('div');
            controlsHolder.id = 'controls-holder';
            controlsHolder.style.position = 'fixed';
            controlsHolder.style.top = '0';
            controlsHolder.style.right = '0';
            controlsHolder.style.zIndex = '9999';
            controlsHolder.style.pointerEvents = 'auto';
            controlsHolder.style.maxHeight = '100vh';
            controlsHolder.style.overflowY = 'auto';
            controlsHolder.style.overflowX = 'hidden';
            controlsHolder.style.backgroundColor = '#1a1a1a';
            document.body.appendChild(controlsHolder);
        }

        // Add Stats.js (FPS counter)
        this.stats = new Stats();
        this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb
        this.stats.dom.style.position = 'relative';
        this.stats.dom.style.cursor = 'pointer';
        this.stats.dom.style.width = '100%';
        // Make the inner panels full width too
        const panels = this.stats.dom.querySelectorAll('canvas');
        panels.forEach((canvas: HTMLCanvasElement) => {
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
        });
        controlsHolder.appendChild(this.stats.dom);

        // Add debug header
        const header = document.createElement('div');
        header.id = 'controls-header';
        header.innerHTML = '<div id="debug-text">ÜberViz v0.9.7</div>';
        controlsHolder.appendChild(header);

        // Add Audio debug canvas
        this.audioCanvas = document.createElement('canvas');
        this.audioCanvas.id = 'audio-debug';
        this.audioCanvas.width = 250;
        this.audioCanvas.height = 100;
        this.audioCanvas.style.background = '#111';
        this.audioCanvas.style.display = 'block';
        controlsHolder.appendChild(this.audioCanvas);
        this.audioCtx = this.audioCanvas.getContext('2d');

        // Add BPM display
        const bpmContainer = document.createElement('div');
        bpmContainer.id = 'bpm-container';
        bpmContainer.innerHTML = `<div id="bpm-text">BPM: ${bpm.bpm}</div>`;
        this.bpmCanvas = document.createElement('canvas');
        this.bpmCanvas.id = 'bpm-display';
        this.bpmCanvas.width = 30;
        this.bpmCanvas.height = 30;
        bpmContainer.appendChild(this.bpmCanvas);
        controlsHolder.appendChild(bpmContainer);
        this.bpmCtx = this.bpmCanvas.getContext('2d');

        // Create GUI
        this.gui = new dat.GUI({ autoPlace: false });
        controlsHolder.appendChild(this.gui.domElement);

        // Add auto mode toggle at top
        this.gui.add(this.params, 'autoMode').name('AUTOMATIC');

        // Create folders
        this.audioFolder = this.gui.addFolder('AUDIO =============');
        this.vizFolder = this.gui.addFolder('VIZ ===============');
        this.fxFolder = this.gui.addFolder('FX ================');

        // Setup keyboard listeners
        this.setupKeyboard();

        // Hide controls by default (original: showControls: false in default.json)
        controlsHolder.style.display = showControls ? 'block' : 'none';
    }

    buildAudioControls(audio: AudioAnalyzer) {
        if (!this.audioFolder) return;

        // Gain
        this.audioFolder.add(audio.params, 'gain', 0, 6)
            .step(0.1)
            .listen()
            .name('Gain');

        // Beat Hold Time
        this.audioFolder.add(audio.params, 'beatHoldTime', 0, 100)
            .step(1)
            .listen()
            .name('Beat Hold');

        // Beat Threshold
        this.audioFolder.add(audio.params, 'beatThreshold', 0, 1)
            .step(0.01)
            .listen()
            .name('Beat Threshold');

        // Beat Decay Rate
        this.audioFolder.add(audio.params, 'beatDecayRate', 0.9, 1)
            .step(0.01)
            .name('Beat Decay');

        // Smoothing
        this.audioFolder.add(audio.params, 'smoothing', 0, 1)
            .step(0.01)
            .name('Smoothing')
            .onChange((val: number) => audio.setSmoothing(val));
    }

    buildVizControls(effects: VizEffect[]) {
        if (!this.vizFolder) return;

        effects.forEach(effect => {
            const params = effect.getParams();

            // Add main toggle
            this.vizFolder!.add(params, 'on')
                .listen()
                .name(effect.name)
                .onChange((val: boolean) => effect.onToggle(val));

            // Add sub-parameters
            Object.keys(params).forEach(key => {
                if (key === 'on') return;

                const value = params[key];
                if (typeof value === 'number') {
                    // Determine reasonable range
                    let min = 0, max = 1, step = 0.01;
                    if (key.includes('scale') || key.includes('size')) {
                        max = 10;
                        step = 0.1;
                    } else if (key.includes('speed')) {
                        max = 5;
                    } else if (key.includes('count')) {
                        max = 100;
                        step = 1;
                    }

                    this.vizFolder!.add(params, key, min, max)
                        .step(step)
                        .name(`-- ${key}`)
                        .listen();
                } else if (typeof value === 'boolean') {
                    this.vizFolder!.add(params, key)
                        .name(`-- ${key}`)
                        .listen();
                }
            });
        });
    }

    buildFXControls(fxConfig: FXConfig | null, fxManager: FXManager) {
        if (!this.fxFolder || !fxConfig) return;

        const filters = fxConfig.filters;

        // Add each filter
        Object.keys(filters).forEach(filterKey => {
            const filter = filters[filterKey];

            // Add main toggle
            this.fxFolder!.add(filter, 'on')
                .listen()
                .name(filter.displayName)
                .onChange(() => fxManager.onToggleShaders());

            // Add parameters
            Object.keys(filter.params).forEach(paramKey => {
                const param = filter.params[paramKey];

                if (typeof param.value === 'boolean') {
                    this.fxFolder!.add(param, 'value')
                        .listen()
                        .name(`-- ${param.displayName}`)
                        .onChange(() => fxManager.updateUniforms());
                } else if (typeof param.value === 'number') {
                    this.fxFolder!.add(param, 'value', param.min || 0, param.max || 1)
                        .step(param.step || 0.01)
                        .listen()
                        .name(`-- ${param.displayName}`)
                        .onChange(() => fxManager.updateUniforms());
                }
            });
        });

        // Add FX parameters
        this.fxFolder.add(fxManager.params, 'audioFade', 0, 1)
            .listen()
            .name('Audio Fade');

        this.fxFolder.add(fxManager.params, 'strobe')
            .listen()
            .name('Strobe');

        this.fxFolder.add(fxManager.params, 'strobePeriod', 4, 100)
            .name('Strobe Time');

        this.fxFolder.add(fxManager.params, 'tiltSpeed', 0, 0.6)
            .name('Tilt Speed')
            .listen();

        this.fxFolder.add(fxManager.params, 'tiltAmount', 0, 0.6)
            .name('Tilt Amount')
            .listen();

        // Add randomize button
        this.fxFolder.add(fxManager, 'randomizeFilters').name('Randomize');
    }

    setupKeyboard() {
        if (typeof window === 'undefined') return;

        window.addEventListener('keydown', (e) => {
            switch (e.keyCode) {
                case 81: // Q key
                    this.toggleControls();
                    break;
                case 87: // W key
                    if (this.bpm) {
                        this.bpm.onBPMTap();
                    }
                    break;
            }
        });
    }

    toggleControls() {
        const controlsHolder = document.getElementById('controls-holder');
        if (!controlsHolder) return;

        const isVisible = controlsHolder.style.display !== 'none';
        controlsHolder.style.display = isVisible ? 'none' : 'block';
    }

    update(audio: AudioAnalyzer) {
        // Update Stats.js
        if (this.stats) {
            this.stats.update();
        }

        // Update BPM display
        if (this.bpmCtx && this.bpmCanvas && this.bpm) {
            const size = 30;
            const bpmTime = this.bpm.getBPMTime();
            const pulseSize = size - bpmTime * size;

            this.bpmCtx.fillStyle = '#030';
            this.bpmCtx.fillRect(0, 0, size, size);
            this.bpmCtx.fillStyle = '#0D0';
            this.bpmCtx.fillRect((size - pulseSize) / 2, (size - pulseSize) / 2, pulseSize, pulseSize);

            // Update BPM text
            const bpmTextEl = document.getElementById('bpm-text');
            if (bpmTextEl) {
                bpmTextEl.textContent = `BPM: ${Math.round(this.bpm.bpm)}`;
            }
        }

        // Update Audio debug canvas
        if (this.audioCtx && this.audioCanvas) {
            const width = this.audioCanvas.width;
            const height = this.audioCanvas.height;
            const levelsCount = audio.levelsCount;
            const levelsData = audio.levelsData;
            const volume = audio.volume;
            const beatCutOff = audio.beatCutOff;

            // Clear
            this.audioCtx.fillStyle = 'rgb(40, 40, 40)';
            this.audioCtx.fillRect(0, 0, width, height);

            // Draw levels bars
            const barWidth = 220 / levelsCount;
            const gradient = this.audioCtx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(1, '#330000');
            gradient.addColorStop(0.85, '#aa0000');
            gradient.addColorStop(0.5, '#aaaa00');
            gradient.addColorStop(0, '#aaaaaa');
            this.audioCtx.fillStyle = gradient;

            for (let i = 0; i < levelsCount; i++) {
                const h = (levelsData[i] || 0) * height;
                this.audioCtx.fillRect(i * barWidth, height - h, barWidth - 2, h);
            }

            // Draw volume bar
            this.audioCtx.fillRect(220, height, 30, -volume * height);

            // Draw beat threshold line
            this.audioCtx.strokeStyle = '#fff';
            this.audioCtx.lineWidth = 2;
            this.audioCtx.beginPath();
            this.audioCtx.moveTo(220, height - beatCutOff * height);
            this.audioCtx.lineTo(250, height - beatCutOff * height);
            this.audioCtx.stroke();
        }
    }

    getStats() { return this.stats; }
    getGui() { return this.gui; }
    getVizFolder() { return this.vizFolder; }
    getFXFolder() { return this.fxFolder; }
    getControlParams() { return this.params; }
}
