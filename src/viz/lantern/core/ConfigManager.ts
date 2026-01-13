
export interface AppConfig {
    useMic: boolean;
    useSequence: boolean;
    autoPlayAudio: boolean;
    doLoop: boolean;
    loopStart: number;
    loopEnd: number;
    audioURL: string;
    fxFileName: string;
    showControls: boolean;
    showIntro: boolean;
    showDebug: boolean;
    fullSize: boolean;
    displayWidth: number;
    displayHeight: number;
    BPM: number;
    mute?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface FXConfig {
    filters: {
        [key: string]: {
            displayName: string;
            on: boolean;
            params: {
                [key: string]: {
                    displayName: string;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value: any;
                    min?: number;
                    max?: number;
                    step?: number;
                    randRange?: 'low' | 'high';
                    randMin?: number;
                    randMax?: number;
                    noisePosn?: number;
                    custom?: boolean;
                }
            }
        }
    };
}

import DefaultConfig from '../res/config/default.json';
import FxConfig from '../res/config/fx.json';

const LanternAudio = '/viz/lantern/audio/Lantern.mp3';

// ... interface definitions ...

export class ConfigManager {
    config: AppConfig = {
        useMic: false,
        useSequence: false,
        autoPlayAudio: false,
        doLoop: false,
        loopStart: 0,
        loopEnd: 0,
        audioURL: LanternAudio, // Use imported audio
        fxFileName: "fx.json",
        showControls: false,
        showIntro: true,
        showDebug: false,
        fullSize: true,
        displayWidth: 1286,
        displayHeight: 726,
        BPM: 120,
        mute: false
    };

    fxConfig: FXConfig | null = null;

    async load(configName: string = "default") {
        try {
            // In a real scenario we might have a map of configs
            // For now, we only have default
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data: any = DefaultConfig;
            if (configName !== 'default') {
                console.warn(`Config ${configName} not found, using default`);
            }

            // Override audio URL in config with imported one if needed
            if (data.config && data.config.audioURL) {
                data.config.audioURL = LanternAudio;
            }

            this.config = { ...this.config, ...data.config };
        } catch (e) {
            console.error("Failed to load config", e);
        }
        return this.config;
    }

    async loadFXConfig() {
        try {
            this.fxConfig = FxConfig as unknown as FXConfig;

            // Initialize noise positions for auto-randomization
            if (this.fxConfig) {
                Object.keys(this.fxConfig.filters).forEach(filterKey => {
                    const filter = this.fxConfig!.filters[filterKey];
                    Object.keys(filter.params).forEach(paramKey => {
                        const param = filter.params[paramKey];
                        if (param.randRange) {
                            param.noisePosn = Math.random() * 9999;
                            const range = (param.max || 1) - (param.min || 0);
                            if (param.randRange === 'high') {
                                param.randMin = (param.min || 0) + 0.75 * range;
                                param.randMax = param.max || 1;
                            } else if (param.randRange === 'low') {
                                param.randMin = param.min || 0;
                                param.randMax = (param.min || 0) + 0.4 * range;
                            } else {
                                param.randMin = param.min || 0;
                                param.randMax = param.max || 1;
                            }
                        }
                    });
                });
            }
        } catch (e) {
            console.error("Failed to load FX config", e);
        }
        return this.fxConfig;
    }
}
