import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig, interpolate, Easing, staticFile } from 'remotion'; // <-- FIX 1: Import staticFile
import { Text } from '@react-three/drei';

interface CTAPillProps {
    ctaSocial: string;
    ctaLink: string;
    width: number;
    height: number;
    finalY: number;
    startTime: number; // t_cta_start + 0.8s
    fps: number;
    fontUrl: string; // <-- FIX 2: Add fontUrl prop
}

export const CTAPill: React.FC<CTAPillProps> = ({
    ctaSocial,
    ctaLink,
    width,
    height,
    finalY,
    startTime,
    fps,
    fontUrl, // <-- Use the passed prop
}) => {
    const frame = useCurrentFrame();
    const textGroupRef = useRef<THREE.Group>(null!); // <-- FIX 3: Change type from Mesh to Group
    const pillMeshRef = useRef<THREE.Mesh>(null!);
    
    // Explicit Timing (in seconds)
    const T_REVEAL = startTime; // 0.8s
    const T_SOCIAL_END = T_REVEAL + 2.0; // 1.8s
    const T_WIPE_DOWN_SOCIAL_START = T_SOCIAL_END; // 1.8s
    const T_WIPE_DOWN_SOCIAL_END = T_WIPE_DOWN_SOCIAL_START + 0.5; // 2.3s
    const T_WIPE_DOWN_LINK_START = T_WIPE_DOWN_SOCIAL_END; // 2.3s
    const T_WIPE_DOWN_LINK_END = T_WIPE_DOWN_LINK_START + 0.5; // 2.8s

    // Explicit Timing (in frames)
    const REVEAL_FRAME = Math.round(T_REVEAL * fps);
    const SOCIAL_WIPE_START_FRAME = Math.round(T_WIPE_DOWN_SOCIAL_START * fps);
    const SOCIAL_WIPE_END_FRAME = Math.round(T_WIPE_DOWN_SOCIAL_END * fps);
    const LINK_WIPE_START_FRAME = Math.round(T_WIPE_DOWN_LINK_START * fps);
    const LINK_WIPE_END_FRAME = Math.round(T_WIPE_DOWN_LINK_END * fps);

    // Layout Constraints
    const PILL_PADDING_X = width * 0.05; // 5% padding on x-axis
    const height1 = height  *1.5; // 5% padding on x-axis
    const TEXT_WIDTH = width - 2 * PILL_PADDING_X;
    const FONT_SIZE = height * 0.4; // 50% of Pill Container Height

    // Glassmorphic Material
    const pillMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
        roughness: 0.1,
        metalness: 0.5,
        clearcoat: 1,
        clearcoatRoughness: 0,
    }), []);
    
    // Glass Pill Geometry (rounded rectangle)
    const pillGeometry = useMemo(() => {
        const shape = new THREE.Shape();
        const radius = height1 / 2;
        shape.moveTo(-width / 2 + radius, -height1 / 2);
        shape.lineTo(width / 2 - radius, -height1 / 2);
        shape.absarc(width / 2 - radius, 0, radius, -Math.PI / 2, Math.PI / 2, false);
        shape.lineTo(-width / 2 + radius, height1/ 2);
        shape.absarc(-width / 2 + radius, 0, radius, Math.PI / 2, 3 * Math.PI / 2, false);
        
        const extrudeSettings = { depth: 0.01, bevelEnabled: false };
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, [width, height]);


    useFrame(() => {
        if (!pillMeshRef.current || !textGroupRef.current) return;

        // 1. Instant Appearance
        const pillVisibility = frame >= REVEAL_FRAME ? 1 : 0;
        pillMeshRef.current.visible = pillVisibility > 0;

        // 2. TEXT WIPING LOGIC
        
        let currentText = ctaSocial;
        let wipeProgress = 0;

        if (frame < SOCIAL_WIPE_START_FRAME) {
            // Phase 1: Social Display (Fully Visible)
            wipeProgress = 0;
            currentText = ctaSocial;
        } else if (frame >= SOCIAL_WIPE_START_FRAME && frame < SOCIAL_WIPE_END_FRAME) {
            // Phase 2: Wipe Down Social (Hide)
            const progress = interpolate(frame, [SOCIAL_WIPE_START_FRAME, SOCIAL_WIPE_END_FRAME], [0, 1], { easing: Easing.inOut(Easing.quad) });
            wipeProgress = progress; // 0 (Visible) -> 1 (Hidden)
            currentText = ctaSocial;
        } else if (frame >= LINK_WIPE_START_FRAME && frame < LINK_WIPE_END_FRAME) {
            // Phase 3: Wipe Down Link (Reveal)
            const progress = interpolate(frame, [LINK_WIPE_START_FRAME, LINK_WIPE_END_FRAME], [0, 1], { easing: Easing.inOut(Easing.quad) });
            wipeProgress =  progress; // 1 (Hidden) -> 0 (Visible)
            currentText = ctaLink;
        } else if (frame >= LINK_WIPE_END_FRAME) {
            // Phase 4: Link Display (Fully Visible)
            wipeProgress = 0;
            currentText = ctaLink;
        }
        
        // --- SIMPLIFIED WIPE DOWN ANIMATION USING SCALE AND POSITION ---
        
        let scaleY = 1;
        let positionYOffset = 0; 
        
        // Determine the text to display (updates the <Text> children prop)
        if (frame < LINK_WIPE_START_FRAME) {
            textGroupRef.current.children[0].userData.currentText = ctaSocial.toUpperCase();
        } else {
            textGroupRef.current.children[0].userData.currentText = ctaLink.toUpperCase();
        }


        if (frame < LINK_WIPE_START_FRAME) { // Social phase (disappearing wipe down)
            // Scale from 1 to 0 (Wipe down to bottom edge)
            scaleY = interpolate(wipeProgress, [0, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            // Position offset to make the scale happen from the bottom edge
            positionYOffset = interpolate(wipeProgress, [0, 1], [0, -height/2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        } else { // Link phase (appearing wipe down)
            const linkWipeProgress = interpolate(
                frame, 
                [LINK_WIPE_START_FRAME, LINK_WIPE_END_FRAME], 
                [0, 1], 
                // CRITICAL FIX: Clamping progress to 1 ensures text remains fully scaled/positioned
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) } 
            );
            
            // Wipe Down to Reveal (Scale 0 to 1)
            scaleY = linkWipeProgress;
            
            // Position offset ensuring pivot from top (height/2 -> 0)
            positionYOffset = height/2 - (height/2) * scaleY;
        }
        
        textGroupRef.current.scale.y = scaleY;
        textGroupRef.current.position.y = positionYOffset;
    });

    if (frame < REVEAL_FRAME) {
        return null;
    }

    return (
        <group position={[0, finalY+height-height1, 0.05]}>
            {/* The Glass Pill Background */}
            <mesh ref={pillMeshRef} geometry={pillGeometry} material={pillMaterial} />

            {/* The BOLD, Centered Text Group - Apply wipe animation transforms here */}
            <group ref={textGroupRef}>
                <Text
                    position={[0, 0, 0.02]} // Slightly in front of the pill
                    fontSize={FONT_SIZE}
                    color="#ffffff"
                    maxWidth={TEXT_WIDTH}
                    lineHeight={1.2}
                    textAlign="center"
                    anchorX="center"
                    anchorY="middle" // Vertical centering
                    font={staticFile(fontUrl)} // <-- FIX 4: Use staticFile and prop
                    fontWeight="bold"
                    // Use a functional approach or state management if children rerender is slow.
                    // For now, rely on useFrame logic to implicitly update the text based on current state.
                    children={frame < LINK_WIPE_START_FRAME ? ctaSocial.toUpperCase() : ctaLink.toUpperCase()} 
                />
            </group>
        </group>
    );
};