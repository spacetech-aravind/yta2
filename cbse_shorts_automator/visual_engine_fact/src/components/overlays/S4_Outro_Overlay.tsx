import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, staticFile } from 'remotion';
import { FactScenario } from '../../types/schema';
import { Theme } from '../../theme/palettes';

export const S4_Outro_Overlay: React.FC<{ 
    scenario: FactScenario; 
    theme: Theme; 
}> = ({ scenario, theme }) => {
    const frame = useCurrentFrame();
    const { fps, height: vid_height } = useVideoConfig();
    
    // Local frame starts at 0 when the outro begins
    const localFrame = frame - (scenario.timings.t_outro * fps);

    // --- 🎬 ANIMATIONS ---
    const pulse = interpolate(Math.sin(localFrame * 0.1), [-1, 1], [1, 1.04]);

    const getEntry = (delayS: number) => spring({
        frame: localFrame - (delayS * fps),
        fps,
        config: { damping: 14, stiffness: 100 }
    });

    const logoEnt = getEntry(0.1);
    const usp1Ent = getEntry(0.6);
    const usp2Ent = getEntry(1.0);
    const copyEnt = getEntry(1.6);

    return (
        <AbsoluteFill style={{ 
            backgroundColor: '#FFFFFF', // ⚡ REQUIRED WHITE BACKGROUND
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'MontserratBold'
        }}>
            {/* --- LOGO --- */}
            <div style={{
                marginBottom: '6vh',
                transform: `scale(${logoEnt * pulse})`,
                opacity: logoEnt,
                textAlign: 'center'
            }}>
                <img 
                    src={staticFile(scenario.assets.logo_src)} 
                    style={{ 
                        height: vid_height * 0.16,
                        // Drop shadow adjusted for white background (subtle grey)
                        filter: `drop-shadow(0 10px 20px rgba(0,0,0,0.1))` 
                    }} 
                />
            </div>

            {/* --- CONTENT BLOCK --- */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5vh' }}>
                {/* USP LINE 1 - Uses theme accent */}
                <div style={{
                    opacity: usp1Ent,
                    transform: `translateY(${interpolate(usp1Ent, [0, 1], [20, 0])}px)`,
                    fontSize: vid_height * 0.038,
                    color: theme.outro_primary, 
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontWeight: 900
                }}>
                    {scenario.content.outro_content.usp_line_1}
                </div>

                {/* USP LINE 2 - Dark Grey for legibility on white */}
                <div style={{
                    opacity: usp2Ent,
                    transform: `translateY(${interpolate(usp2Ent, [0, 1], [15, 0])}px)`,
                    fontSize: vid_height * 0.028,
                    color: theme.text_body_light, 
                    fontWeight: 500
                }}>
                    {scenario.content.outro_content.usp_line_2}
                </div>

                {/* COPYRIGHT - Light Grey */}
                <div style={{
                    opacity: copyEnt,
                    marginTop: '5vh',
                    fontSize: vid_height * 0.016,
                    color: theme.text_muted,
                    letterSpacing: '1px'
                }}>
                    {scenario.content.copyright_text}
                </div>
            </div>
        </AbsoluteFill>
    );
};