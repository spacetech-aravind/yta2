import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { FactScenario } from '../../types/schema';
import { HTMLTextOverlay } from '../overlays/HTMLTextOverlay';
import { LAYOUT } from '../../constants';
import { Theme } from '../../theme/palettes';

interface Scene2Props {
    scenario: FactScenario;
    theme: Theme; 
    slateY: number;      // lockedDestinationY from Scenes.tsx
    slateZ: number;      // finalStopZ from Scenes.tsx
    cameraZ: number;     // cameraFinalZ from Scenes.tsx
    cameraY: number;     // finalCamY from Scenes.tsx
}

/**
 * SCENE 2: THE FACT DELIVERY BRIDGE
 * This component calculates the 3D title's position in world space
 * and passes it to the HTML overlay for 2D screen mapping.
 */
export const Scene2: React.FC<{
    scenario: FactScenario;
    theme: Theme; 
    layout: any; // The layout object from Scenes.tsx
    cameraZ: number;
    slateZ: number;
    cameraY: number;
}> = ({ scenario, theme, layout, cameraZ, slateZ, cameraY }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { width: vid_width, height: vid_height } = useVideoConfig();

       /* const layoutInfo = useMemo(() => {
            const fov = 50; 
            const distToDepth = Math.abs(cameraZ - slateZ);
            const visibleWorldHeight = 2 * distToDepth * Math.tan((fov * Math.PI) / 360);
            const relativeY = layout.textAnchorY - cameraY;
            
            // 1. Where the Title top is
            const titleTopPercent = 0.5 - (relativeY / visibleWorldHeight);
            
            // 2. How much space the Title occupies
            const titleHeightPercent = layout.TextHeight / visibleWorldHeight;
            
            // 3. The Gap between bottom of Title and top of Card
            const gapPadding = LAYOUT.S2_BODY_CARD.GAP_FROM_TITLE_BOTTOM;
            
            // FINAL SUM: Starting point of the Card
            const boxStartPercent = titleTopPercent + titleHeightPercent + gapPadding;
    
            return { boxStartPercent };
        }, [layout.textAnchorY, cameraY, cameraZ, slateZ, layout.TextHeight]); */

    if (frame < scenario.timings.t_title * fps) return null;

    return (
        <AbsoluteFill>
            <HTMLTextOverlay 
                scenario={scenario} 
                textAnchorY={layout.textAnchorY}
                titleFontSize={layout.baseFontSize}
                titleTextHeight={layout.textHeight}
                boxStartPercent={layout.boxStartPercent}
                cameraY={cameraY}
                cameraZ={cameraZ}
                slateZ={slateZ}
                theme={theme}
            />
        </AbsoluteFill>
    );
};