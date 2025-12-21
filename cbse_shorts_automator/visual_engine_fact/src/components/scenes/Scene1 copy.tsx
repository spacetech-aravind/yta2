import React, { useMemo, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Canvas, useThree } from '@react-three/fiber';
import { Text3D, Billboard, CatmullRomLine, PerspectiveCamera, Center } from '@react-three/drei';
import * as THREE from 'three';
import { staticFile } from 'remotion';
import { FactScenario } from '../../types/schema';
import { Theme } from '../../theme/palettes';
import { InfiniteTunnel } from '../3d/InfiniteTunnel';
import { KnowledgeSlate } from '../3d/KnowledgeSlate';
import { SCENE_1_CONFIG } from '../../constants';
import { easings } from '../../utils/animation';
import { getTheme } from '../../theme/palettes';

interface SceneProps {
    scenario?: FactScenario;
}

export const Scene1: React.FC<SceneProps> = ({ scenario }) => {
    const frame = useCurrentFrame();
    const { fps,width:vid_width, height:vid_height } = useVideoConfig();
    
    //const { height : unscaledheight} = useThree((state) => state.viewport); // Dynamic Viewport Height
    const currentTime = frame / fps;

    const viewport_height_scalefactor=1;

    //const height=unscaledheight * viewport_height_scalefactor;
    //const width = height * (9/16); // Assuming Vertical 9:16 Video
    

    // --- HELPER: NVU TO WORLD COORDINATES ---
    // NVU 0.0 is Bottom (-height/2)
    // NVU 1.0 is Top (+height/2)
    //const nvuToWorld = (nvu: number) => (nvu - 0.5) * height ;

    const { TARGET_COORDINATE, TEXT_SCALE_MAX } = SCENE_1_CONFIG;

    //console.log("Hello1");

    const theme=getTheme(scenario.meta.seed);
    //console.log("Hello2");
    const hookText=scenario.content.hook_3d;
    //console.log(hookText);

    // TIMINGS 
    const DURATION_SEARCH =3 * fps; // [cite: 153]
    const DURATION_SMASH = 1.0 * fps;  // Approx impact time
    const SLATE_START_Z = TARGET_COORDINATE.z - 50; // Spawns behind text

    // 1.2 CAMERA PATHING 
    const curve = useMemo(() => {
        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),         // Start
            new THREE.Vector3(5, -5, -100),     // Swoop
            new THREE.Vector3(-10, 10, -200),   // Bank
            new THREE.Vector3(TARGET_COORDINATE.x, TARGET_COORDINATE.y, TARGET_COORDINATE.z + 35) // End facing target
        ]);
    }, [TARGET_COORDINATE]);

    // Animate Camera along path
    const cameraProgress = interpolate(frame, [0, DURATION_SEARCH], [0, 1], {
        extrapolateRight: "clamp",
        easing: easings.searchPath // [cite: 150] Non-Linear Speed Ramp
    });
    
    const camPos = curve.getPoint(cameraProgress);
    const camLookAt = new THREE.Vector3(TARGET_COORDINATE.x, TARGET_COORDINATE.y, TARGET_COORDINATE.z);

    // 1.3 HOOK TEXT ANIMATION 
    const textScale = interpolate(frame, [DURATION_SEARCH - 10, DURATION_SEARCH], [0, TEXT_SCALE_MAX], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easings.elasticOut // [cite: 162] Elastic Entrance
    });

    const HookTextPosX=camPos[0];
    const HookTextPosY=camPos[1];

    // 1.4 THE SMASH LOGIC 
    // The Slate moves from behind text to Camera Z=0
    const slateZ = interpolate(frame, [DURATION_SEARCH + 10, DURATION_SEARCH + DURATION_SMASH], [SLATE_START_Z, TARGET_COORDINATE.z+0.1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easings.backOut // [cite: 172] Heavy spring Halt
    });

    // Collision Detection: When Slate passes the Text
    const hasCollided = slateZ > TARGET_COORDINATE.z; 
    const isPlaying = slateZ >= 0; // [cite: 175] Auto-play when stops

    console.log(theme.bg_gradient[0]);

    return (
        <AbsoluteFill>
            <ThreeCanvas
                linear
                width={vid_width}
                height={vid_height}
                style={{ backgroundColor: theme.bg_gradient[0] }}
            >
                {/* LIGHTING */}
                <ambientLight intensity={0.3} />
                <Center position={[0, 0, 0]}> {/* Apply your desired position here */}   
                         <pointLight 
                    position={[TARGET_COORDINATE.x, TARGET_COORDINATE.y, TARGET_COORDINATE.z]} 
                    intensity={200} 
                    color={theme.accent_primary} 
                    distance={100}
                />
                 </Center>

                {/* CAMERA */}
                <PerspectiveCamera 
                    makeDefault 
                    position={camPos} 
                    fov={50}
                    onUpdate={(c) => c.lookAt(camLookAt)}
                />

                {/* ENVIRONMENT */}
                <InfiniteTunnel theme={theme} />

                {/* HOOK TEXT - THE OBSTACLE */}
                {!hasCollided && ( 
                    <Billboard position={[TARGET_COORDINATE.x, TARGET_COORDINATE.y, TARGET_COORDINATE.z]}>
                     <Center position={[0.01, 0.01, 0]}> {/* Apply your desired position here */}   
                         <Text3D
                            font={staticFile("assets/fonts/bold.json")} 
                            size={3}
                            height={0.05}
                            curveSegments={12}
                            bevelEnabled
                            bevelThickness={0.1}
                            bevelSize={0.05}
                            bevelOffset={0}
                            bevelSegments={5}
                            scale={textScale}
                        >
                            {hookText}
                            <meshStandardMaterial 
                                color={theme.text_3d_face} 
                                emissive={theme.accent_primary}
                                emissiveIntensity={0.5}
                            />
                        </Text3D>
                        </Center>
                    </Billboard>
                )}

                {/* PARTICLE EXPLOSION (Simulated) [cite: 170] */}
                {hasCollided && frame < DURATION_SEARCH + DURATION_SMASH + 60 && (
                     <Explosion origin={TARGET_COORDINATE} theme={theme} startTime={DURATION_SEARCH + DURATION_SMASH} />
                )}

                {/* THE KNOWLEDGE SLATE */}
                <KnowledgeSlate 
                    theme={theme} 
                    position={[TARGET_COORDINATE.x, TARGET_COORDINATE.y, slateZ]} // Centered X/Y, Moving Z
                    isPlaying={isPlaying}
                />

            </ThreeCanvas>
        </AbsoluteFill>
    );
};

// Simple Particle Explosion Helper
const Explosion = ({ origin, theme, startTime }: any) => {
    const frame = useCurrentFrame();
    const progress = (frame - startTime) * 0.1;
    
    // Create 50 random debris chunks
    const particles = useMemo(() => {
        return new Array(100).fill(0).map(() => ({
            dir: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()+0.5),
            speed: Math.random() * 3 + 6,
            scale: Math.random() * 0.5
        }));
    }, []);

    return (
        <group position={[origin.x, origin.y, origin.z]}>
            {particles.map((p, i) => (
                <mesh key={i} position={p.dir.clone().multiplyScalar(progress * p.speed * 5)} rotation={[progress*0, progress*0, 0]}>
                    <boxGeometry args={[p.scale, p.scale, p.scale]} />
                    <meshBasicMaterial color={theme.text_3d_face} transparent opacity={1 - (progress*0/10)} />
                </mesh>
            ))}
        </group>
    );
};


export const Scene: React.FC<SceneProps> = ({ scenario }) => {
    const theme = getTheme(scenario.meta.seed+5);
    const { width, height } = useVideoConfig();
    const variant = getVariant(scenario.meta.seed);
    console.log("ParticleSystem Variant:", variant);

    console.log(theme.bg[0],theme.bg[1])
    const audioSource = staticFile(scenario.assets.audio_url);

    return (
        
    <div style={{ width: '100%', height: '100%', background: `radial-gradient(circle, ${theme.bg[0]}, ${theme.bg[1]})` }}>
            
            /*<Audio 
        src={audioSource} 
        volume={0.7}
      />*/
            
            <ThreeCanvas shadows dpr={[1, 1]} 
            width={width} 
            height={height}            
            >
                
                <Scene1 scenario={scenario} />
            </ThreeCanvas>
            {/* Layer 100: The Ghost UI Overlay */}
            /*<Watermark scenario={scenario} />*/
        </div>
       
    );
};