import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from 'remotion';
import { FactScenario } from '../../types/schema';
import { Theme } from '../../theme/palettes';
import { S3_CTA_CONFIG } from '../../constants';

export const S3_CTA_Overlay: React.FC<{ 
    scenario: FactScenario; 
    theme: Theme; 
    tCtaFrame: number 
}> = ({ scenario, theme, tCtaFrame }) => {
    const frame = useCurrentFrame();
    const { fps, height: vid_height, width: vid_width } = useVideoConfig();
    
    // --- 🎛️ INDEPENDENT CONTROL PANEL ---
    const CONFIG = {
        // Layout
        SOCIAL_TOP: '15%',          // Y-Position of Social Pill
        LINK_BOTTOM: '15%',         // Y-Position of Link Card
        LINK_WIDTH_VW: 0.85,        // Width of Link Card (85% of screen)
        
        // Font Sizes (Responsive but independent)
        SOCIAL_FONT_SIZE: vid_height * 0.055,
        LINK_FONT_SIZE: vid_height * 0.0352,
        
        // TIMING LOGIC
        // The landing duration of the slate from your constants
        SLATE_SETTLE_S: S3_CTA_CONFIG.SLATE_DROP_DURATION, 
        // Additional pause after settling before the pill pops
        POST_SETTLE_PAUSE_S: 0.2, 
        
        // Link Card delay (Relative to the social pill's appearance)
        LINK_DELAY_AFTER_SOCIAL_S: 0.8,   
    
    };

    // --- 🖋️ FONT URL LOGIC ---
    const fontCSS = `
        @font-face { font-family: 'MontserratPill'; src: url(${staticFile('assets/fonts/Montserrat-Bold.ttf')}); }
        @font-face { font-family: 'PulpFiction'; src: url(${staticFile('assets/fonts/Pulp-Bold.ttf')}); }
    `;
const localFrame = frame - tCtaFrame;
    const tOutroFrame = scenario.timings.t_outro * fps;

    // --- 🎭 CALCULATED START TIMES ---
    // Start after slate settles + small pause
    const socialStartFrame = (CONFIG.SLATE_SETTLE_S + CONFIG.POST_SETTLE_PAUSE_S) * fps;
    
    // Start the link card after the social pill is established
    const linkStartFrame = socialStartFrame + (CONFIG.LINK_DELAY_AFTER_SOCIAL_S * fps);

    // --- 🎭 ANIMATION SPRINGS ---
    const socialSpring = spring({ 
        frame: localFrame - socialStartFrame, 
        fps, 
        config: { damping: 12, stiffness: 100 } 
    });

    const linkSpring = spring({ 
        frame: localFrame - linkStartFrame, 
        fps, 
        config: { mass: 1.5, stiffness: 140 } 
    });

    const whiteOutOpacity = interpolate(
        frame,
        [tOutroFrame - 15, tOutroFrame],
        [0, 1],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    return (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
            <style>{fontCSS}</style>
            
           {/* 1. SOCIAL PILL (The Pill Layout) */}
           {/* 1. SOCIAL CTA BAR (Wide Header Style) */}
            <div style={{
                position: 'absolute',
                top: CONFIG.SOCIAL_TOP,
                left: '50%',
                transform: `translateX(-50%) scale(${socialSpring})`,
                opacity: socialSpring * (1 - whiteOutOpacity),
                
                // 1. WIDTH & BOX MODEL
                width: '92%',               // Use more screen real estate
                maxWidth: '1200px',         // Cap for very wide screens
                boxSizing: 'border-box',
                
                // 2. VISUALS (Independent Glass)
                background: theme.surface_pill_bg, // Slightly darker for better legibility
                backdropFilter: 'blur(14px)',
                border: `1px solid rgba(255,255,255,0.2)`,
                borderRadius: '20px',       // Softened rectangle instead of pill
                padding: '2vh 3vh',
                
                // 3. LAYOUT
                display: 'flex',
                alignItems: 'center', 
                justifyContent: 'center',
                fontFamily: 'MontserratPill',
                boxShadow: `0 8px 32px rgba(0,0,0,0.3), 0 0 20px ${theme.surface_pill_bg}66`,
            }}>
                <span style={{ 
                    color: theme.text_on_pill, 
                    fontWeight: 800,        // Extra bold for the call to action
                    fontSize: vid_height * 0.032, // Adjusted for longer strings
                    lineHeight: 1.1,
                    textAlign: 'center',
                    textTransform: 'uppercase', // Matches your string style
                    letterSpacing: '0.5px',
                    
                    // 4. WRAP LOGIC
                    flex: 1,
                    whiteSpace: 'normal',
                    wordBreak: 'keep-all',   // Don't break words mid-letter
                    overflowWrap: 'break-word'
                }}>
                    {scenario.content.cta_content.social_text}
                </span>
            </div>

            {/* 2. LINK CTA (The Pulp Fiction Card) */}
            <div style={{
                position: 'absolute',
                bottom: CONFIG.LINK_BOTTOM,
                left: '50%',
                // Independent Slap-in animation
                transform: `translateX(-50%) rotate(${interpolate(linkSpring, [0, 1], [15, -1])}deg) scale(${linkSpring})`,
                opacity: linkSpring * (1 - whiteOutOpacity),
                
                // Visuals
                backgroundColor: '#FFE119', 
                border: '5px solid black',
                padding: '2.5vh',
                width: `${vid_width * CONFIG.LINK_WIDTH_VW}px`,
                boxShadow: '15px 15px 0px black',
                textAlign: 'center'
            }}>
                <div style={{ borderTop: '3px solid black', borderBottom: '3px solid black', padding: '1vh 0' }}>
                    <div style={{
                        color: 'black',
                        fontFamily: 'PulpFiction',
                        fontSize: CONFIG.LINK_FONT_SIZE,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        lineHeight: 1,
                        letterSpacing: '-1px'
                    }}>
                        {scenario.content.cta_content.link_text}
                    </div>
                </div>
                {/* Independent Bouncing Icon */}
                <div style={{ fontSize: '5vh', marginTop: '1vh', transform: `translateY(${Math.sin(frame * 0.3) * 6}px)` }}>
                    👇
                </div>
            </div>

            {/* EXIT WHITE-OUT */}
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'white', opacity: whiteOutOpacity, zIndex: 100 }} />
        </AbsoluteFill>
    );
};