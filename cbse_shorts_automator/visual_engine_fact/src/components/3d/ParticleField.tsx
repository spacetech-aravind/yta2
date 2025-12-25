import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';

export const ParticleField: React.FC<{ color: string; count: number }> = ({ color, count }) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    
    // Remotion Sync
    const frame = useCurrentFrame(); 
    const { fps } = useVideoConfig();

    // 1. CONFIG
    const DEPTH_RANGE = 15.0; 
    const WIDTH_RANGE = 2.5;  
    const HEIGHT_RANGE = 4.0;  

    // 2. GENERATE PARTICLES
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            // Base positions
            xBase: (Math.random() - 0.5) * WIDTH_RANGE, 
            yBase: (Math.random() - 0.5) * HEIGHT_RANGE,
            
            zStart: Math.random(), 
            
            speed: Math.random() * 0.05 + 0.05, 
            scale: Math.random() * 0.5 + 0.5,

            // Drift Parameters for X/Y movement
            driftSpeed: Math.random() * 0.2 + 0.1, 
            driftAmp: Math.random() * 0.2 + 0.1,   
            phase: Math.random() * Math.PI * 2     
        }));
    }, [count]);

    useFrame((state) => {
        if (!mesh.current) return;
        
        const cam = state.camera;
        const time = frame / fps; 

        particles.forEach((p, i) => {
            // 3. MOVEMENT LOGIC
            
            // Z Axis (Forward Flow)
            const progress = (p.zStart + (time * 0.2 * p.speed)) % 1.0;
            const zLocal = -((1.0 - progress) * DEPTH_RANGE + 1.0);

            // X & Y Axis (Drifting Movement)
            const xLocal = p.xBase + Math.sin(time * p.driftSpeed + p.phase) * p.driftAmp;
            const yLocal = p.yBase + Math.cos(time * p.driftSpeed + p.phase) * p.driftAmp;

            // 4. POSITION
            const localPos = new THREE.Vector3(xLocal, yLocal, zLocal);
            localPos.applyMatrix4(cam.matrixWorld); 

            dummy.position.copy(localPos);
            
            // Rotation
            dummy.rotation.x = time * 2.0;
            dummy.rotation.z = time;

            dummy.scale.setScalar(p.scale);
            dummy.updateMatrix();
            
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh 
            ref={mesh} 
            args={[undefined, undefined, count]} 
            frustumCulled={false} 
        >
            {/* BASE SIZE: 0.01 */}
            <dodecahedronGeometry args={[0.01, 0]} /> 
            
            {/* THEME COLOR RESTORED */}
            <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.8} // Lower opacity for better blending
                side={THREE.DoubleSide}
            />
        </instancedMesh>
    );
};