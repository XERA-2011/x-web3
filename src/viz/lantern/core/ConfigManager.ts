
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
    [key: string]: any;
}

export class ConfigManager {
    config: AppConfig = {
        useMic: false,
        useSequence: false,
        autoPlayAudio: true,
        doLoop: false,
        loopStart: 0,
        loopEnd: 0,
        audioURL: "res/audio/lantern.mp3", // default
        fxFileName: "default_fx.json", // default
        showControls: true,
        showIntro: true,
        showDebug: false,
        fullSize: true,
        displayWidth: 800,
        displayHeight: 600,
        BPM: 120,
    };

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
}
