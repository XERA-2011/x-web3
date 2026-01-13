
import { VizController } from './VizController';

// Sequence data from original main.min.js
const SEQUENCE_DATA = [
    { bars: 0, name: "0 Build" },
    { bars: 4, name: "0.5 Build2" },
    { bars: 8, name: "1 Drums" },
    { bars: 12, name: "2 Beats" },
    { bars: 20, name: "3 Break" },
    { bars: 24, name: "4 Build" },
    { bars: 32, name: "5 Beats" }
];

const BAR_TIME = 2.926; // seconds per bar (from original)


export class SequenceHandler {
    private controller: VizController;
    private currentIndex = 0;
    private lastTime = 0;
    private isRunning = false;
    private audioElement: HTMLAudioElement | null = null;

    constructor(controller: VizController) {
        this.controller = controller;
    }

    start(audioElement: HTMLAudioElement) {
        this.audioElement = audioElement;
        this.currentIndex = 0;
        this.lastTime = 0;
        this.isRunning = true;

        // Apply first sequence immediately
        this.applySequence("0 Build");
    }

    update() {
        if (!this.isRunning || !this.audioElement) return;

        const currentTime = this.audioElement.currentTime;

        // Check for loop/reset
        if (currentTime < this.lastTime) {
            this.currentIndex = 0;
        }

        // Check if we should trigger next sequence
        const nextSeq = SEQUENCE_DATA[this.currentIndex];
        if (nextSeq && nextSeq.bars * BAR_TIME <= currentTime) {
            this.applySequence(nextSeq.name);
            this.currentIndex++;
        }

        this.lastTime = currentTime;
    }

    applySequence(name: string) {
        const ctrl = this.controller;
        const fx = ctrl.fx;

        // Turn off all main viz first (first 6 effects)
        const mainViz = ["ColorWheel", "Crystal", "ImageRipple", "ImageTunnel", "Eclipse", "Ripples"];
        mainViz.forEach(v => ctrl.getEffect(v)?.onToggle(false));

        console.log(`[Sequence] Applying: ${name}`);

        switch (name) {
            case "0 Build":
                // ColorWheel ON, Eclipse ON, StarBars OFF
                ctrl.audio.params.gain = 1.5;
                ctrl.audio.params.beatHoldTime = 80;
                ctrl.getEffect("ColorWheel")?.onToggle(true);
                ctrl.getEffect("Eclipse")?.onToggle(true);
                ctrl.getEffect("StarBars")?.onToggle(false);
                fx.passes.mirror.enabled = false;
                fx.params.audioFade = 0;
                fx.params.strobe = false;
                break;

            case "0.5 Build2":
                // ColorWheel ON, Eclipse ON, Mirror ON (additive)
                ctrl.audio.params.gain = 1.5;
                ctrl.audio.params.beatHoldTime = 80;
                ctrl.getEffect("ColorWheel")?.onToggle(true);
                ctrl.getEffect("Eclipse")?.onToggle(true);
                fx.passes.mirror.enabled = true;
                fx.passes.mirror.uniforms.additive.value = 1;
                fx.params.audioFade = 0;
                fx.params.strobe = false;
                break;

            case "1 Drums":
                // Eclipse ON, ImageRipple ON, Ripples ON
                ctrl.audio.params.gain = 0.9;
                ctrl.audio.params.beatHoldTime = 10;
                ctrl.getEffect("Eclipse")?.onToggle(true);
                ctrl.getEffect("ImageRipple")?.onToggle(true);
                ctrl.getEffect("Ripples")?.onToggle(true);
                fx.passes.mirror.enabled = false;
                fx.params.audioFade = 1;
                break;

            case "2 Beats":
                // ColorWheel ON, Eclipse ON, Crystal ON, StarBars ON, Mirror ON
                ctrl.audio.params.gain = 0.9;
                ctrl.audio.params.beatHoldTime = 30;
                ctrl.getEffect("ColorWheel")?.onToggle(true);
                ctrl.getEffect("Eclipse")?.onToggle(true);
                ctrl.getEffect("Crystal")?.onToggle(true);
                ctrl.getEffect("StarBars")?.onToggle(true);
                fx.passes.mirror.enabled = true;
                fx.params.audioFade = 0;
                break;

            case "3 Break":
                // Ripples ON, Eclipse ON, StarBars OFF, Strobe ON
                ctrl.audio.params.gain = 2;
                ctrl.audio.params.beatHoldTime = 10;
                ctrl.getEffect("Ripples")?.onToggle(true);
                ctrl.getEffect("Eclipse")?.onToggle(true);
                ctrl.getEffect("StarBars")?.onToggle(false);
                fx.params.strobe = true;
                fx.params.strobePeriod = 6;
                fx.passes.mirror.enabled = true;
                break;

            case "4 Build":
                // ColorWheel ON, Crystal ON, ImageTunnel ON, StarBars ON
                ctrl.audio.params.gain = 0.9;
                ctrl.audio.params.beatHoldTime = 30;
                ctrl.getEffect("ColorWheel")?.onToggle(true);
                ctrl.getEffect("Crystal")?.onToggle(true);
                ctrl.getEffect("ImageTunnel")?.onToggle(true);
                ctrl.getEffect("StarBars")?.onToggle(true);
                fx.params.strobe = false;
                fx.params.audioFade = 0;
                break;

            case "5 Beats":
                // Ripples ON, ImageRipple ON (freak, autoHide), ColorWheel ON, Strobe ON
                ctrl.audio.params.gain = 0.9;
                ctrl.getEffect("Ripples")?.onToggle(true);
                ctrl.getEffect("ImageRipple")?.onToggle(true);
                ctrl.getEffect("ColorWheel")?.onToggle(true);
                // ImageRipple freak and autoHide params
                const imageRipple = ctrl.getEffect("ImageRipple");
                if (imageRipple) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const params = imageRipple.getParams() as any;
                    params.freak = true;
                    params.autoHide = true;
                }
                fx.params.strobe = true;
                fx.params.strobePeriod = 22;
                fx.passes.mirror.enabled = false;
                break;
        }
    }

    init() {
        // Initial state before music starts - Stars, StarBars, LightLeak visible
        const ctrl = this.controller;

        // All main viz OFF
        ["ColorWheel", "Crystal", "ImageRipple", "ImageTunnel", "Eclipse", "Ripples"].forEach(
            v => ctrl.getEffect(v)?.onToggle(false)
        );

        // Background effects ON
        ctrl.getEffect("Stars")?.onToggle(true);
        ctrl.getEffect("StarBars")?.onToggle(true);
        ctrl.getEffect("LightLeak")?.onToggle(true);
    }
}
