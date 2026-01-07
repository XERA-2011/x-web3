import * as THREE from 'three';
import { NeroApp } from './NeroApp';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import {
    SuperShader, MirrorShader, BrightnessContrastShader,
    RGBShiftShader, FilmShader
} from './shaders/NeroShaders';
import { ATUtil } from '../common/ATUtil';

export class FXHandler {
    private app: NeroApp;
    private composer: EffectComposer;

    // Passes
    private renderPass: RenderPass;
    private outputPass: OutputPass;
    private superPass: ShaderPass;
    private mirrorPass: ShaderPass;
    private brightnessContrastPass: ShaderPass;
    private rgbShiftPass: ShaderPass;
    private filmPass: ShaderPass;

    // Time/Strobe
    private time = 0;
    private hueSpeed = 0; // l in main.js

    public params = {
        mirror: false,
        RGBShift: true,           // 原版默认开启
        film: true,               // 原版默认开启
        audioLevels: false,
        strobe: false,
        strobePeriod: 2,
        tiltAmount: 0.3,
        tiltSpeed: 0.15,
        glowAmount: 0.3,          // 降低光晕强度
        glowSize: 2,
        vignetteAmount: 0.5,
        brightness: 0.8,
        contrast: 0.2,
        saturation: 0.3,
        hueSpeed: 1
    };

    constructor(app: NeroApp) {
        this.app = app;
        this.composer = app.composer;

        // Re-setup composer stack
        // Note: NeroApp created a basic composer. We might need to clear it or append.
        // For simplicity, we assume we own the passes or just append them.
        // Ideally NeroApp lets us manage the composer fully.

        this.renderPass = new RenderPass(this.app.scene, this.app.camera);

        this.brightnessContrastPass = new ShaderPass(BrightnessContrastShader);
        this.superPass = new ShaderPass(SuperShader);
        this.superPass.uniforms.vigDarkness.value = 2; // 原版默认值
        this.mirrorPass = new ShaderPass(MirrorShader);
        this.mirrorPass.uniforms.side.value = 2;

        this.rgbShiftPass = new ShaderPass(RGBShiftShader);
        this.filmPass = new ShaderPass(FilmShader);
        this.filmPass.uniforms.grayscale.value = 0;
        this.filmPass.uniforms.sIntensity.value = 0.5;  // 微调：0.6 -> 0.5
        this.filmPass.uniforms.nIntensity.value = 0.4;

        this.outputPass = new OutputPass();

        this.setupComposer();
        this.updateParams();
    }

    setupComposer() {
        // Add all passes, control via enabled flag
        this.composer.passes = [];
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.brightnessContrastPass);
        this.composer.addPass(this.superPass);
        this.composer.addPass(this.mirrorPass);
        this.composer.addPass(this.rgbShiftPass);
        this.composer.addPass(this.filmPass);
        this.composer.addPass(this.outputPass);
    }

    rebuildStack() {
        // Alias for compatibility
        this.setupComposer();
        this.updateParams();
    }

    onResize() {
        this.superPass.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
        this.filmPass.uniforms.sCount.value = window.innerHeight;
    }

    onBeat() {
        this.mirrorPass.uniforms.side.value = ATUtil.randomInt(0, 3);
    }

    updateParams() {
        this.superPass.uniforms.vigOffset.value = this.params.vignetteAmount;
        this.superPass.uniforms.glowSize.value = this.params.glowSize;
        this.superPass.uniforms.glowAmount.value = this.params.glowAmount;
        this.superPass.uniforms.saturation.value = this.params.saturation;

        this.brightnessContrastPass.uniforms.contrast.value = this.params.contrast;

        this.mirrorPass.enabled = this.params.mirror;
        this.rgbShiftPass.enabled = this.params.RGBShift;
        this.filmPass.enabled = this.params.film;
        this.brightnessContrastPass.enabled = true; // 始终启用

        // Initial setup
        this.onResize();
    }

    update() {
        this.time += 0.1;
        this.hueSpeed += 0.01 * this.params.hueSpeed;



        this.filmPass.uniforms.time.value = this.time;

        this.rgbShiftPass.uniforms.angle.value = Math.sin(this.time / 6) * Math.PI * 2;

        // RGB Shift Amount - 原版: .02 * (j.rgbAmount + AudioHandler.getVolume() / 2) * 800 / VizHandler.getVizWidth()
        const rgbAmount = 0.15; // 原版 rgbAmount 默认值
        const vol = this.app.audioHandler ? this.app.audioHandler.getVolume() : 0;
        const shiftAmount = 0.02 * (rgbAmount + vol / 2) * 800 / window.innerWidth;
        this.rgbShiftPass.uniforms.amount.value = shiftAmount;

        // Hue
        const hue = (this.hueSpeed % 2) - 1;
        this.superPass.uniforms.hue.value = hue;

        // Brightness/Strobe
        let b = this.params.brightness - 1; // Base brightness seems to be 1 in original logic? main.js: b = j.brightness - 1

        if (this.app.audioHandler && this.params.audioLevels) {
            b += Math.min(2 * this.app.audioHandler.getVolume() - 1, 0);
        }

        if (this.params.strobe) {
            b -= (10 * this.time) % this.params.strobePeriod / this.params.strobePeriod;
        }

        this.brightnessContrastPass.uniforms.brightness.value = b;
    }

    // Alias methods for ControlsHandler compatibility
    toggleShaders() {
        this.updateParams();
    }

    setShaderParams() {
        this.updateParams();
    }
}
