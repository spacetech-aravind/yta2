import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { RoundedBox } from '@react-three/drei';
import { NanoText } from './Typography';

// Allows the parent to know how tall this box will be
export const estimateQuestionHeight = (text: string, maxWidth: number, viewportWidth: number) => {
    const baseFontSize = viewportWidth * 0.055;
    
    // Logic matches the component's internal sizing
    const avgCharWidth = baseFontSize * 0.6;
    const charsPerLine = maxWidth / avgCharWidth;
    const estimatedLines = Math.ceil(text.length / charsPerLine);

    // Font Shrink Logic
    let finalFontSize = baseFontSize;
    if (estimatedLines > 3 && estimatedLines <= 5) finalFontSize = baseFontSize * 0.80;
    else if (estimatedLines > 5) finalFontSize = baseFontSize * 0.65;

    const finalLineHeight = finalFontSize * 0.9;
    const padding = maxWidth * 0.05;
    
    // Recalculate lines with final font size
    const finalAvgCharWidth = finalFontSize * 0.6;
    const finalCharsPerLine = maxWidth / finalAvgCharWidth;
    const finalLines = Math.ceil(text.length / finalCharsPerLine);

    return (finalLines * finalLineHeight) + (padding * 2);
};

interface TypewriterQuestionProps {
    text: string;
    theme: { secondary: string; [key: string]: any };
    viewportWidth: number;
    maxWidth: number; // New Prop
    startTime: number;
    finishTime: number;
    position: [number, number, number];
}

export const TypewriterQuestion: React.FC<TypewriterQuestionProps> = ({
    text,
    theme,
    viewportWidth,
    startTime,
    finishTime,
    position
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // --- 1. NEW "WRAP FIRST" LAYOUT LOGIC ---
    const layout = useMemo(() => {
        // 1. Setup Constraints
        const maxBoxWidth = viewportWidth * 0.85; 
        const padding = maxBoxWidth * 0.01;
        const textMaxWidth = maxBoxWidth - (padding * 2);
        const baseFontSize = viewportWidth * 0.065; // Standard Large Size

        // 2. Estimate Lines at Base Size
        // Average char width is approx 0.6 * fontSize for standard sans-serif
        const avgCharWidth = baseFontSize * 0.6;
        const charsPerLine = textMaxWidth / avgCharWidth;
        const estimatedLines = Math.ceil(text.length / charsPerLine);

        // 3. Decision Matrix: Wrap vs Shrink
        let finalFontSize = baseFontSize;
        
        // If it fits in 3 lines or less, keep it BIG.
        // If it needs 4+ lines, shrink it to prevent covering the whole screen.
        if (estimatedLines > 3 && estimatedLines <= 5) {
            finalFontSize = baseFontSize * 0.8; // Moderate Shrink
        } else if (estimatedLines > 5) {
            finalFontSize = baseFontSize * 0.65; // Aggressive Shrink
        }

        // 4. Recalculate Box Height based on Final Decision
        const finalLineHeight = finalFontSize * 0.9;
        // Recalculate lines with new font size to get accurate box height
        const finalAvgCharWidth = finalFontSize * 0.6;
        const finalCharsPerLine = textMaxWidth / finalAvgCharWidth;
        const finalLines = Math.ceil(text.length / finalCharsPerLine);
        
        const boxHeight = (finalLines * finalLineHeight) + (padding * 2 );

        return {
            fontSize: finalFontSize,
            boxWidth: maxBoxWidth,
            boxHeight: boxHeight,
            textMaxWidth: textMaxWidth
        };
    }, [text, viewportWidth]);


    // --- 2. SMART PACING (Unchanged) ---
    const smartPacing = useMemo(() => {
        const startFrame = startTime * fps;
        const endFrame = (finishTime - 0.5) * fps; 
        const safeEndFrame = Math.max(endFrame, startFrame + 30);
        return { startFrame, endFrame: safeEndFrame };
    }, [startTime, finishTime, fps]);

    const progress = interpolate(
        frame,
        [smartPacing.startFrame, smartPacing.endFrame],
        [0, 1],
        { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
    );
    
    const visibleLength = Math.floor(progress * text.length);
    const displayText = text.slice(0, visibleLength);

    return (
        <group position={position}>
            {/* Background Card */}
            <group position={[0, 0, -0.05]}>
                <RoundedBox 
                    args={[layout.boxWidth, layout.boxHeight, 0.05]} 
                    radius={0.05} 
                    smoothness={4}
                >
                    <meshStandardMaterial 
                        color="black" 
                        transparent 
                        opacity={0.8} 
                    />
                </RoundedBox>
            </group>

            {/* Text Layer */}
            <NanoText 
                text={displayText}
                position={[0, 0, 0]}
                fontSize={layout.fontSize} // Uses the calculated size
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                maxWidth={layout.textMaxWidth} // Forces Wrapping
                textAlign="center"
            />
        </group>
    );
};