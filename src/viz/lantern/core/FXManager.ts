import {
    Scene, Camera, WebGLRenderer,
    // ShaderMaterial, UniformsUtils, Color
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
import { FXConfig } from './ConfigManager';

export interface FXParams {
    tiltAmount: number;
    tiltSpeed: number;
    jumpOnBeat: boolean;
    audioFade: number;
    strobe: boolean;
    strobePeriod: number;
    // New params from the instruction
    scanlines?: boolean;
    noise?: boolean;
    vignette?: boolean;
    bloom?: boolean;
}

export class FXManager {
    composer: EffectComposer | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    passes: any = {};

    // FX Params
    params: FXParams = {
        scanlines: true,
        noise: true,
        vignette: true,
        bloom: true,
        strobe: false,
        strobePeriod: 1, // beats
        audioFade: 0, // 0 to 1
        // Original params that might still be used elsewhere
        tiltAmount: 0.1,
        tiltSpeed: 0.15,
        jumpOnBeat: true,
    };

    extraBrightness = 0; // External brightness offset (e.g. for keyframes/intro)
    filters: FXConfig['filters'] | null = null;

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
        this.passes.brightness = new ShaderPass(BrightnessContrastShader);

        // Chain Order (from original FXHandler.toggleShaders)
        // Render > Mirror > RGB > Vignette(via super) > brightness > copy

        this.composer.addPass(this.passes.mirror);
        this.composer.addPass(this.passes.rgb);
        // this.composer.addPass(this.passes.dotscreen); // Optional
        this.composer.addPass(this.passes.wobble);
        this.composer.addPass(this.passes.barrel);
        this.composer.addPass(this.passes.shake);
        // Original order: [filters] → brightness → copy
        // For visible lines on dark backgrounds AND proper intro fade:
        // super (with intro brightness) → brightness (audio only) → lines (unaffected)
        this.composer.addPass(this.passes.super);
        this.composer.addPass(this.passes.brightness);
        this.composer.addPass(this.passes.lines);

        this.passes.lines.renderToScreen = true;
        this.passes.super.renderToScreen = false;
        this.passes.brightness.renderToScreen = false;

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

        // Lines (strength 0.1 matches original fx.json)
        this.passes.lines.uniforms.strength.value = 0.1;
        this.passes.lines.uniforms.amount.value = window.innerWidth * 2; // Dynamic based on screen width
        this.passes.lines.uniforms.angle.value = 0.5;

        // Brightness Pass (separate from super, so lines are not affected)
        this.passes.brightness.uniforms.brightness.value = -1; // Start dark for intro

        // Super Shader (the key one!)
        this.passes.super.uniforms.glowAmount.value = 0.4;
        this.passes.super.uniforms.glowSize.value = 2;
        this.passes.super.uniforms.vigOffset.value = 0.9;
        this.passes.super.uniforms.vigDarkness.value = 1;  // DARK vignette!
        // Super shader handles intro brightness fade (extraBrightness)
        this.passes.super.uniforms.brightness.value = -1; // Start dark for intro
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

        // Super Shader hue: Original = 2 * simplexNoise.noise(g / 20, 999, 0)
        this.passes.super.uniforms.hue.value = 2 * this.noise2D(this.time / 20, 999);

        // Brightness (audio fade / strobe logic) - applied to SEPARATE brightness pass
        // This does NOT include extraBrightness (which is handled in super shader for intro)
        let brightness = -(1 - 2 * vol) * this.params.audioFade;

        if (this.params.strobe) {
            // Simple strobe
            const strobePhase = Math.sin(this.time * this.params.strobePeriod);
            if (strobePhase > 0.5) brightness += 0.5;
        }

        // Audio brightness goes to brightness pass (not intro)
        this.passes.brightness.uniforms.brightness.value = brightness;

        // Intro brightness goes to super shader (original behavior)
        this.passes.super.uniforms.brightness.value = this.extraBrightness;

        // Restore RGB shift defaults slowly
        this.passes.rgb.uniforms.amount.value += (0.005 - this.passes.rgb.uniforms.amount.value) * 0.1;

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

    setFXConfig(fxConfig: FXConfig) {
        this.filters = fxConfig.filters;
        this.updateUniforms();
        this.onToggleShaders();
    }

    updateUniforms() {
        if (!this.filters) return;

        // Update mirror additive mode
        if (this.filters.mirror) {
            this.passes.mirror.uniforms.additive.value =
                this.filters.mirror.params.additive?.value ? 1 : 0;
        }

        // Update all filter parameters
        Object.keys(this.filters).forEach(filterKey => {
            const filter = this.filters![filterKey];
            const pass = this.passes[filterKey];
            if (!pass) return;

            Object.keys(filter.params).forEach(paramKey => {
                const param = filter.params[paramKey];
                if (param.custom) return; // Skip custom params

                if (pass.uniforms && pass.uniforms[paramKey]) {
                    pass.uniforms[paramKey].value = param.value;
                }
            });
        });
    }

    onToggleShaders() {
        if (!this.composer || !this.filters) return;

        // Rebuild composer
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(this.passes.render);

        // Add enabled filters
        Object.keys(this.filters).forEach(filterKey => {
            const filter = this.filters![filterKey];
            if (filter.on && this.passes[filterKey]) {
                this.composer!.addPass(this.passes[filterKey]);
            }
        });

        // Always add super shader last
        this.composer.addPass(this.passes.super);
        this.passes.super.renderToScreen = true;

        this.updateUniforms();
        this.resize(window.innerWidth, window.innerHeight);
    }

    randomizeFilters() {
        if (!this.filters) return;

        // Turn all off
        Object.keys(this.filters).forEach(key => {
            this.filters![key].on = false;
        });

        // Turn on 2-3 random filters
        const filterKeys = Object.keys(this.filters);
        const count = ATUtil.randomInt(2, 4);

        for (let i = 0; i < count; i++) {
            const randomKey = filterKeys[ATUtil.randomInt(0, filterKeys.length - 1)];
            this.filters[randomKey].on = true;
        }

        this.onToggleShaders();
    }
}

