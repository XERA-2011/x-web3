import * as THREE from 'three';

export const SuperShader = {
    uniforms: {
        tDiffuse: { value: null },
        glowAmount: { value: 0.5 },
        glowSize: { value: 4 },
        resolution: { value: null }, // needs Vector2
        vigOffset: { value: 1 },
        vigDarkness: { value: 1 },
        hue: { value: 0 },
        saturation: { value: 0 }
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
        uniform float hue;
        uniform float saturation;
        varying vec2 vUv;
        
        void main() {
            float h = glowSize / resolution.x;
            float v = glowSize / resolution.y;
            vec4 sum = vec4( 0.0 );
            sum += texture2D( tDiffuse, vec2( vUv.x - 4.0 * h, vUv.y ) ) * 0.051;
            sum += texture2D( tDiffuse, vec2( vUv.x - 3.0 * h, vUv.y ) ) * 0.0918;
            sum += texture2D( tDiffuse, vec2( vUv.x - 2.0 * h, vUv.y ) ) * 0.12245;
            sum += texture2D( tDiffuse, vec2( vUv.x - 1.0 * h, vUv.y ) ) * 0.1531;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
            sum += texture2D( tDiffuse, vec2( vUv.x + 1.0 * h, vUv.y ) ) * 0.1531;
            sum += texture2D( tDiffuse, vec2( vUv.x + 2.0 * h, vUv.y ) ) * 0.12245;
            sum += texture2D( tDiffuse, vec2( vUv.x + 3.0 * h, vUv.y ) ) * 0.0918;
            sum += texture2D( tDiffuse, vec2( vUv.x + 4.0 * h, vUv.y ) ) * 0.051;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 4.0 * v ) ) * 0.051;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 3.0 * v ) ) * 0.0918;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 2.0 * v ) ) * 0.12245;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y - 1.0 * v ) ) * 0.1531;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y ) ) * 0.1633;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 1.0 * v ) ) * 0.1531;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 2.0 * v ) ) * 0.12245;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 3.0 * v ) ) * 0.0918;
            sum += texture2D( tDiffuse, vec2( vUv.x, vUv.y + 4.0 * v ) ) * 0.051;
            
            vec4 col = texture2D( tDiffuse, vUv );
            col = min(col + sum * glowAmount, 1.0);
            
            vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( vigOffset );
            col = vec4( mix( col.rgb, vec3( 1.0 - vigDarkness ), dot( uv, uv ) ), col.a );
            
            float angle = hue * 3.14159265;
            float s = sin(angle), c = cos(angle);
            vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;
            float len = length(col.rgb);
            col.rgb = vec3(
                dot(col.rgb, weights.xyz),
                dot(col.rgb, weights.zxy),
                dot(col.rgb, weights.yzx)
            );
            
            float average = (col.r + col.g + col.b) / 3.0;
            if (saturation > 0.0) {
                col.rgb += (average - col.rgb) * (1.0 - 1.0 / (1.001 - saturation));
            } else {
                col.rgb += (average - col.rgb) * (-saturation);
            }
            gl_FragColor = col;
        }
    `
};

export const DisplacementMatShader = {
    uniforms: {
        texture: { value: null as THREE.Texture | null },
        timeX: { value: 0 },
        timeY: { value: 0 },
        stretch: { value: 10 },
        depth: { value: 300 },
        audioDepth: { value: 1 },
        levels: { value: [] }, // Array of floats
        numStrips: { value: 20 }
    },
    vertexShader: `
        uniform sampler2D texture;
        uniform float depth;
        uniform float timeX;
        uniform float timeY;
        uniform float stretch;
        uniform float audioDepth;
        uniform float numStrips;
        uniform float levels[ 16 ]; // Adjusted to 16 based on AudioHandler bin count
        varying vec2 vUv;
        
        void main() {
            vUv = uv;
            vUv.x = abs(2.0 * fract(timeX + vUv.x/stretch) -1.0);
            vUv.y = fract(timeY + vUv.y);
            
            // Map uv.y to level index
            // int index = int(floor((1.0 - uv.y) * numStrips)) - 1; 
            // Original GLSL cast logic might need check, strictness depends on WebGL version
            int index = int(floor((1.0 - uv.y) * numStrips));
            if (index < 0) index = 0;
            if (index > 15) index = 15;
            
            float levelVal = levels[ index ];
            vec4 color = texture2D( texture, vUv );
            
            float value = (( color.r + color.g + color.b ) / 3.0  * depth) + (levelVal * audioDepth);
            vec3 newPosition = position + normal * value;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
        }
    `,
    fragmentShader: `
        uniform sampler2D texture;
        varying vec2 vUv;
        void main() {
            gl_FragColor = texture2D(texture, vUv);
        }
    `
};

export const MirrorShader = {
    uniforms: {
        tDiffuse: { value: null },
        side: { value: 1 }
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
        uniform int side;
        varying vec2 vUv;
        void main() {
            vec2 p = vUv;
            if (side == 0){
                if (p.x > 0.5) p.x = 1.0 - p.x;
            }else if (side == 1){
                if (p.x < 0.5) p.x = 1.0 - p.x;
            }else if (side == 2){
                if (p.y < 0.5) p.y = 1.0 - p.y;
            }else if (side == 3){
                if (p.y > 0.5) p.y = 1.0 - p.y;
            } 
            vec4 color = texture2D(tDiffuse, p);
            gl_FragColor = color;
        }
    `
};

export const BrightnessContrastShader = {
    uniforms: {
        tDiffuse: { value: null },
        brightness: { value: 0 },
        contrast: { value: 0 }
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
        uniform float brightness;
        uniform float contrast;
        varying vec2 vUv;
        void main() {
            gl_FragColor = texture2D( tDiffuse, vUv );
            gl_FragColor.rgb += brightness;
            if (contrast > 0.0) {
                gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) / (1.0 - contrast) + 0.5;
            } else {
                gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) * (1.0 + contrast) + 0.5;
            }
        }
    `
};

export const RGBShiftShader = {
    uniforms: {
        tDiffuse: { value: null },
        amount: { value: 0.005 },
        angle: { value: 0 }
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
        uniform float amount;
        uniform float angle;
        varying vec2 vUv;
        void main() {
            vec2 offset = amount * vec2( cos(angle), sin(angle));
            vec4 cr = texture2D(tDiffuse, vUv + offset);
            vec4 cga = texture2D(tDiffuse, vUv);
            vec4 cb = texture2D(tDiffuse, vUv - offset);
            gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
        }
    `
};

export const FilmShader = {
    uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        nIntensity: { value: 0.5 },
        sIntensity: { value: 0.05 },
        sCount: { value: 4096 },
        grayscale: { value: 1 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform bool grayscale;
        uniform float nIntensity;
        uniform float sIntensity;
        uniform float sCount;
        uniform sampler2D tDiffuse;
        varying vec2 vUv;
        void main() {
            vec4 cTextureScreen = texture2D( tDiffuse, vUv );
            float x = vUv.x * vUv.y * time *  1000.0;
            x = mod( x, 13.0 ) * mod( x, 123.0 );
            float dx = mod( x, 0.01 );
            vec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp( 0.1 + dx * 100.0, 0.0, 1.0 );
            vec2 sc = vec2( sin( vUv.y * sCount ), cos( vUv.y * sCount ) );
            cResult += cTextureScreen.rgb * vec3( sc.x, sc.y, sc.x ) * sIntensity;
            cResult = cTextureScreen.rgb + clamp( nIntensity, 0.0,1.0 ) * ( cResult - cTextureScreen.rgb );
            if(grayscale) {
                cResult = vec3( cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11 );
            }
            gl_FragColor =  vec4( cResult, cTextureScreen.a );
        }
    `
};
