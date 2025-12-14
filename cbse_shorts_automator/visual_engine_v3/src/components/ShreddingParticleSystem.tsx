import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
// FIX: Add useFrame to this import line
import { useFrame } from '@react-three/fiber'; 
import { useVideoConfig, useCurrentFrame, interpolate, spring, Easing } from 'remotion'; 
import { Color } from 'three';

// Props for the Shredding effect
interface ShreddingParticleSystemProps {
    startTime: number; // t_cta_start
    cardCenterY: number;
    cardWidth: number;
    cardHeight: number;
    color: string;
    fps: number;
}

const particleCount = 100;
const fragmentSize = 0.05;

export const ShreddingParticleSystem: React.FC<ShreddingParticleSystemProps> = ({
    startTime,
    cardCenterY,
    cardWidth,
    cardHeight,
    color,
    fps,
}) => {
    const frame = useCurrentFrame();
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const tempObject = useMemo(() => new THREE.Object3D(), []);
    const tempColor = useMemo(() => new Color(color), [color]);

    // Duration of the explosion phase: 0.3s
    const EXPLOSION_DURATION_SECONDS = 1.3;
    const EXPLOSION_START_FRAME = startTime * fps;
    const EXPLOSION_END_FRAME = EXPLOSION_START_FRAME + EXPLOSION_DURATION_SECONDS * fps;

    // Memoize initial random positions and explosion vectors for consistency
    const initialPositions = useMemo(() => {
        const positions: { initialX: number; initialY: number; vectorX: number; vectorY: number; rotationZ: number }[] = [];
        for (let i = 0; i < particleCount; i++) {
            // Initial position is randomly within the card bounds
            const initialX = (Math.random() - 0.5) * cardWidth;
            const initialY = (Math.random() - 0.5) * cardHeight *0.5;

            // Explosion vector: Simple radial outward push (normalized)
            const angle = Math.random() * Math.PI * 2;
            const vectorX =  Math.cos(angle) * (1 + Math.random() * 0.5); // Spread factor
            const vectorY =  Math.sin(angle) * (1 + Math.random() * 0.5);

            const rotationZ = Math.random() * Math.PI * 2;

            positions.push({ initialX, initialY, vectorX, vectorY, rotationZ });
        }
        return positions;
    }, [cardWidth, cardHeight]);


    useFrame(() => {
        if (!meshRef.current) return;

        const currentFrame = frame;

        // Progress of the explosion (0.0 to 1.0)
        const progress = interpolate(
            currentFrame,
            [EXPLOSION_START_FRAME, EXPLOSION_END_FRAME],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Apply a sharp ease-out curve for the explosion speed
        const easedProgress = Easing.out(Easing.quad)(progress);

        for (let i = 0; i < particleCount; i++) {
            const { initialX, initialY, vectorX, vectorY, rotationZ } = initialPositions[i];

            // 1. Position: Initial position + Eased explosion vector
            const x = initialX + vectorX * easedProgress * .2; // Spread distance
            const y = initialY + vectorY * easedProgress * .2;

            // 2. Rotation: Constant rotation plus progressive twist
            tempObject.rotation.z = rotationZ + easedProgress * Math.PI * 4;

            // 3. Scale: Scale down to 0 quickly after peak spread
            const scale = interpolate(
                currentFrame,
                [EXPLOSION_END_FRAME - fps * 0.1, EXPLOSION_END_FRAME], // Fade out in the last 0.1s
                [1, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            tempObject.scale.setScalar(scale);

            // Set final world position (add card center Y)
            tempObject.position.set(x, y + cardCenterY, 0.01);

            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    // Only render the component during the explosion timeline
    if (frame < EXPLOSION_START_FRAME || frame > EXPLOSION_END_FRAME) {
        return null;
    }

    // A single, instanced square geometry for performance
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
            <planeGeometry args={[fragmentSize, fragmentSize]} />
            <meshBasicMaterial color={tempColor} />
        </instancedMesh>
    );
};