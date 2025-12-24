import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from 'remotion';
import { FactScenario } from '../../types/schema';
import { TIMING, LAYOUT } from '../../constants';
import { Theme } from '../../theme/palettes'; 

interface HTMLTextOverlayProps {
    scenario: FactScenario;
    theme: Theme; 
    textAnchorY: number;    
    titleFontSize: number; 
    cameraY: number;        
    cameraZ: number;   
    titleTextHeight: number;      
    slateZ: number;     
    boxStartPercent: number;    
}

// Helper: Matrix Decode that respects HTML tags
const getScrambledText = (htmlContent: string, progress: number, frame: number,theme:Theme) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    // This removes HTML tags to count actual visible characters
    const plainText = htmlContent.replace(/<[^>]*>/g, '');
    const totalChars = plainText.length;
    const revealedCount = Math.floor(progress * totalChars);

    let globalCharIndex = 0;
    const tokens = htmlContent.split(/(<[^>]*>)/g).filter(Boolean);

    return tokens.map((token) => {
        if (token.startsWith('<')) return token; // Keep HTML tags intact

        return token.split('').map((char) => {
            const i = globalCharIndex++;
            
            if (i < revealedCount) {
                return char; 
            }
            if (i < revealedCount + 3) {
                const randomChar = chars[(i + frame) % chars.length];
                // Use a <span> with a fixed width or just the random char
                return `<span style="color: ${theme.accent_primary};">${randomChar}</span>`;
            }
            // FIX: Instead of 'A', use the actual 'char' but make it invisible
            // This reserves the EXACT pixel width the character will eventually take
            return `<span style="visibility: hidden">${char}</span>`;
        }).join('');
    }).join('');
};

export const HTMLTextOverlay: React.FC<HTMLTextOverlayProps> = ({ 
    scenario, 
    theme, 
    textAnchorY, 
    titleFontSize, 
    cameraY,
    cameraZ,
    titleTextHeight,
    slateZ,
    boxStartPercent
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    

    // --- 1. LOCAL FONT REGISTRATION ---
    // This injects the font-face globally for this component
    const fontUrl = staticFile("assets/fonts/Montserrat-Medium.ttf");

    // --- 2. LAYOUT CALCULATIONS ---
   /* const layoutInfo = useMemo(() => {
        const fov = 50; 
        const distToDepth = Math.abs(cameraZ - slateZ);
        const visibleWorldHeight = 2 * distToDepth * Math.tan((fov * Math.PI) / 360);
        const relativeY = textAnchorY - cameraY;
        
        // 1. Where the Title top is
        const titleTopPercent = 0.5 - (relativeY / visibleWorldHeight);
        
        // 2. How much space the Title occupies
        const titleHeightPercent = titleTextHeight / visibleWorldHeight;
        
        // 3. The Gap between bottom of Title and top of Card
        const gapPadding = LAYOUT.S2_BODY_CARD.GAP_FROM_TITLE_BOTTOM;
        
        // FINAL SUM: Starting point of the Card
        const boxStartPercent = titleTopPercent + titleHeightPercent + gapPadding;

        return { boxStartPercent };
    }, [textAnchorY, cameraY, cameraZ, slateZ, titleTextHeight]); */

    const { width: vid_width, height: vid_height } = useVideoConfig();

    const dynamicStyles = useMemo(() => {
        // 1. Define the "Hard Stop" at 85% of video height
        const CharWidthFactor=0.55;
        const CharHeightFactor=1.6;
        const safetyBottomPx = vid_height * 0.9;
        const boxStartPx = (boxStartPercent) * vid_height;
        
        // 2. Available height for the whole card (including padding)
        const availableHeightPx = (safetyBottomPx - boxStartPx);
        
        // 3. Subtract padding from the budget for the text itself
        const paddingPx = vid_height * LAYOUT.S2_BODY_CARD.PADDING_VH;
        const textBudgetPx = availableHeightPx - (paddingPx * 2);

        // 4. Font Scaling Logic
        const baseFontSizePx = vid_height * LAYOUT.S2_FONT_SIZE_VH;
        const bodyText = scenario.content.fact_body_html;
        
        // Estimation: Montserrat Medium is approx. 0.55 width-to-height ratio
        const cardWidthPx = vid_width * LAYOUT.S2_BODY_CARD.WIDTH_VW;
        const charPerLine = (cardWidthPx - (paddingPx * 2)) / (baseFontSizePx * CharWidthFactor);
        const estimatedLines = Math.ceil(bodyText.length / charPerLine);
        
        // Line height is 1.5x font size
        const estimatedTextHeight = estimatedLines * (baseFontSizePx * 1.0);

        let finalFontSizePx = baseFontSizePx;
        if (estimatedTextHeight > textBudgetPx) {
            // Shrink factor with a 10% safety margin
            //finalFontSizePx = baseFontSizePx * (textBudgetPx / estimatedTextHeight) * CharHeightFactor;
            finalFontSizePx=Math.sqrt(Math.abs(textBudgetPx*(cardWidthPx - (paddingPx * 2))/(bodyText.length*CharWidthFactor*CharHeightFactor)));
        }
        

        return {
            boxStartPx,
            availableHeightPx,
            finalFontSizePx,
            cardWidthPx,
            paddingPx
        };
    }, [vid_height, vid_width, boxStartPercent, scenario.content.fact_body_html]);

    // --- 3. TIMING & ANIMATION ---
    const detailsStartFrame = scenario.timings.t_details * fps;
    const localFrame = frame - detailsStartFrame;
    

    // A. Glass Card "Unfurl" (Expands vertically)
    const cardExpansion = spring({
        frame: localFrame,
        fps,
        config: { damping: 20, stiffness: 100 }
    });

    // B. Text Decode Progress
    const decodeStartDelay = TIMING.S2_DECODE_START_DELAY;
    const decodeDuration = TIMING.S2_DECODE_FRAMES;

    const decodeProgress = interpolate(
        localFrame - decodeStartDelay,
        [0, decodeDuration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' ,easing: (t) => t}
    );

    // C. Content
    const displayText = useMemo(() => {
        return getScrambledText(scenario.content.fact_body_html, decodeProgress, frame, theme);
    }, [scenario.content.fact_body_html, decodeProgress, frame]);
    
    // --- 4. STYLE HELPERS ---
    // Extract hex color and add alpha for the border (20% opacity)
    const borderColor = `${theme.accent_primary}33`; 
    //const { width: vid_width } = useVideoConfig(); // Get actual pixel width (e.g., 1080)
    
    // Calculate actual pixel width for the card
    // If WIDTH_VW is 0.9, this becomes 972px
    const cardPixelWidth = vid_width * LAYOUT.S2_BODY_CARD.WIDTH_VW;

    // 1. ENTRY ANIMATIONS
    // Slide up and Fade in
    const entrance = spring({ 
        frame: frame, 
        fps, 
        config: { damping: 12, stiffness: 100 } 
    });

    const slideUp = interpolate(entrance, [0, 1], [3, 0]); // Moves up by 3vh
    const blurIn = interpolate(entrance, [0, 1], [10, 0]); // Blurs in from 10px

    // 1. Calculate the core exit frames
    const audioEndFrame = (scenario.timings.t_details + scenario.timings.detailsAudioDuration) * fps;
    const exitStartFrame = audioEndFrame + (TIMING.S2_HANG_DURATION * fps);
    const exitEndFrame = exitStartFrame + (TIMING.S2_EXIT_DURATION * fps);

    // 2. Create the Exit Progress (0 to 1)
    const exitActive = interpolate(
        frame,
        [exitStartFrame, exitEndFrame],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );



    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <style>
                {`
                    @font-face {
                        font-family: 'MontserratCustom';
                        src: url('${fontUrl}') format('truetype');
                        font-weight: 500;
                        font-style: normal;
                    }
                `}
            </style> 
            
    <div style={{
                position: 'absolute',
                // Check if this calculation feels right. 
                // If it's too high, add + 0.05 to boxStartPercent here to test.
                top: `${(boxStartPercent) * 100}%`,
                left: '50%',
                transform: `translateX(-50%) translateY(${exitActive * 40}px)`,
                
                // FIXED: Use the nested constant structure
                width: `${dynamicStyles.cardWidthPx}px`,
                maxHeight: `${dynamicStyles.availableHeightPx}px`,
                padding: `${dynamicStyles.paddingPx}px`,
                //background: theme.container_bg,
                background:`linear-gradient(135deg, rgba(10, 10, 20, 0.85) 0%, theme.container_bg 100%)`,
                border: `1px solid ${borderColor}`,
                color: theme.text_3d_face, 
                backdropFilter: 'blur(12px) saturate(180%)',
                borderRadius: '1.5vh',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
                fontFamily: "'MontserratCustom', sans-serif",
                fontSize: `${dynamicStyles.finalFontSizePx}px`,
                lineHeight: '1.5',
                // Add this to prevent words from "jittering"
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                textAlign: 'center',
                boxSizing: 'border-box',

                clipPath: `inset(0% 0% ${interpolate(exitActive, [0, 1], [interpolate(cardExpansion, [0, 1], [100, 0]), 100])}% 0%)`,
                opacity: interpolate(localFrame, [0, 5], [0, 1]) * (1 - exitActive),
                filter: `blur(${blurIn}px)`,
            }}>
                {/* Accent Corner Decor */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${dynamicStyles.cardWidthPx}px`,
                    height: '2px',
                    background: theme.accent_primary,
                    boxShadow: `0 0 10px ${theme.accent_primary}`
                }} />
                <div style={{ 
                        letterSpacing: '-0.02em'
                    }}
                    dangerouslySetInnerHTML={{ __html: displayText }} />
            </div>
        </AbsoluteFill>
    );
};