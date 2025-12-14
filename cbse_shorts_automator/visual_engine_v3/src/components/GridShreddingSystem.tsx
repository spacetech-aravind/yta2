import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useVideoConfig, useCurrentFrame, interpolate, Easing } from 'remotion';
import { Color } from 'three';

// Props match the original component
interface GridShreddingSystemProps {
    startTime: number;
    cardCenterY: number;
    cardWidth: number;
    cardHeight: number;
    color: string;
    fps: number;
}

// Define the size of individual grid fragments
// Smaller = more particles, denser grid. Larger = fewer, blockier particles.
const GRID_FRAGMENT_SIZE = 0.08; 

export const GridShreddingSystem: React.FC<GridShreddingSystemProps> = ({
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

    // 1. Calculate Grid Dimensions
    // We ceil values to ensure the entire card area is covered, even if it doesn't divide perfectly.
    const cols = Math.ceil(cardWidth / GRID_FRAGMENT_SIZE);
    const rows = Math.ceil(cardHeight / GRID_FRAGMENT_SIZE);
    const particleCount = cols * rows;

    // Duration matches provided snippet
    const EXPLOSION_DURATION_SECONDS = 1.3;
    const EXPLOSION_START_FRAME = (startTime + 0.03) * fps;
    const EXPLOSION_END_FRAME = EXPLOSION_START_FRAME + EXPLOSION_DURATION_SECONDS * fps;

    // 2. Initialize Grid Positions and Radial Vectors
    const initialData = useMemo(() => {
        const data: { initialX: number; initialY: number; vectorX: number; vectorY: number; rotationAxis: THREE.Vector3, rotationSpeed: number }[] = [];
        
        // Calculate starting offsets so the grid is centered around (0,0)
        // R3F coordinate system: +Y is Up, +X is Right.
        // Start at Top-Left.
        const startX = -(cols * GRID_FRAGMENT_SIZE) / 2 + GRID_FRAGMENT_SIZE / 2;
        const startY = (rows * GRID_FRAGMENT_SIZE) / 2 - GRID_FRAGMENT_SIZE / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // A. Grid Position
                // Add slight random jitter to prevent perfectly straight grid lines during explosion
                const jitter = GRID_FRAGMENT_SIZE * 0.1; 
                const initialX = startX + c * GRID_FRAGMENT_SIZE + (Math.random() - 0.5) * jitter;
                const initialY = startY - r * GRID_FRAGMENT_SIZE + (Math.random() - 0.5) * jitter;

                // B. Radial Explosion Vector
                // Calculate angle from center (0,0) to the piece's position.
                // Pieces explode radially outwards.
                const angle = Math.atan2(initialY, initialX);
                
                // Speed variation adds realism
                const speedVariation = 0.8 + Math.random() * 0.6; 
                // Multiplier determines how far they fly. Adjusted relative to original code's behavior.
                const vectorMag = 0.5 * speedVariation; 

                const vectorX = Math.cos(angle) * vectorMag;
                const vectorY = Math.sin(angle) * vectorMag;

                // C. Rotation Physics
                // Random axis for 3D tumbling effect
                const rotationAxis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
                const rotationSpeed = Math.random() * Math.PI; // Radians per second of explosion

                data.push({ initialX, initialY, vectorX, vectorY, rotationAxis, rotationSpeed });
            }
        }
        return data;
    // Recalculate if dimensions change, ensuring grid always fits
    }, [cols, rows]);


    useFrame(() => {
        if (!meshRef.current) return;

        const currentFrame = frame;

        // Progress (0.0 to 1.0)
        const progress = interpolate(
            currentFrame,
            [EXPLOSION_START_FRAME, EXPLOSION_END_FRAME],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        // Easing for explosion speed (starts fast, slows down)
        const easedProgress = Easing.out(Easing.cubic)(progress);

        for (let i = 0; i < particleCount; i++) {
            const { initialX, initialY, vectorX, vectorY, rotationAxis, rotationSpeed } = initialData[i];

            // 1. Position Update: Initial Grid Pos + Vector * Eased Progress
            const x = initialX + vectorX * easedProgress;
            const y = initialY + vectorY * easedProgress;

            // 2. Rotation Update: Tumble around random axis based on progress
            tempObject.rotation.set(0,0,0); // Reset before applying axis rotation
            tempObject.rotateOnAxis(rotationAxis, rotationSpeed * easedProgress * 4); // * 4 for multiple spins

            // 3. Scale Update: Fade out at the very end
            const scale = interpolate(
                currentFrame,
                [EXPLOSION_END_FRAME - fps * 0.2, EXPLOSION_END_FRAME],
                [1, 0],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad) }
            );
            tempObject.scale.setScalar(scale);

            // 4. Set Final Matrix (Apply Card Center Y offset and slight Z shift)
            tempObject.position.set(x, y + cardCenterY, 0.02);
            tempObject.updateMatrix();
            meshRef.current.setMatrixAt(i, tempObject.matrix);
        }

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    if (frame < EXPLOSION_START_FRAME || frame > EXPLOSION_END_FRAME) {
        return null;
    }

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
            {/* Geometry matches the grid fragment size */}
            <planeGeometry args={[GRID_FRAGMENT_SIZE * 0.95, GRID_FRAGMENT_SIZE * 0.95]} />
            {/* Use double sided material so pieces don't disappear when tumbling */}
            <meshBasicMaterial color={tempColor} side={THREE.DoubleSide} />
        </instancedMesh>
    );
};