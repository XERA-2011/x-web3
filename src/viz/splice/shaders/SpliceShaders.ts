import { Vector2 } from 'three';

export const ShakeShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "time": { value: 0.0 },
        "amount": { value: 0.05 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float amount;
        varying vec2 vUv;

        float rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
            vec2 p = vUv;
            vec2 offset = vec2((rand(vec2(time,time)) - 0.5)*amount,(rand(vec2(time + 999.0,time + 999.0))- 0.5) *amount);
            p += offset;
            gl_FragColor = texture2D(tDiffuse, p);
        }
    `
};

export const SuperShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "glowAmount": { value: 0.5 },
        "glowSize": { value: 4.0 },
        "resolution": { value: new Vector2(800.0, 600.0) },
        "vigOffset": { value: 1.0 },
        "vigDarkness": { value: 1.0 },
        "brightness": { value: 0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float glowSize;
        uniform float glowAmount;
        uniform vec2 resolution;
        uniform float vigOffset;
        uniform float vigDarkness;
        uniform float brightness;
        varying vec2 vUv;

        void main() {
            float h = glowSize / resolution.x;
            float v = glowSize / resolution.y;
            vec4 sum = vec4( 0.0 );

            //H Blur
            sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;
            sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;
            sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;
            sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
            sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;
            sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;
            sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;
            sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;

            //V Blur
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;

            //orig color
            vec4 col = texture2D( tDiffuse, vUv );
            
            //Add Glow
            col = min(col + sum * glowAmount, 1.0);

            //vignette
            vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( vigOffset );
            col = vec4( mix( col.rgb, vec3( 1.0 - vigDarkness ), dot( uv, uv ) ), col.a );

            //BrightnessContrast
            col.rgb += brightness;

            gl_FragColor = col;
        }
    `
};
