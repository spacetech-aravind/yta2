import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ParticleField: React.FC<{ color: string; count: number }> = ({ color, count }) => {
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Generate random positions in a tunnel volume
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            x: (Math.random() - 0.5) * 20, // Wide spread X
            y: (Math.random() - 0.5) * 20, // Wide spread Y
            z: (Math.random() - 0.5) * 60 - 20, // Deep spread Z (mostly in front of camera)
            scale: Math.random() * 0.05 + 0.02,
            speed: Math.random() * 0.05 + 0.01
        }));
    }, [count]);

    useFrame((state) => {
        if (!mesh.current) return;
        
        // Slow "Drift" animation
        const t = state.clock.getElapsedTime();
        
        particles.forEach((p, i) => {
            // Subtle floating movement
            const yOffset = Math.sin(t * p.speed + i) * 0.2;
            
            dummy.position.set(p.x, p.y + yOffset, p.z);
            dummy.scale.setScalar(p.scale);
            dummy.updateMatrix();
            
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            {/* Simple geometry: Low Poly Tetrahedron or Sphere */}
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={0.4} // Low opacity for "Atmosphere" feel
                blending={THREE.AdditiveBlending} 
            />
        </instancedMesh>
    );
};