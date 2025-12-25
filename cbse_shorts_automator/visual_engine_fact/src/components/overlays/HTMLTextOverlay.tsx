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
const getScrambledText = (htmlContent: string, progress: number, frame: number, theme: Theme) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    const plainText = htmlContent.replace(/<[^>]*>/g, '');
    const totalChars = plainText.length;
    const revealedCount = Math.floor(progress * totalChars);

    let globalCharIndex = 0;
    const tokens = htmlContent.split(/(<[^>]*>)/g).filter(Boolean);

    return tokens.map((token) => {
        if (token.startsWith('<')) return token; 

        return token.split('').map((char) => {
            const i = globalCharIndex++;
            
            if (i < revealedCount) {
                return char; 
            }
            if (i < revealedCount + 3) {
                const randomChar = chars[(i + frame) % chars.length];
                // KEYWORD HIGHLIGHT: Uses the Neon Theme Color
                return `<span style="color: ${theme.accent_primary}; text-shadow: 0 0 5px ${theme.accent_primary}88;">${randomChar}</span>`;
            }
            return `<span style="visibility: hidden">${char}</span>`;
        }).join('');
    }).join('');
};

export const HTMLTextOverlay: React.FC<HTMLTextOverlayProps> = ({ 
    scenario, 
    theme, 
    boxStartPercent
}) => {
    const frame = useCurrentFrame();
    const { fps, width: vid_width, height: vid_height } = useVideoConfig();
    
    // --- 1. LOCAL FONT REGISTRATION ---
    const fontUrl = staticFile("assets/fonts/Montserrat-Medium.ttf");

    // --- 2. LAYOUT CALCULATIONS ---
    const dynamicStyles = useMemo(() => {
        const CharWidthFactor = 0.55;
        const CharHeightFactor = 1.6;
        const safetyBottomPx = vid_height * 0.9;
        const boxStartPx = (boxStartPercent) * vid_height;
        
        const availableHeightPx = (safetyBottomPx - boxStartPx);
        const paddingPx = vid_height * LAYOUT.S2_BODY_CARD.PADDING_VH;
        const textBudgetPx = availableHeightPx - (paddingPx * 2);

        const baseFontSizePx = vid_height * LAYOUT.S2_FONT_SIZE_VH;
        const bodyText = scenario.content.fact_body_html;
        
        const cardWidthPx = vid_width * LAYOUT.S2_BODY_CARD.WIDTH_VW;
        const charPerLine = (cardWidthPx - (paddingPx * 2)) / (baseFontSizePx * CharWidthFactor);
        const estimatedLines = Math.ceil(bodyText.length / charPerLine);
        const estimatedTextHeight = estimatedLines * (baseFontSizePx * 1.0);

        let finalFontSizePx = baseFontSizePx;
        if (estimatedTextHeight > textBudgetPx) {
            finalFontSizePx = Math.sqrt(Math.abs(textBudgetPx * (cardWidthPx - (paddingPx * 2)) / (bodyText.length * CharWidthFactor * CharHeightFactor)));
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

    const cardExpansion = spring({
        frame: localFrame,
        fps,
        config: { damping: 20, stiffness: 100 }
    });

    const decodeStartDelay = TIMING.S2_DECODE_START_DELAY;
    const decodeDuration = TIMING.S2_DECODE_FRAMES;

    const decodeProgress = interpolate(
        localFrame - decodeStartDelay,
        [0, decodeDuration],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => t }
    );

    const displayText = useMemo(() => {
        return getScrambledText(scenario.content.fact_body_html, decodeProgress, frame, theme);
    }, [scenario.content.fact_body_html, decodeProgress, frame, theme]);
    
    // --- 4. STYLE HELPERS ---
    
    // BORDER: 40% Opacity Neon (Subtle Glow)
    // We assume theme.accent_primary is HSL or Hex. 
    // Since we don't have a color manipulator, we use CSS variables or a solid fallback.
    // Ideally, we'd use `rgba` but for now, we'll use a solid color with box-shadow for the glow.
    
    const entrance = spring({ 
        frame: frame, 
        fps, 
        config: { damping: 12, stiffness: 100 } 
    });

    const slideUp = interpolate(entrance, [0, 1], [3, 0]); 
    const blurIn = interpolate(entrance, [0, 1], [10, 0]); 

    // Exit Logic
    const audioEndFrame = (scenario.timings.t_details + scenario.timings.detailsAudioDuration) * fps;
    const exitStartFrame = audioEndFrame + (TIMING.S2_HANG_DURATION * fps);
    const exitEndFrame = exitStartFrame + (TIMING.S2_EXIT_DURATION * fps);

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
                top: `${(boxStartPercent) * 100}%`,
                left: '50%',
                transform: `translateX(-50%) translateY(${exitActive * 40}px)`,
                
                width: `${dynamicStyles.cardWidthPx}px`,
                maxHeight: `${dynamicStyles.availableHeightPx}px`,
                padding: `${dynamicStyles.paddingPx}px`,

                // --- FROSTED GLASS STRATEGY ---
                // 1. Background: Dark Tint (70% Black) + Slight Theme Tint
                // Note: We use a hardcoded dark RGBA because 'theme.bg_gradient_inner' is a string we can't easily alpha-blend in pure CSS without a helper.
                // This dark layer ensures text pop.
                background: `linear-gradient(135deg, rgba(5, 5, 10, 0.70) 0%, rgba(20, 20, 25, 0.60) 100%)`,
                
                // 2. Border: Theme Color (Neon)
                border: `1px solid ${theme.accent_primary}`, 
                
                // 3. Text Color: Silver (Defined in Palette)
                color: theme.text_body_dark, 
                
                // 4. Physics: Blur the world behind it
                backdropFilter: 'blur(20px) saturate(180%)',
                
                borderRadius: '3.5vh',
                
                // 5. Shadow: Lift it off the background
                boxShadow: `0 10px 40px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255,255,255,0.05)`,
                
                fontFamily: "'MontserratCustom', sans-serif",
                fontSize: `${dynamicStyles.finalFontSizePx}px`,
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                textAlign: 'center',
                boxSizing: 'border-box',

                clipPath: `inset(0% 0% ${interpolate(exitActive, [0, 1], [interpolate(cardExpansion, [0, 1], [100, 0]), 100])}% 0%)`,
                opacity: interpolate(localFrame, [0, 5], [0, 1]) * (1 - exitActive),
                filter: `blur(${blurIn}px)`,
            }}>
                {/* Neon Top Edge Light */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '1px',
                    background: theme.accent_primary,
                    boxShadow: `0 0 15px ${theme.accent_primary}` // Glow
                }} />
                
                <div style={{ letterSpacing: '-0.02em' }}
                    dangerouslySetInnerHTML={{ __html: displayText }} />
            </div>
        </AbsoluteFill>
    );
};