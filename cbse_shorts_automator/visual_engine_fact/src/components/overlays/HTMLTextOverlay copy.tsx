import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { FactScenario } from '../../types/schema';
import { TIMING, LAYOUT } from '../../constants';

interface HTMLTextOverlayProps {
    scenario: FactScenario;
    textAnchorY: number;   
    titleFontSize: number; 
    cameraY: number;       
    cameraZ: number;       
    slateZ: number;        
}

const getScrambledText = (text: string, frame: number, decodeFrames: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const progress = Math.min(frame / decodeFrames, 1);
    const tokens = text.match(/(<[^>]*>|[^<]|[\uD800-\uDBFF][\uDC00-\uDFFF])/g) || [];
    
    return tokens.map((token, i) => {
        if (token.startsWith("<")) return token;
        if (token === " " || i / tokens.length < progress) return token;
        return chars[Math.floor((frame + i) % chars.length)];
    }).join("");
};

export const HTMLTextOverlay: React.FC<HTMLTextOverlayProps> = ({ 
    scenario, 
    textAnchorY, 
    titleFontSize, 
    cameraY,
    cameraZ,
    slateZ
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const layoutInfo = useMemo(() => {
    const fov = 50; 
    const distToDepth = Math.abs(cameraZ - slateZ);
    // This is the total height of the 3D world visible on screen at that depth
    const visibleWorldHeight = 2 * distToDepth * Math.tan((fov * Math.PI) / 360);

    // 1. Calculate how far the Anchor is from the center (cameraY)
    const offsetFromCenter = textAnchorY - cameraY;

    // 2. Convert to Screen percentage (0.5 is center)
    // NOTE: In 3D, positive Y is UP. In HTML, positive Y is DOWN. 
    // So we SUBTRACT the normalized offset.
    const titleTopYPercent = 0.5 - (offsetFromCenter / visibleWorldHeight);

    // 3. Add the Title Height 
    // (Since anchorY is "top", the title grows downward in 3D)
    const titleHeightScreenPercent = (titleFontSize * 1.2) / visibleWorldHeight;

    // 4. Add the Gap (Padding)
    // Ensure this constant is a fraction (e.g., 0.05 for 5vh)
    const gapPadding = LAYOUT.S2_TITLE.PADDING_FROM_SLATE_BOTTOM;

    const bodyStartPercent = titleTopYPercent + titleHeightScreenPercent*0 + gapPadding*0;

    return { bodyStartPercent };
}, [textAnchorY, cameraY, titleFontSize, cameraZ, slateZ]);

    const s2Frame = frame - (scenario.timings.t_title * fps);
    const entrance = spring({ 
        frame: s2Frame, 
        fps, 
        config: { damping: 14, stiffness: 100 } 
    });

    const displayText = useMemo(() => {
        return getScrambledText(scenario.content.fact_body_html, s2Frame, TIMING.S2_DECODE_FRAMES);
    }, [s2Frame, scenario.content.fact_body_html]);

    if (s2Frame < 0) return null;

    return (
        <AbsoluteFill style={{ 
            justifyContent: 'flex-start', 
            alignItems: 'center', 
            pointerEvents: 'none' 
        }}>
            <div style={{
                // Convert fraction to vh units
                marginTop: `${layoutInfo.bodyStartPercent * 100}vh`, 
                width: `${LAYOUT.S2_TEXT_BOX_WIDTH * 100}vw`,
                padding: `${LAYOUT.S2_PADDING_VH * 100}vh`,
                
                background: 'rgba(10, 10, 15, 0.6)',
                backdropFilter: 'blur(15px) saturate(180%)',
                borderRadius: `${LAYOUT.S2_BORDER_RADIUS_VH * 100}vh`,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
                
                color: 'white',
                fontFamily: 'monospace',
                fontSize: `${LAYOUT.S2_FONT_SIZE_VH * 100}vh`,
                lineHeight: '1.4',
                textAlign: 'left',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                
                opacity: entrance,
                transform: `translateY(${interpolate(entrance, [0, 1], [2, 0])}vh)`
            }}>
                <div 
                    style={{ textShadow: '0 0 10px rgba(255,255,255,0.2)', display: 'block' }}
                    dangerouslySetInnerHTML={{ __html: displayText }} 
                />
            </div>
        </AbsoluteFill>
    );
};