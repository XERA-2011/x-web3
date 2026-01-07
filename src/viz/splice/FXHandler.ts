import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js';
import { ShakeShader, SuperShader } from './shaders/SpliceShaders';
import { SpliceApp } from './SpliceApp';

export class FXHandler {
    private app: SpliceApp;
    private composer: EffectComposer;

    // Passes
    private renderPass: RenderPass;
    private shakePass: ShaderPass;
    private fxaaPass: ShaderPass;
    private rgbPass: ShaderPass;
    private superPass: ShaderPass;

    public params = {
        brightness: -1,
        audioLevels: false,
        strobe: false,
        strobePeriod: 6,
        shakeAmount: 0.5,
        barrelAmount: 0.01,
    };

    private shaderTime = 0;

    constructor(app: SpliceApp) {
        this.app = app;
        this.composer = new EffectComposer(this.app.renderer);

        // Render Pass
        this.renderPass = new RenderPass(this.app.scene, this.app.camera);
        this.composer.addPass(this.renderPass);

        // Shake Pass
        this.shakePass = new ShaderPass(ShakeShader);
        this.composer.addPass(this.shakePass);

        // FXAA Pass
        this.fxaaPass = new ShaderPass(FXAAShader);
        this.composer.addPass(this.fxaaPass);

        // RGB Shift Pass
        this.rgbPass = new ShaderPass(RGBShiftShader);
        this.rgbPass.uniforms['angle'].value = Math.PI / 2;
        this.rgbPass.uniforms['amount'].value = 0.0025;
        this.composer.addPass(this.rgbPass);

        // Super Pass (Glow, Vignette, Brightness)
        this.superPass = new ShaderPass(SuperShader);
        this.superPass.uniforms['vigDarkness'].value = 1;
        this.superPass.uniforms['vigOffset'].value = 1.3;
        this.superPass.uniforms['glowSize'].value = 2; // Original: 2 (Wait, Step 561 says 4.0 default, line 61 says 2 in usage) 
        // Original code line 61: superPass.uniforms.glowSize.value = 2;
        // So it IS 2.
        this.superPass.uniforms['glowAmount'].value = 1;
        this.composer.addPass(this.superPass);

        this.resize();
    }

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.composer.setSize(width, height);
        // Force 1x pixel ratio for retro look and matching shader params
        this.composer.setPixelRatio(1);

        // Update FXAA resolution
        if (this.fxaaPass.uniforms['resolution']) {
            this.fxaaPass.uniforms['resolution'].value.x = 1 / width;
            this.fxaaPass.uniforms['resolution'].value.y = 1 / height;
        }

        // Update SuperShader resolution
        if (this.superPass.uniforms['resolution']) {
            this.superPass.uniforms['resolution'].value.set(width, height);
        }
    }

    update() {
        this.shaderTime += 1;

        // Shake
        this.shakePass.uniforms['time'].value = this.shaderTime / 100;

        const volume = this.app.getSmoothedVolume();

        // Shake logic
        // Original: Math.pow(AudioHandler.getSmoothedVolume(), 8) * 0.5
        this.shakePass.uniforms['amount'].value = Math.pow(volume, 8) * 0.5 * this.params.shakeAmount;

        // RGB Shift
        this.rgbPass.uniforms['angle'].value = this.shaderTime / 30 * Math.PI / 2;

        // Brightness
        let brightness = this.params.brightness;

        // Audio Levels Logic (Original: brightness += Math.min(AudioHandler.getVolume()*2 - 0.9, 0))
        // Strobe Logic
        if (this.params.strobe) {
            brightness -= (this.shaderTime % this.params.strobePeriod) / this.params.strobePeriod;
        }

        this.superPass.uniforms['brightness'].value = brightness;

        this.composer.render();
    }
}
