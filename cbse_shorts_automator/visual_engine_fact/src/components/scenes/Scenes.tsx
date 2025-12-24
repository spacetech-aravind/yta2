import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { SceneContent } from './Scene1'; 
import { Scene2_Fact } from './Scene2_Fact'; 
import { Scene2 } from './Scene2'; 
import { ThreeCanvas } from '@remotion/three';
import { FactScenario } from '../../types/schema';
import { getTheme } from '../../theme/palettes';
import { SCENE_1_CONFIG, LAYOUT } from '../../constants';
import * as THREE from 'three';
import { estimateExplanationLayout } from '../../utils/layout-utils';

export const Scenes: React.FC<{ scenario: FactScenario }> = ({ scenario }) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const theme = getTheme(scenario.meta.theme_seed);

    // 1. Global Timings
    const tTitleFrame = Math.round(scenario.timings.t_title * fps);
    const tCtaFrame = Math.round(scenario.timings.t_cta * fps);

    // 2. SHARED 3D POSITIONS
    // We re-calculate the final anchor points here so BOTH scenes are synced
    // ... inside Scenes.tsx ...

    // 1. REPLICATE SCENE 1 GRID MATH EXACTLY
    const { TARGET_SLATE_ITEM, GRID_Z_COUNT, TUNNEL_LENGTH, BOX_W_FACT, BOX_H_FACT, GRID_Y_COUNT,GRID_X_COUNT } = SCENE_1_CONFIG;
    const slateWidth = LAYOUT.S1_SLATE_WIDTH;
    const fov = 50;

    // 2. CALCULATE CAMERA & SLATE POSITIONS (Z-AXIS)
    // NOTE: Tunnel goes into Negative Z
    const boxdepth_plus_gap = TUNNEL_LENGTH / GRID_Z_COUNT;
    const targetZ = -(boxdepth_plus_gap * TARGET_SLATE_ITEM.z); 
    
    // Camera rests slightly behind the target wall
    const cameraFinalZ = targetZ + (boxdepth_plus_gap * 0.75);

    // Slate moves to this Z depth to fill 90% of screen width
    const distToReach90Percent = (slateWidth / 0.9) / (2 * Math.tan((fov * Math.PI) / 360) * (9/16));
    const finalStopZ = cameraFinalZ - distToReach90Percent;

    // 3. CALCULATE CAMERA Y (Center of View)
    // This matches Scene 1's 'TARGET_COORDINATEy' logic perfectly
    const boxHeight = slateWidth * 0.5625; 
    const boxWidth = slateWidth; 
    const boxWidthWithGap = boxWidth / BOX_W_FACT;
    const boxHeightWithGap = boxHeight / BOX_H_FACT;
    const finalCamX = (TARGET_SLATE_ITEM.x - (GRID_X_COUNT - 1.05) / 2) * boxWidthWithGap;
    const finalCamY = (TARGET_SLATE_ITEM.y - (GRID_Y_COUNT - 1.05) / 2) * boxHeightWithGap;

    // 4. CALCULATE LOCKED VIEWPORT Y (Top of Screen)
    const lockedDestinationY = useMemo(() => {
        // Calculate Viewport Height at the Slate's specific depth
        const distance = Math.abs(cameraFinalZ - finalStopZ);
        const vHeightAtDepth = 2 * distance * Math.tan((fov * Math.PI) / 360);

        // Determine the "Top of Screen" in World Coordinates
        // Since camera is looking at 'finalCamY', the top edge is finalCamY + (height / 2)
        const topEdgeWorldY = finalCamY + (vHeightAtDepth / 2);

        // Apply Layout Margins (e.g. 5% from top) and Center Offset
        const marginOffset = vHeightAtDepth * LAYOUT.S2_SLATE_TOP;
        const halfSlateHeight = boxHeight / 2;

        return topEdgeWorldY - marginOffset - halfSlateHeight;
    }, [cameraFinalZ, finalStopZ, finalCamY, boxHeight]); // Dependencies are now valid

    // ... inside Scenes.tsx, after lockedDestinationY is calculated ...

    // DEBUGGING: COORDS & DIMENSIONS
    useMemo(() => {
        const distance = Math.abs(cameraFinalZ - finalStopZ);
        const vHeightAtDepth = 2 * distance * Math.tan((fov * Math.PI) / 360);
        const halfHeight = vHeightAtDepth / 2;
        const topEdge = finalCamY + halfHeight;
        
        console.group("🚨 SCENE 2 POSITIONAL DEBUGGING");
        console.log("--------------------------------------------------");
        console.log("📸 CAMERA LOOK-AT Y (finalCamY):", finalCamY.toFixed(3));
        console.log("📐 DISTANCE (Cam <-> Slate):    ", distance.toFixed(3));
        console.log("📺 VIEWPORT HEIGHT at Depth:    ", vHeightAtDepth.toFixed(3));
        console.log("--------------------------------------------------");
        console.log("⬆️  CALCULATED TOP EDGE Y:       ", topEdge.toFixed(3));
        console.log("📏 MARGIN OFFSET (from top):    ", (vHeightAtDepth * LAYOUT.S2_SLATE_TOP).toFixed(3));
        console.log("📉 SUBTRACT SLATE HALF-HEIGHT:  ", (boxHeight / 2).toFixed(3));
        console.log("--------------------------------------------------");
        console.log("🎯 FINAL DESTINATION Y:         ", lockedDestinationY.toFixed(3));
        console.log("🏁 STARTING Y (Target Coord):   ", finalCamY.toFixed(3)); // Assuming start is centered
        console.log("🚀 MOVEMENT DELTA:              ", (lockedDestinationY - finalCamY).toFixed(3));
        
        if (lockedDestinationY < finalCamY) {
            console.error("❌ CRITICAL ERROR: Destination is BELOW the Camera Center! Slate will move down.");
        } else {
            console.log("✅ CHECK PASSED: Destination is ABOVE Camera Center.");
        }
        console.groupEnd();
    }, [cameraFinalZ, finalStopZ, finalCamY, lockedDestinationY, boxHeight, fov]);
    

    // NEW: Centralized Layout Calculation
// Inside Scenes.tsx
        const layoutInfo = useMemo(() => {
            const fov = 50;
            const distToDepth = Math.abs(cameraFinalZ - finalStopZ);
            const vHeight = 2 * distToDepth * Math.tan((fov * Math.PI) / 360);
            const vWidth = vHeight * (width / height);
            
            // 1. Calculate Font Specs (Moved from Scene2_Fact)
            const baseFontSize = vHeight * 0.08; 
            const fontSpecs = estimateExplanationLayout(
                scenario.content.fact_title, 
                vWidth * LAYOUT.S2_TITLE.MAX_WIDTH_PERCENT, 
                baseFontSize
            );
            //const textWidth = fontSpecs.textWidth;
        
        //const avgCharWidth = fontSpecs.avgCharWidth;
        //const charsPerLine = fontSpecs.textWidth / avgCharWidth;
        //const lines = Math.ceil(scenario.content.fact_title.length / charsPerLine);
        const lines = fontSpecs.lines;
        const textHeight = lines * fontSpecs.lineHeight;

            // 2. Coordinate Math
            const slateHeight = LAYOUT.S1_SLATE_WIDTH * 0.5625;
            const slateBottomY = lockedDestinationY - (slateHeight / 2);
            const paddingWorldUnits = LAYOUT.S2_TITLE.PADDING_FROM_SLATE_BOTTOM * vHeight;
            const textAnchorY = slateBottomY - paddingWorldUnits;

            const visibleWorldHeight = 2 * distToDepth * Math.tan((fov * Math.PI) / 360);
            const relativeY = textAnchorY - finalCamY;
            // 1. Where the Title top is
            const titleTopPercent = 0.5 - (relativeY / visibleWorldHeight);
            
            // 2. How much space the Title occupies
            const titleHeightPercent = textHeight / visibleWorldHeight;
            
            // 3. The Gap between bottom of Title and top of Card
            const gapPadding = LAYOUT.S2_BODY_CARD.GAP_FROM_TITLE_BOTTOM;
            
            // FINAL SUM: Starting point of the Card
            const boxStartPercent = titleTopPercent + titleHeightPercent + gapPadding;
            const cardTopY = finalCamY + (visibleWorldHeight * (0.5 - boxStartPercent));
    

            return { 
                ...fontSpecs, // includes fontSize, textWidth, lineHeight
                textAnchorY,
                vWidth,
                vHeight,
                baseFontSize,
                textHeight,
                boxStartPercent,
                cardTopY
            };
        }, [cameraFinalZ, finalStopZ, width, height, scenario.content.fact_title, lockedDestinationY]);


    return (
        <AbsoluteFill>
            {/* LAYER 1: THE PERSISTENT 3D STAGE */}
            <ThreeCanvas
                linear
                width={width}
                height={height}
                style={{ backgroundColor: theme.bg_gradient[0] }}
            >
                {/* We pass the pre-calculated anchors to Scene 1 */}
                <SceneContent 
                    scenario={scenario} 
                    lockedDestinationY={lockedDestinationY} 
                    finalStopZ={finalStopZ} 
                />

                {/* We pass the SAME anchors to Scene 2 so pipes attach perfectly */}
                {frame >= tTitleFrame && frame < tCtaFrame && (
                    <Scene2_Fact 
                        scenario={scenario} 
                        layout={layoutInfo}
                        slateY={lockedDestinationY} 
                        slateZ={finalStopZ} 
                        cameraZ={cameraFinalZ}
                        cameraFinalX={finalCamX}
                        //cameraFinalY={finalCamY}
                    />
                    
                )}
            </ThreeCanvas>
                {/* LAYER 2: THE 2D HTML OVERLAYS */}
                {frame >= tTitleFrame && (
                    <Scene2 
                        scenario={scenario} 
                        theme={theme}
                        layout={layoutInfo}
                        //slateY={lockedDestinationY}
                        slateZ={finalStopZ}
                        cameraZ={cameraFinalZ}
                        cameraY={finalCamY} // The center of the camera's view
                    />
                )}
        </AbsoluteFill>
    );
};