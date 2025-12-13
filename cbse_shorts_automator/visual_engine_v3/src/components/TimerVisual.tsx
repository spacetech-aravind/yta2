import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import * as THREE from 'three';
import { ShaderMaterial } from 'three';
import { NanoText } from './Typography';

// --- 1. SHADOW BACKDROP SHADER (New) ---
// Creates a dark radial vignette behind the timer to simulate local lighting control
const ShadowBackdropShader = {
    vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: `
    varying vec2 vUv;
    void main() {
        // Distance from center (0.0 to 0.5)
        float dist = distance(vUv, vec2(0.5));
        
        // Invert: 1.0 at center, 0.0 at edges
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        
        // Curve it to be subtle
        alpha = pow(alpha, 2.0);
        
        // Deep black shadow, semi-transparent
        gl_FragColor = vec4(0.0, 0.0, 0.0, alpha * 0.8);
    }
    `
};

// --- 2. HIGH-CONTRAST CHROME RING ---
const ChromeRingShader = {
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform vec3 uColor;
    uniform float uProgress;
    varying vec2 vUv;
    #define PI 3.14159265359

    void main() {
      vec2 center = vec2(0.5);
      vec2 toPixel = vUv - center;
      
      // --- GEOMETRY ---
      float angle = atan(toPixel.y, toPixel.x);
      angle = -(angle - PI / 2.0); 
      if (angle < 0.0) angle += 2.0 * PI;
      
      float radius = length(toPixel);
      float thickness = 0.08;
      float outerRadius = 0.5;
      float innerRadius = outerRadius - thickness;
      
      // Ring Mask
      float ringShape = step(innerRadius, radius) * (1.0 - step(outerRadius, radius));
      
      // Progress Mask
      float progressAngle = uProgress * 2.0 * PI;
      float angleMask = step(angle, progressAngle);
      float alpha = ringShape * angleMask;

      // --- CHROME LOGIC 2.0 (High Contrast) ---
      
      // 1. Surface Normals (0.0 = edge, 1.0 = center of ring thickness)
      // We map the radius to a -1 to 1 curve for roundness
      float normalizedPos = (radius - innerRadius) / thickness; // 0 to 1
      float curvature = sin(normalizedPos * PI); // 0 -> 1 -> 0
      
      // 2. Anodized Dark Base (The "Shadow")
      // Instead of mixing with light, we mix with BLACK to create depth
      vec3 darkBase = uColor * 0.1; // Very dark version of primary color
      vec3 midTone = uColor;
      
      // 3. Sharp Specular Highlight (The "Bling")
      // Use pow() to make the highlight extremely narrow and sharp
      float specular = pow(curvature, 10.0); // High exponent = sharper shine
      
      // 4. Fresnel Edge (Rim Light)
      // Light up the very edges of the ring slightly
      float fresnel = pow(1.0 - curvature, 3.0) * 0.5;
      
      // Combine: Base + Specular + Fresnel
      vec3 surfaceColor = mix(darkBase, midTone, curvature * 0.5); // Mostly dark
      surfaceColor += vec3(1.0) * specular; // Add White Hot shine
      surfaceColor += midTone * fresnel; // Add colored rim

      gl_FragColor = vec4(surfaceColor, alpha);
    }
  `
};

// --- 3. HIGH-CONTRAST CHROME BAR ---
const ChromeBarShader = {
    vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform vec3 uColor;
    uniform float uProgress;
    varying vec2 vUv;

    void main() {
      float fill = step(vUv.x, uProgress);
      
      // Leading Edge Glow (Hot Tip)
      float edge = 1.0 - smoothstep(0.0, 0.02, abs(vUv.x - uProgress));
      edge *= step(vUv.x, uProgress); 

      // --- CHROME LOGIC 2.0 ---

      // 1. Vertical Gradient (Cylinder Shape)
      // 0.0 (top) -> 1.0 (middle) -> 0.0 (bottom)
      float vProfile = sin(vUv.y * 3.14159); 
      
      // 2. Sharp Horizon Line (Reflection)
      // We create a sharp jump in brightness to simulate reflecting a horizon
      float horizon = smoothstep(0.4, 0.5, vProfile); 
      
      // 3. Colors
      vec3 shadow = uColor * 0.05; // Almost black
      vec3 metal = mix(shadow, uColor, horizon); // Hard mix
      
      // 4. Specular Streak
      float shine = pow(vProfile, 20.0); // Very thin horizontal streak
      
      vec3 finalColor = metal + (vec3(1.0) * shine) + (vec3(1.0) * edge);

      gl_FragColor = vec4(finalColor, fill);
    }
  `
};

// --- SHOCKWAVE (Unchanged) ---
const ShockwaveShader = {
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
    uniform vec3 uColor; uniform float uBeat; varying vec2 vUv;
    void main() {
      vec2 center = vec2(0.5);
      float dist = length(vUv - center);
      float ringRadius = uBeat * 0.5;
      float thickness = 0.1; 
      float ring = smoothstep(thickness, 0.0, abs(dist - ringRadius));
      float opacity = (1.0 - uBeat) * ring;
      gl_FragColor = vec4(uColor, opacity);
    }
  `
};

// --- COMPONENT --------------------------------------------------------------

interface TimerVisualProps {
    startTime: number;
    endTime: number;
    theme: { primary: string; secondary: string; [key: string]: any };
    fps: number;
    height: number;
    positionY: number;
    seed: number;
}

export const TimerVisual: React.FC<TimerVisualProps> = ({
    startTime,
    endTime,
    theme,
    fps,
    height,
    positionY,
    seed
}) => {
    const frame = useCurrentFrame();
    const materialRef = useRef<ShaderMaterial>(null);
    
    // Time & Logic
    const currentTime = frame / fps;
    const totalDuration = endTime - startTime;
    const timeElapsed = currentTime - startTime;
    const rawTimeRemaining = Math.max(0, totalDuration - timeElapsed);
    const progress = Math.min(1, Math.max(0, timeElapsed / totalDuration));
    const visualFill = 1.0 - progress;
    const currentSecond = Math.ceil(rawTimeRemaining);
    const displayTime = Math.max(0, currentSecond).toString();
    const beat = rawTimeRemaining % 1; 

    const VARIANT = seed % 3;

    // Stable Uniforms
    const uniforms = useMemo(() => ({
        uColor: { value: new THREE.Color(theme.primary) },
        uProgress: { value: 1.0 },
        uBeat: { value: 0.0 }
    }), []); 

    // Update Uniforms
    useLayoutEffect(() => {
        if (materialRef.current) {
            materialRef.current.uniforms.uColor.value.set(theme.primary);
            materialRef.current.uniforms.uProgress.value = visualFill;
            if (VARIANT === 2) materialRef.current.uniforms.uBeat.value = 1.0 - beat;
        }
    }, [visualFill, theme.primary, beat, VARIANT]); 

    const baseScale = height * 0.1;

    // --- HELPER: SHADOW BACKDROP ---
    // Places a dark vignette behind the timer
    const ShadowBackdrop = () => (
        <mesh position={[0, 0, -0.1]} scale={[1.5, 1.5, 1]}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
                vertexShader={ShadowBackdropShader.vertexShader}
                fragmentShader={ShadowBackdropShader.fragmentShader}
                transparent
                depthWrite={false}
            />
        </mesh>
    );

    // --- RENDERERS ---

    // VARIANT 0: CHROME RING
    if (VARIANT === 0) {
        return (
            <group position={[0, positionY, 1]} scale={[baseScale, baseScale, 1]}>
                <ShadowBackdrop />
                <mesh>
                    <planeGeometry args={[2, 2]} /> 
                    <shaderMaterial
                        ref={materialRef}
                        vertexShader={ChromeRingShader.vertexShader}
                        fragmentShader={ChromeRingShader.fragmentShader}
                        uniforms={uniforms}
                        transparent
                        depthTest={false}
                    />
                </mesh>
                <NanoText
                    text={displayTime}
                    position={[0, 0, 0.1]}
                    fontSize={1.0}
                    color={theme.primary}
                    textAlign="center"
                />
            </group>
        );
    }

    // VARIANT 1: CHROME BAR
    if (VARIANT === 1) {
        const barWidth = 4.0;
        const barHeight = 0.6;
        return (
            <group position={[0, positionY, 1]} scale={[baseScale, baseScale, 1]}>
                <ShadowBackdrop /> 
                
                {/* Track (Dimmed) */}
                <mesh position={[0, 0, -0.01]}>
                    <planeGeometry args={[barWidth, barHeight]} />
                    <meshBasicMaterial color={theme.secondary} opacity={0.3} transparent />
                </mesh>

                {/* Chrome Bar */}
                <mesh>
                    <planeGeometry args={[barWidth, barHeight]} />
                    <shaderMaterial
                        ref={materialRef}
                        vertexShader={ChromeBarShader.vertexShader}
                        fragmentShader={ChromeBarShader.fragmentShader}
                        uniforms={uniforms}
                        transparent
                    />
                </mesh>

                <NanoText
                    text={displayTime}
                    position={[0, 0.8, 0.1]}
                    fontSize={0.8}
                    color={theme.primary}
                    textAlign="center"
                />
            </group>
        );
    }

    // VARIANT 2: SHOCKWAVE
    if (VARIANT === 2) {
        const scaleSpring = interpolate(beat, [0.9, 1.0], [1.0, 1.3], { extrapolateLeft: 'clamp' });
        return (
            <group position={[0, positionY, 1]} scale={[baseScale, baseScale, 1]}>
                <ShadowBackdrop />
                <mesh scale={[2.5, 2.5, 1]}>
                    <planeGeometry args={[1, 1]} />
                    <shaderMaterial
                        ref={materialRef}
                        vertexShader={ShockwaveShader.vertexShader}
                        fragmentShader={ShockwaveShader.fragmentShader}
                        uniforms={uniforms}
                        transparent
                        depthTest={false}
                    />
                </mesh>

                <group scale={[scaleSpring, scaleSpring, 1]}>
                    <NanoText
                        text={displayTime}
                        position={[0, 0, 0.1]}
                        fontSize={1.5}
                        color={theme.primary}
                        textAlign="center"
                    />
                </group>
            </group>
        );
    }

    return null;
};