import React, { useMemo, useEffect } from 'react';
import { RoundedBox, useVideoTexture, useTexture, Text } from '@react-three/drei';
import { staticFile, spring, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Theme } from '../../theme/palettes';
import { FactScenario } from '../../types/schema';
import { TIMING, LAYOUT } from '../../constants';
import * as THREE from 'three';

interface Props {
    scenario: FactScenario;
    theme: Theme;
    position: [number, number, number];
    isPlaying: boolean;
    slateWidth: number;
    clickFrame: number;
    tiltX: number;
    RotationY:number;
}

export const KnowledgeSlate: React.FC<Props> = ({ 
    scenario, 
    theme, 
    position, 
    isPlaying, 
    slateWidth,
    tiltX,
    RotationY, 
    clickFrame 
}) => {
    const { fps } = useVideoConfig();
    const height = slateWidth * 0.5625;
    const depth = height / 12;

    // --- 1. ASSETS & TEXTURES ---
    const texture = useVideoTexture(staticFile(scenario.assets.video_src), {
        muted: true,
        loop: false,
    });
    const backTexture = useTexture(staticFile(scenario.assets.thumb_src));

    // Video Sync Logic
    const videoFrame = Math.max(0, clickFrame - TIMING.S1_CLICK_DURATION_FRAMES);
    const videoTime = videoFrame / fps;
    const video = texture.image;

    useEffect(() => {
        if (video && isPlaying && video.readyState >= 2) {
            video.pause();
            video.currentTime = videoTime;
        }
    }, [video, isPlaying, videoTime]);

    // --- 2. ANIMATIONS ---
    const buttonSpring = spring({
        frame: clickFrame,
        fps,
        config: { stiffness: 200, damping: 10 },
    });

    const rippleScale = interpolate(clickFrame, [0, 15], [1, 2.5], { extrapolateRight: 'clamp' });
    const rippleOpacity = interpolate(clickFrame, [0, 15], [0.5, 0], { extrapolateRight: 'clamp' });

    
    // --- 3. UI DATA (Seeded for consistency) ---
    const { progressPercent, currentTimeStr } = useMemo(() => {
        // Use theme_seed to make the "random" progress bar consistent every render
        const seed = scenario.meta.theme_seed;
        const percent = 0.3 + (seed % 40) / 100; 
        const totalSeconds = 420; // 7 mins
        const currentSeconds = Math.floor(totalSeconds * percent);
        const mins = Math.floor(currentSeconds / 60);
        const secs = currentSeconds % 60;
        return {
            progressPercent: percent,
            currentTimeStr: `${mins}:${secs < 10 ? '0' : ''}${secs} / 7:00`
        };
    }, [scenario.meta.theme_seed]);

    const uiZOffset = depth / 2 + 0.01;
    const barWidth = slateWidth * 0.9;
    const barHeight = height * 0.018;

    return (
        <group position={position} rotation={[tiltX, RotationY, 0]}>
            {/* MAIN SLATE BODY */}
            <RoundedBox args={[slateWidth, height, depth]} radius={height / 18}>
                <meshStandardMaterial 
                    color={theme.accent_secondary} 
                    metalness={0.7} 
                    roughness={0.3} 
                />
            </RoundedBox>

            {/* FRONT SCREEN */}
            <mesh position={[0, 0, uiZOffset]}>
                <planeGeometry args={[slateWidth * 0.95, height * 0.9]} />
                <meshBasicMaterial map={texture} toneMapped={false} transparent />
            </mesh>

            {/* BACK SCREEN */}
            <mesh position={[0, 0, -uiZOffset]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[slateWidth * 0.96, height * 0.96]} />
                <meshBasicMaterial map={backTexture} toneMapped={false} />
            </mesh>

            {/* INTERACTION UI (Play Button) */}
            {(!isPlaying || clickFrame < 20) && (
                <group position={[0, 0, uiZOffset + 0.01]}>
                    {isPlaying && (
                        <mesh scale={[rippleScale, rippleScale, 1]}>
                            <circleGeometry args={[height * 0.15, 32]} />
                            <meshBasicMaterial color="white" transparent opacity={rippleOpacity} />
                        </mesh>
                    )}
                    <group scale={isPlaying ? 1 - (buttonSpring * 0.3) : 1}>
                        <mesh>
                            <circleGeometry args={[height * 0.15, 32]} />
                            <meshBasicMaterial color="black" transparent opacity={0.6} />
                        </mesh>
                        <Text fontSize={height * 0.12} color="white" position={[0, 0, 0.01]}>▶</Text>
                    </group>
                </group>
            )}

           {/* --- DIEGETIC YOUTUBE UI (CLEAN) --- */}
            <group position={[0, -height / 2 + height * 0.12, uiZOffset + 0.01]}>
                
                {/* 1. Progress Bar */}
                <group position={[0, height * 0.04, 0]}>
                    <mesh>
                        <planeGeometry args={[barWidth, barHeight]} />
                        <meshBasicMaterial color="white" transparent opacity={0.3} />
                    </mesh>
                    <mesh position={[-(barWidth / 2) + (barWidth * progressPercent) / 2, 0, 0.001]}>
                        <planeGeometry args={[barWidth * progressPercent, barHeight]} />
                        <meshBasicMaterial color="#FF0000" />
                    </mesh>
                </group>

                {/* 2. Controls Row */}
                <group position={[-barWidth / 2, -height * 0.02, 0]}>
                    {/* Play/Pause Icon */}
                    
                    <Text fontSize={height * 0.06} color="grey" anchorX="left" position={[0, 0, 0]}>
                        {isPlaying ? "⏸" : "▶"}
                    </Text>

                    {/* Next Icon */}
                    <Text fontSize={height * 0.05} color="grey" anchorX="left" position={[height * 0.1, 0, 0]}>
                        ⏭
                    </Text>

                    {/* Timestamp */}
                    <Text fontSize={height * 0.04} color="grey" anchorX="left" position={[height * 0.22, 0, 0]}>
                        {currentTimeStr}
                    </Text>

                    {/* Right Side Settings/Expand */}
                    <group position={[barWidth*.95, 0, 0]}>
                        <Text fontSize={height * 0.05} color="grey" anchorX="right">
                            ⚙️ □     
                        </Text>
                    </group>
                </group>
            </group>
        </group>
    );
};