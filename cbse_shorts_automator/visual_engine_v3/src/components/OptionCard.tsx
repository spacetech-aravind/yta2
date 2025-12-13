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
    // New Props for Deterministic Animation
    seed: number;
    index: number;
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
    seed,
    index,
}) => {
    // --- 1. HOOKS: MUST BE CALLED UNCONDITIONALLY ---
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Logic for Reverse Timing
    const landingFrame = landingTime * fps;
    const triggerFrame = landingFrame - (ANIMATION_DURATION_SEC * fps);

    // Spring Config (Controlled Motion)
    const springConfig = useMemo(() => ({
        mass: 0.5,
        stiffness: 280,
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

    // --- 2. ANIMATION MATRIX LOGIC ---
    
    // Distances
    const VERTICAL_OFFSET = height * 5; 
    const HORIZONTAL_OFFSET = width * 1.5; // Ensure it clears the screen width

    const { startX, startY } = useMemo(() => {
        const variantIndex = seed % 4;
        
        // Default: Target position (0, finalY)
        let sX = 0;
        let sY = finalY;

        switch (variantIndex) {
            case 0: // The Waterfall (Original: Up from bottom)
                sY = finalY - VERTICAL_OFFSET;
                break;
            case 1: // The Sweep (Left to Right)
                sX = -HORIZONTAL_OFFSET;
                break;
            case 2: // The Inverse Sweep (Right to Left)
                sX = HORIZONTAL_OFFSET;
                break;
            case 3: // The Zipper
                // A (0), C (2) -> From Left
                // B (1), D (3) -> From Right
                const isLeft = index % 2 === 0;
                sX = isLeft ? -HORIZONTAL_OFFSET : HORIZONTAL_OFFSET;
                break;
            default:
                sY = finalY - VERTICAL_OFFSET;
        }

        return { startX: sX, startY: sY };
    }, [seed, index, finalY, height, width]);

    // --- 3. INTERPOLATIONS ---

    // Scale Animation (Standard for all variants)
    const scale = interpolate(
        entranceDriver,
        [0, 1],
        [0.8, 1.0]
    );
    
    // Y-Position Interpolation
    const yPos = interpolate(
        entranceDriver,
        [0, 1],
        [startY, finalY]
    );

    // X-Position Interpolation (New)
    const xPos = interpolate(
        entranceDriver,
        [0, 1],
        [startX, 0] // 0 is always center
    );

    // --- 4. STATE & MATERIAL ENGINE ---
    const styles = useMemo(() => {
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
        if (state !== 'correct' || frame < landingFrame) return 1;
        return Math.sin(frame / 8) * 0.01 + 1.01;
    }, [state, frame, landingFrame]);

    const finalScale = scale * pulse;

    // --- 5. RENDER CHECK ---
    if (frame < (triggerFrame - ANIMATION_DURATION_SEC * fps)) {
        return null;
    }

    // --- 6. LAYOUT CONSTANTS ---
    const padding = width * 0.08;
    const textMaxWidth = width - (padding * 2);
    const fontSize = text.length > 40 ? height * 0.35 : height * 0.45;
    
    const rimDims = [width + 0.02, height + 0.02, 0.04] as [number, number, number];
    const faceDims = [width, height, 0.04] as [number, number, number];

    return (
        <group 
            position={[xPos, yPos, positionZ + styles.zOffset]} 
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