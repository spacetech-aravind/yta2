import React, { useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from 'remotion';
import { Text, Center } from '@react-three/drei';
import { FactScenario } from '../../types/schema';
import { getTheme } from '../../theme/palettes';
import { CircuitPipes } from '../3d/CircuitPipes';
import { LAYOUT, TIMING } from '../../constants';
import { estimateExplanationLayout } from '../../utils/layout-utils';


// 1. YOUR LOGIC (Adapted for 3D Units)
/* export const estimateExplanationLayout = (text: string, viewportWidth: number, fontSizeInp: number) => {
    // We use a smaller padding for 3D world units (2% of viewport width)
    const padding = viewportWidth * 0.02;
    const textWidth = viewportWidth - (padding * 2);
    const maxLines = 2;
    
    let charsPerLine = Math.ceil(text.length / maxLines);
    const MaxCharWidth = textWidth / charsPerLine;
    
    // CharWidthFactor 0.7 is broad; for many 3D fonts, 0.6 might be safer
    const CharWidthFactor = 0.7; 
    
    // fontSize here is in 3D world units
    const fontSize = Math.min(MaxCharWidth / CharWidthFactor, fontSizeInp); 
    const lineHeight = fontSize * 1.1; // 3D text usually needs a bit more line height than 0.9

    return { fontSize, textWidth, lineHeight, padding };
}; */

export const Scene2_Fact: React.FC<{ 
    scenario: FactScenario, 
    layout: any, // The layout object from Scenes.tsx
    slateY: number, 
    slateZ: number,
    cameraFinalX: number,
    cameraZ: number
}> = ({ scenario, layout, slateY, slateZ, cameraFinalX, cameraZ }) => {
    const frame = useCurrentFrame();
    const { fps, width: vidWidth, height: vidHeight } = useVideoConfig();
    const theme = getTheme(scenario.meta.theme_seed);
    const fov = 50;
    
    const s2Frame = frame - (scenario.timings.t_title * fps);

    // 2. CALCULATE DYNAMIC LAYOUT
    /* const layout1 = useMemo(() => {
            const distToDepth = Math.abs(cameraZ - slateZ);
            const vHeight = 2 * distToDepth * Math.tan((fov * Math.PI) / 360);
            const vWidth = vHeight * (vidWidth / vidHeight);

            // Calculate Text Specs
            const baseFontSize = vHeight * 0.08; 
            const fontSpecs = estimateExplanationLayout(
                scenario.content.fact_title, 
                vWidth * LAYOUT.S2_TITLE.MAX_WIDTH_PERCENT, 
                baseFontSize
            );

            // --- THE COORDINATE FIX ---
            // slateY is the CENTER of the slate.
            // We need the TOP edge of the slate to calculate the gap correctly.
            const slateHeight = LAYOUT.S1_SLATE_WIDTH * 0.5625;
            const slateBottomY = slateY - (slateHeight / 2); // Center + Half Height = Top Edge

            // Convert the Padding Percentage to World Units based on the Viewport Height
            const paddingWorldUnits = (LAYOUT.S2_TITLE.PADDING_FROM_SLATE_BOTTOM) * vHeight;

            // The text should start at: Slate Top + Padding
            // Note: In Three.js, +Y is UP. If you want the text ABOVE the slate, you add.
            // If you want it BELOW the pipes (which are below the slate), you subtract.
            const textAnchorY = slateBottomY - paddingWorldUnits; 

            console.log("📐 LAYOUT DEBUG:", {
                vHeight, 
                calculatedBase: vHeight * 0.08,
                finalFontSize: fontSpecs.fontSize,
                maxAllowed: LAYOUT.S2_TITLE.MAX_FONT_SIZE
            });
            return { ...fontSpecs, textAnchorY };
        }, [cameraZ, slateZ, vidWidth, vidHeight, scenario.content.fact_title, slateY]);
     */
        // 1. Calculate specific start frames using your constants
        const startTimePipes = scenario.timings.t_title * fps;
        const startTimeTitle = (scenario.timings.t_title + TIMING.SCENE2_DELAY_TITLE) * fps;
        const detailsStartFrame = scenario.timings.t_details * fps;
        const LEAD_FRAMES = 5; // Finish 5 frames before card starts

        // 2. Create independent springs for separate control
        const pipesProgress = interpolate(
    frame,
    [
        startTimePipes,                   // EXACT START
        detailsStartFrame - LEAD_FRAMES   // FINISH BEFORE CARD
    ],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

        const titleEntrance = spring({ 
            frame: frame - startTimeTitle, 
            fps, 
            config: { stiffness: 100, damping: 12 } // Snappier pop for the text
        });

    const slateHeight = LAYOUT.S1_SLATE_WIDTH * 0.5625;
    //const paddingFromSlate = layout.paddingInWorldUnits; 
    //const titleTopY = slateY - (slateHeight / 2)*0 - paddingFromSlate*0;
    const animatedScale = interpolate(titleEntrance, [0, 1], [0, 1]);

    const audioEndFrame = (scenario.timings.t_details + scenario.timings.detailsAudioDuration) * fps;
    const exitStartFrame = audioEndFrame + (TIMING.S2_HANG_DURATION * fps);
    const exitEndFrame = exitStartFrame + (TIMING.S2_EXIT_DURATION * fps);

        // 2. Calculate exit progress
    const titleExit = interpolate(
        frame,
        [exitStartFrame, exitEndFrame],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // 3. Combine Entrance Spring and Exit Interpolation for Scale
    const finalTitleScale = titleEntrance * (1 - titleExit);

    return (
        <group>
            <CircuitPipes 
                theme={theme} 
                progress={pipesProgress} 
                startY={slateY - (slateHeight / 2)} 
                endY={layout.textAnchorY} 
                originX={cameraFinalX}
                slateZ={slateZ}
                titleZ={slateZ}
                scale={layout.textWidth} 
                scenario={scenario}
                cardTopY={layout.cardTopY}
            />

            <group position={[cameraFinalX, layout.textAnchorY, slateZ]} scale={[finalTitleScale, finalTitleScale, 1]}>
                 
                    <Text
                        font={staticFile("assets/fonts/bold.ttf")}
                        fontSize={layout.fontSize}
                        maxWidth={layout.textWidth} // Using the calculated textWidth
                        lineHeight={LAYOUT.S2_TITLE.LINE_HEIGHT_MULT}
                        textAlign="center"
                        anchorX="center"
                        anchorY="top"
                        color={theme.text_header_3d}
                    >
                        {scenario.content.fact_title}
                        <meshStandardMaterial 
                            emissive={theme.accent_primary} 
                            emissiveIntensity={0.4} 
                        />
                    </Text>
                
            </group>
        </group>
    );
};