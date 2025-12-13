import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { RoundedBox } from '@react-three/drei';
import { NanoText } from './Typography';

interface ExplanationCardProps {
    text: string;
    width: number;
    anchorY: number; // The Y position of the element ABOVE this card
    safeZoneY: number; // The absolute floor (NVU 0.15 converted to World)
    startTime: number;
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
    text,
    width,
    anchorY,
    safeZoneY,
    startTime
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // --- 1. DYNAMIC LAYOUT & SAFETY PROTOCOL ---
    const layout = useMemo(() => {
        const padding = width * 0.05;
        const textWidth = width - (padding * 2);
        const fontSize = width * 0.045; // Smaller than Question text
        const lineHeight = fontSize * 1.2;
        
        // Estimate Height
        const avgCharWidth = fontSize * 0.6;
        const charsPerLine = textWidth / avgCharWidth;
        const lines = Math.ceil(text.length / charsPerLine);
        const textHeight = lines * lineHeight;
        const boxHeight = textHeight + (padding * 2);

        // Position Calculation (Centered below anchor)
        const GAP = 0.2; // Small gap between Docked Card and Explanation
        const centerY = anchorY - GAP - (boxHeight / 2);
        const bottomEdge = centerY - (boxHeight / 2);

        // CRITICAL SAFETY EXCEPTION
        if (bottomEdge < safeZoneY) {
            throw new Error(
                `[SAFETY_PROTOCOL_VIOLATION] Explanation Card Bottom (${bottomEdge.toFixed(3)}) exceeds Safe Zone (${safeZoneY.toFixed(3)}). Render Aborted to prevent UI occlusion.`
            );
        }

        return { boxHeight, centerY, fontSize, textWidth, textHeight };
    }, [text, width, anchorY, safeZoneY]);

    // --- 2. ELASTIC POP ANIMATION (Mass 0.5, Tension 300) ---
    const startFrame = startTime * fps;
    const progress = spring({
        frame: frame - startFrame,
        fps,
        config: { mass: 0.5, tension: 300, friction: 20 }, // Snappy
    });

    const scale = interpolate(progress, [0, 1], [0, 1]);

    if (frame < startFrame) return null;

    return (
        <group position={[0, layout.centerY, 0.2]} scale={[scale, scale, 1]}>
            {/* STICKY NOTE GEOMETRY */}
            <RoundedBox args={[width, layout.boxHeight, 0.02]} radius={0.03} smoothness={4}>
                <meshStandardMaterial 
                    color="#FFC107" // Amber/Yellow Sticky Note
                    roughness={0.9} // Cardboard/Paper texture
                    metalness={0.0}
                />
            </RoundedBox>

            {/* TEXT CONTENT */}
            <NanoText 
                text={text}
                position={[0, 0, 0.02]}
                fontSize={layout.fontSize}
                color="#222222" // Dark Ink text for contrast
                maxWidth={layout.textWidth}
                textAlign="center"
                anchorX="center"
                anchorY="middle"
            />
        </group>
    );
};