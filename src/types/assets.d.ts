declare module '*.mp3' {
    const src: string;
    export default src;
}

declare module '*.wav' {
    const src: string;
    export default src;
}

declare module '*.png' {
    const src: string;
    export default src; // Next.js image import returns object usually, but for direct usage in Three.js TextureLoader, we might need just the src string or handle the object (Next.js returns {src, height, width...}).
}

declare module '*.jpg' {
    const src: string;
    export default src;
}

declare module '*.jpeg' {
    const src: string;
    export default src;
}

declare module '*.json' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value: any;
    export default value;
}
