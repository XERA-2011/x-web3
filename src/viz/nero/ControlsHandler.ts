import { NeroApp } from './NeroApp';

type GUI = import('dat.gui').GUI;

export class ControlsHandler {
    private gui: GUI | null = null;
    private app: NeroApp;
    private controlsHolder: HTMLElement | null = null;
    private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

    constructor(app: NeroApp) {
        this.app = app;
        this.initGUI();
    }

    private async initGUI() {
        if (typeof window === 'undefined') return;

        const dat = await import('dat.gui');

        // Add CSS for controls
        if (!document.getElementById('nero-controls-css')) {
            const style = document.createElement('style');
            style.id = 'nero-controls-css';
            style.textContent = `
                #nero-controls-holder {
                    position: fixed;
                    top: 0;
                    right: 0;
                    z-index: 9999;
                    pointer-events: auto;
                    max-height: 100vh;
                    overflow-y: auto;
                    overflow-x: hidden;
                    background-color: #1a1a1a;
                    scrollbar-width: thin;
                    scrollbar-color: #666 #1a1a1a;
                }
                #nero-controls-holder::-webkit-scrollbar {
                    width: 8px;
                }
                #nero-controls-holder::-webkit-scrollbar-track {
                    background: #1a1a1a;
                }
                #nero-controls-holder::-webkit-scrollbar-thumb {
                    background: #666;
                    border-radius: 4px;
                }
                #nero-controls-header {
                    background: #1a1a1a;
                    padding: 5px 10px;
                    font-family: 'Lucida Grande', sans-serif;
                    font-size: 11px;
                    color: #fff;
                }
            `;
            document.head.appendChild(style);
        }

        // Create controls container
        this.controlsHolder = document.createElement('div');
        this.controlsHolder.id = 'nero-controls-holder';
        document.body.appendChild(this.controlsHolder);

        // Add header
        const header = document.createElement('div');
        header.id = 'nero-controls-header';
        header.innerHTML = 'NERO | Press Q to toggle';
        this.controlsHolder.appendChild(header);

        // Create GUI
        this.gui = new dat.GUI({ autoPlace: false });
        this.controlsHolder.appendChild(this.gui.domElement);

        this.initAudioControls();
        this.initStarsControls();
        this.initStarBarsControls();
        this.initSegmentsControls();
        this.initLightLeakControls();
        this.initDisplacementTubeControls();
        this.initFXControls();

        // Default hidden
        this.controlsHolder.style.display = 'none';

        // Setup keyboard listener
        this.setupKeyboard();
    }

    private setupKeyboard() {
        if (typeof window === 'undefined') return;

        this.keydownHandler = (e: KeyboardEvent) => {
            if (e.code === 'KeyQ' || e.keyCode === 81) {
                this.toggleControls();
            }
        };
        window.addEventListener('keydown', this.keydownHandler);
    }

    toggleControls() {
        if (!this.controlsHolder) return;
        const isVisible = this.controlsHolder.style.display !== 'none';
        this.controlsHolder.style.display = isVisible ? 'none' : 'block';
    }

    private initAudioControls() {
        if (!this.gui) return;
        const audioParams = this.app.audioHandler.params;
        const folder = this.gui.addFolder('AUDIO');
        folder.add(audioParams, 'gain', 0, 10).step(0.1).name('Gain');
        folder.add(audioParams, 'beatHoldTime', 0, 100).step(1).name('Beat Hold');
        folder.add(audioParams, 'beatThreshold', 0, 1).step(0.01).name('Beat Threshold');
        folder.add(audioParams, 'beatDecayRate', 0.9, 1).step(0.01).name('Beat Decay');
        folder.add(audioParams, 'mute').name('Mute').onChange(() => {
            this.app.audioHandler.updateMute();
        });
    }

    private initStarsControls() {
        if (!this.gui) return;
        const params = this.app.stars.params;
        const folder = this.gui.addFolder('STARS');
        folder.add(params, 'size', 0, 10).name('Size');
        folder.add(params, 'speed', 0, 10).name('Speed');
        folder.add(params, 'opacity', 0, 1).name('Opacity');
    }

    private initStarBarsControls() {
        if (!this.gui) return;
        const params = this.app.starBars.params;
        const folder = this.gui.addFolder('STAR BARS');
        folder.add(params, 'on').name('On').onChange(() => {
            this.app.starBars.updateVisibility();
        });
        folder.add(params, 'speed', -10, 10).name('Speed');
        folder.add(params, 'opacity', 0, 1).name('Opacity');
    }

    private initSegmentsControls() {
        if (!this.gui) return;
        const params = this.app.segments.params;
        const folder = this.gui.addFolder('SEGMENTS');
        folder.add(params, 'on').name('On').onChange(() => {
            this.app.segments.updateVisibility();
        });
        folder.add(params, 'strobe').name('Strobe');
    }

    private initLightLeakControls() {
        if (!this.gui) return;
        const params = this.app.lightLeak.params;
        const folder = this.gui.addFolder('LIGHT LEAK');
        folder.add(params, 'opacity', 0, 1).name('Opacity');
        folder.add(params, 'freakOut').name('Freak Out');
    }

    private initDisplacementTubeControls() {
        if (!this.gui) return;
        const params = this.app.displacementTube.params;
        const folder = this.gui.addFolder('DISPLACEMENT TUBE');
        folder.add(params, 'on').name('On').onChange(() => {
            this.app.displacementTube.updateVisibility();
        });
        folder.add(params, 'freakOut').name('Freak Out');
        folder.add(params, 'stretch', 1, 100).name('Stretch').onChange(() => {
            this.app.displacementTube.updateParams();
        });
        folder.add(params, 'freakOutPeriod', 1, 60).name('Freak Period');
        folder.add(params, 'scale', 0.1, 2).name('Scale').onChange(() => {
            this.app.displacementTube.updateParams();
        });
        folder.add(params, 'depth', 0, 300).name('Depth').onChange(() => {
            this.app.displacementTube.updateParams();
        });
        folder.add(params, 'audioDepth', 0, 300).name('Audio Depth');
        folder.add(params, 'numStrips', 1, 100).name('Num Strips').onChange(() => {
            this.app.displacementTube.updateParams();
        });
        folder.add(params, 'rotSpeed', 0, 0.15).name('Rot Speed');
        folder.add(params, 'sliceXSpeed', 0, 5).name('Slice X Speed');
        folder.add(params, 'sliceYSpeed', 0, 20).name('Slice Y Speed');
    }

    private initFXControls() {
        if (!this.gui) return;
        const params = this.app.fxHandler.params;
        const folder = this.gui.addFolder('FX');
        folder.add(params, 'mirror').name('Mirror').onChange(() => {
            this.app.fxHandler.toggleShaders();
        });
        folder.add(params, 'RGBShift').name('RGB Shift').onChange(() => {
            this.app.fxHandler.toggleShaders();
        });
        folder.add(params, 'film').name('Film').onChange(() => {
            this.app.fxHandler.toggleShaders();
        });
        folder.add(params, 'audioLevels').name('Audio Levels').onChange(() => {
            this.app.fxHandler.toggleShaders();
        });
        folder.add(params, 'strobe').name('Strobe');
        folder.add(params, 'strobePeriod', 2, 120).step(1).name('Strobe Period');
        folder.add(params, 'tiltAmount', 0, 1).name('Tilt Amount');
        folder.add(params, 'tiltSpeed', 0, 1).name('Tilt Speed');
        folder.add(params, 'glowAmount', 0, 4).name('Glow Amount').onChange(() => {
            this.app.fxHandler.setShaderParams();
        });
        folder.add(params, 'glowSize', 0, 20).name('Glow Size').onChange(() => {
            this.app.fxHandler.setShaderParams();
        });
        folder.add(params, 'vignetteAmount', 0, 1.3).step(0.1).name('Vignette').onChange(() => {
            this.app.fxHandler.setShaderParams();
        });
        folder.add(params, 'brightness', 0, 1).step(0.1).name('Brightness');
        folder.add(params, 'contrast', 0, 1).name('Contrast').onChange(() => {
            this.app.fxHandler.setShaderParams();
        });
        folder.add(params, 'saturation', 0, 1).step(0.1).name('Saturation').onChange(() => {
            this.app.fxHandler.setShaderParams();
        });
        folder.add(params, 'hueSpeed', 0.1, 10).step(0.1).name('Hue Speed');
    }

    dispose() {
        if (this.keydownHandler) {
            window.removeEventListener('keydown', this.keydownHandler);
            this.keydownHandler = null;
        }
        if (this.gui) {
            this.gui.destroy();
            this.gui = null;
        }
        if (this.controlsHolder && this.controlsHolder.parentNode) {
            this.controlsHolder.parentNode.removeChild(this.controlsHolder);
            this.controlsHolder = null;
        }
    }
}
