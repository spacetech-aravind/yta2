import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Theme } from '../../theme/palettes';

export const TravelingBackground: React.FC<{ theme: Theme }> = ({ theme }) => {
    const { viewport } = useThree();

    // Custom Shader for the "Infinite Studio" Vignette
    // Uses an exponential power (dist * dist) for a smooth "Tunnel" falloff
    const shaderArgs = useMemo(() => ({
        uniforms: {
            uColorInner: { value: new THREE.Color(theme.bg_gradient_inner) },
            uColorOuter: { value: new THREE.Color(theme.bg_gradient_outer) },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColorInner;
            uniform vec3 uColorOuter;
            varying vec2 vUv;

            void main() {
                // Calculate distance from center (0.5, 0.5)
                vec2 center = vec2(0.5, 0.5);
                float dist = distance(vUv, center);

                // EXPONENTIAL FALLOFF: 
                // Multiplies distance by 1.2 to pull corners into darkness
                // Powers it by 2.5 to keep the center rich and the edges steep
                float vignette = smoothstep(0.0, 1.0, pow(dist * 1.5, 2.0));

                // Mix Inner -> Outer based on vignette
                vec3 finalColor = mix(uColorInner, uColorOuter, vignette);
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `
    }), [theme.bg_gradient_inner, theme.bg_gradient_outer]);

    return (
        <mesh scale={[viewport.width, viewport.height, 1]}>
            <planeGeometry args={[1, 1]} />
            <shaderMaterial args={[shaderArgs]} depthWrite={false} />
        </mesh>
    );
};