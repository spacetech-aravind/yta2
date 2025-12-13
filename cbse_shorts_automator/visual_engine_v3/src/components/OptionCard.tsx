import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { RoundedBox } from '@react-three/drei';
import { NanoText } from './Typography';

const ANIMATION_DURATION_SEC = 0.4;

export type OptionState = 'neutral' | 'correct' | 'wrong' | 'dimmed';

interface OptionCardProps {
    text: string;
    state: OptionState;
    theme: { primary: string; secondary: string; [key: string]: any };
    width: number;
    height: number;
    finalY: number; 
    landingTime: number; 
    positionZ: number; 
}

export const OptionCard: React.FC<OptionCardProps> = ({
    text,
    state,
    theme,
    width,
    height,
    finalY,
    landingTime,
    positionZ,
}) => {
    // --- 1. HOOKS: MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL ---
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Logic for Reverse Timing
    const landingFrame = landingTime * fps;
    const triggerFrame = landingFrame - (ANIMATION_DURATION_SEC * fps);

    // Spring Config (Controlled Motion)
    const springConfig = useMemo(() => ({
        mass: 1, 
        stiffness: 100,
        damping: 20,
    }), []);
    
    // Spring Driver
    const entranceDriver = spring({
        frame: frame - triggerFrame,
        fps,
        config: springConfig,
        from: 0, 
        to: 1
    });

    // --- 2. LOGIC BASED ON HOOK OUTPUT ---

    // Interpolation for Scale (0.8 -> 1.0)
    const scale = interpolate(
        entranceDriver, // Input is the spring's non-linear progress (0 to 1)
        [0, 1],
        [0.8, 1.0]
    );
    
    // Interpolation for Y-Position (Start 1.5x Height Below -> finalY)
    const slideDisplacement = height * 5; 
    const yPos = interpolate(
        entranceDriver,
        [0, 1],
        [finalY - slideDisplacement, finalY ]
    );

    // STATE & MATERIAL ENGINE
    const styles = useMemo(() => {
        const rimSize = 0.04;
        switch (state) {
            case 'correct':
                return {
                    isCorrect: true, rimColor: theme.primary, rimEmissiveIntensity: 2.0,
                    faceColor: theme.primary, faceMetalness: 0.8, faceRoughness: 0.2,
                    textColor: '#a0af4eff', opacity: 1, zOffset: 0.3
                };
            case 'wrong':
                return {
                    isCorrect: false, rimColor: '#330000', rimEmissiveIntensity: 0,
                    faceColor: '#1a1a1a', faceMetalness: 0.2, faceRoughness: 0.8,
                    textColor: '#555555', opacity: 0.9, zOffset: 0
                };
            case 'neutral':
            default:
                return {
                    isCorrect: false, rimColor: theme.secondary, rimEmissiveIntensity: 0.2,
                    faceColor: '#000000', faceMetalness: 0.1, faceRoughness: 0.2,
                    textColor: '#FFFFFF', opacity: 0.7, zOffset: 0
                };
        }
    }, [state, theme]);

    // PULSE ANIMATION (Correct State Only)
    const pulse = useMemo(() => {
        // Pulse only starts after the card has landed
        if (state !== 'correct' || frame < landingFrame) return 1;
        return Math.sin(frame / 8) * 0.01 + 1.01;
    }, [state, frame, landingFrame]);

    const finalScale = scale * pulse;

    // --- 3. FINAL VISIBILITY CHECK (Now safe to return) ---
    // FIX: Only render if the current frame is at or past the calculated trigger frame.
    if (frame < (triggerFrame-ANIMATION_DURATION_SEC*fps)) {
        return null;
    }

    // --- 4. LAYOUT ---
    const padding = width * 0.08;
    const textMaxWidth = width - (padding * 2);
    const fontSize = text.length > 40 ? height * 0.35 : height * 0.45;
    
    const rimDims = [width + 0.02, height + 0.02, 0.04] as [number, number, number];
    const faceDims = [width, height, 0.04] as [number, number, number];

    return (
        <group 
            position={[0, yPos, positionZ + styles.zOffset]} 
            scale={[finalScale, finalScale, 1]}
        >
            {/* LAYER 1: RIM (Glow/Bloom) */}
            <RoundedBox args={rimDims} radius={0.06} smoothness={4}>
                <meshStandardMaterial 
                    color={styles.rimColor}
                    emissive={styles.rimColor}
                    emissiveIntensity={styles.rimEmissiveIntensity}
                    transparent={styles.opacity < 1}
                    opacity={styles.opacity}
                />
            </RoundedBox>

            {/* LAYER 2: BODY (Physical Material) */}
            <group position={[0, 0, 0.025]}> 
                <RoundedBox args={faceDims} radius={0.05} smoothness={4}>
                    {styles.isCorrect ? (
                        <meshPhysicalMaterial 
                            color={styles.faceColor}
                            metalness={styles.faceMetalness}
                            roughness={styles.faceRoughness}
                            clearcoat={1}
                            clearcoatRoughness={0.1}
                        />
                    ) : (
                        <meshStandardMaterial 
                            color={styles.faceColor} 
                            transparent 
                            opacity={styles.opacity}
                            roughness={styles.faceRoughness}
                        />
                    )}
                </RoundedBox>
            </group>

            {/* LAYER 3: TEXT */}
            <NanoText 
                text={text}
                position={[0, 0, 0.08]}
                fontSize={fontSize}
                color={styles.textColor}
                maxWidth={textMaxWidth}
                textAlign="center"
            />
        </group>
    );
};