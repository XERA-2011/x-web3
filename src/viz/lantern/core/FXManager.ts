
import {
    Scene, Camera, WebGLRenderer, Vector2,
    ShaderMaterial, UniformsUtils, Color
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { DotScreenPass } from 'three/examples/jsm/postprocessing/DotScreenPass.js';
// REMOVED: UnrealBloomPass - original does NOT use this!

import {
    BarrelBlurShader, ColorShiftShader, LinesShader,
    MirrorShader, ShakeShader, SuperShader, WobbleShader, RGBShiftShader,
    BrightnessContrastShader
} from '../shaders/Shaders';
import { AudioAnalyzer } from './AudioAnalyzer';
import { createNoise2D } from 'simplex-noise';
import { ATUtil } from './ATUtil';

export interface FXParams {
    tiltAmount: number;
    tiltSpeed: number;
    jumpOnBeat: boolean;
    audioFade: number;
    strobe: boolean;
    strobePeriod: number;
}

export class FXManager {
    composer: EffectComposer | null = null;
    passes: any = {};

    params: FXParams = {
        tiltAmount: 0.1,
        tiltSpeed: 0.15,
        jumpOnBeat: true,
        audioFade: 0,
        strobe: false,
        strobePeriod: 6
    };

    filters: any = {};

    time = 0;
    noise2D = createNoise2D();

    constructor(
        private scene: Scene,
        private camera: Camera,
        private renderer: WebGLRenderer
    ) { }

    init() {
        this.composer = new EffectComposer(this.renderer);

        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        this.passes.render = renderPass;

        // --- FX Passes (matching original exactly) ---
        // NO UnrealBloomPass! Original uses SuperShader's internal glow.

        this.passes.rgb = new ShaderPass(RGBShiftShader);
        this.passes.mirror = new ShaderPass(MirrorShader);
        this.passes.dotscreen = new DotScreenPass(undefined, 0.5, 0.8);
        this.passes.lines = new ShaderPass(LinesShader);
        this.passes.super = new ShaderPass(SuperShader);
        this.passes.wobble = new ShaderPass(WobbleShader);
        this.passes.barrel = new ShaderPass(BarrelBlurShader);
        this.passes.shake = new ShaderPass(ShakeShader);
        this.passes.colorify = new ShaderPass(ColorShiftShader);

        // Chain Order (from original FXHandler.toggleShaders)
        // Render > Mirror > RGB > Vignette(via super) > brightness > copy

        this.composer.addPass(this.passes.mirror);
        this.composer.addPass(this.passes.rgb);
        // this.composer.addPass(this.passes.dotscreen); // Optional
        this.composer.addPass(this.passes.wobble);
        this.composer.addPass(this.passes.barrel);
        this.composer.addPass(this.passes.shake);
        this.composer.addPass(this.passes.lines);
        this.composer.addPass(this.passes.super);

        this.passes.super.renderToScreen = true;

        // --- Initial States from fx.json ---
        this.passes.mirror.enabled = false;    // mirror.on: false
        this.passes.wobble.enabled = false;    // wobble.on: false  
        this.passes.barrel.enabled = true;     // barrelBlur.on: true
        this.passes.shake.enabled = true;      // shake.on: true
        this.passes.lines.enabled = true;      // lines.on: true
        this.passes.rgb.enabled = true;        // rgb.on: true
        this.passes.dotscreen.enabled = false;

        // --- Exact defaults from fx.json ---
        // RGB Shift
        this.passes.rgb.uniforms.amount.value = 0.005;

        // Barrel Blur
        this.passes.barrel.uniforms.amount.value = 0.05;

        // Shake
        this.passes.shake.uniforms.amount.value = 0.2;

        // Wobble
        this.passes.wobble.uniforms.strength.value = 0.01;
        this.passes.wobble.uniforms.size.value = 10;

        // Lines
        this.passes.lines.uniforms.strength.value = 0.1;
        this.passes.lines.uniforms.amount.value = 1500;
        this.passes.lines.uniforms.angle.value = 0.5;

        // Super Shader (the key one!)
        this.passes.super.uniforms.glowAmount.value = 0.4;
        this.passes.super.uniforms.glowSize.value = 2;
        this.passes.super.uniforms.vigOffset.value = 0.9;
        this.passes.super.uniforms.vigDarkness.value = 1;  // DARK vignette!
        this.passes.super.uniforms.saturation.value = 0;
        this.passes.super.uniforms.contrast.value = 0.2;
        this.passes.super.uniforms.brightness.value = 0;
    }

    update(dt: number, audio: AudioAnalyzer) {
        if (!this.composer) return;
        this.time += 0.1; // Match original: shaderTime += 0.1

        // Update time uniforms
        this.passes.wobble.uniforms.time.value = this.time;
        this.passes.barrel.uniforms.time.value = this.time;
        this.passes.shake.uniforms.time.value = this.time;

        const vol = audio.volume;
        const smoothVol = audio.smoothedVolume;

        // --- Reactive FX (from original FXHandler.update) ---

        // Barrel Blur: amount = smoothedVolume * config.amount
        this.passes.barrel.uniforms.amount.value = smoothVol * 0.05;

        // Shake: amount = pow(smoothedVolume, 4) * config.amount
        this.passes.shake.uniforms.amount.value = Math.pow(smoothVol, 4) * 0.2;

        // RGB Shift: amount = 0.005 + volume * 0.01
        this.passes.rgb.uniforms.amount.value = 0.005 + vol * 0.01;
        // RGB Shift: angle = 6.28 * (noise(time/40, 99) + 0.5)
        this.passes.rgb.uniforms.angle.value = 6.28 * (this.noise2D(this.time / 40, 99) + 0.5);

        // Super Shader hue: 2 * noise(time/20, 999)
        this.passes.super.uniforms.hue.value = 2 * this.noise2D(this.time / 20, 999);

        // Brightness (audio fade / strobe logic)
        let brightness = -(1 - 2 * vol) * this.params.audioFade;
        brightness = Math.min(brightness, 0);

        if (this.params.strobe) {
            brightness -= (10 * this.time) % this.params.strobePeriod / this.params.strobePeriod;
        }

        this.passes.super.uniforms.brightness.value = brightness;

        this.composer.render(0.1);
    }

    onBeat() {
        // Mirror side randomization on beat
        if (this.passes.mirror.enabled && Math.random() < 0.2) {
            this.passes.mirror.uniforms.side.value = ATUtil.randomInt(0, 4);
        }
    }

    resize(width: number, height: number) {
        this.composer?.setSize(width, height);
        this.passes.lines.uniforms.amount.value = width * 2;
        this.passes.super.uniforms.resolution.value.set(width, height);
    }
}
