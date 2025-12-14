import React, { useRef, useMemo } from 'react';
import { useCurrentFrame, useVideoConfig, spring, staticFile } from 'remotion';
import { useFrame } from '@react-three/fiber';
import { Image, RoundedBox } from '@react-three/drei'; 
// FIX: Import Group from three
import { Group, Mesh } from 'three'; 

interface ThumbnailSlideProps {
    imageUrl: string;
    width: number;
    height: number;
    finalY: number;
    startTime: number; 
    fps: number;
}

export const ThumbnailSlide: React.FC<ThumbnailSlideProps> = ({
    imageUrl,
    width,
    height,
    finalY,
    startTime,
    fps,
}) => {
    const frame = useCurrentFrame();
    // FIX: Change the type from Mesh to Group, as the root element is a <group>
    const groupRef = useRef<Group>(null!); 

    // TIMING: t_cta_start + 0.2s to t_cta_start + 0.8s (Duration 0.6s)
    const SLIDE_START_FRAME = Math.round((startTime) * fps);
    const SLIDE_DURATION_FRAMES = Math.round(1.5 * fps);

    // Initial Y position: Far below the viewport (for slide up)
    const initialY = finalY + height * 2;

    useFrame(() => {
        if (!groupRef.current) return;

        const progress = spring({
            frame: frame - SLIDE_START_FRAME,
            fps: fps,
            config: {
                stiffness: 100, 
                damping: 30,
                mass: 2,
            },
            durationInFrames: SLIDE_DURATION_FRAMES,
        });

        const currentY = initialY + (finalY - initialY) * progress;
        
        // Use groupRef.current for position update
        groupRef.current.position.y = currentY; 
    });

    if (frame < SLIDE_START_FRAME) {
        return null;
    }

    return (
        // Apply the ref to the root <group>
        <group ref={groupRef} position={[0, initialY, 0]}>
            <RoundedBox
                args={[0, 0, 0]} 
                radius={0.05}
                smoothness={4}
            >
                <Image 
                    url={staticFile(imageUrl)}
                    scale={[width, height]}
                    position={[0, 0, 0.2]} 
                    transparent={false}
                    radius={0.1}
                />
                
                <meshBasicMaterial attach="material-0" color="white" /> 
            </RoundedBox>
        </group>
    );
};