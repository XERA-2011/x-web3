
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

export class ConfigManager {
    config: AppConfig = {
        useMic: false,
        useSequence: false,
        autoPlayAudio: false,
        doLoop: false,
        loopStart: 0,
        loopEnd: 0,
        audioURL: "res/mp3/Lantern.mp3",
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
            const response = await fetch(`/viz/lantern/config/${configName}.json`);
            const data = await response.json();
            this.config = { ...this.config, ...data.config };
        } catch (e) {
            console.error("Failed to load config", e);
        }
        return this.config;
    }

    async loadFXConfig() {
        try {
            const response = await fetch(`/viz/lantern/config/${this.config.fxFileName}`);
            const data = await response.json();
            this.fxConfig = data;

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
