import React, { useMemo, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Canvas, useThree } from '@react-three/fiber';
import { Text3D, Billboard, CatmullRomLine, PerspectiveCamera, Center } from '@react-three/drei';
import * as THREE from 'three';
import { staticFile,spring,Easing } from 'remotion';
import { FactScenario } from '../../types/schema';
import { Theme } from '../../theme/palettes';
import { InfiniteTunnel } from '../3d/InfiniteTunnel';
import { KnowledgeSlate } from '../3d/KnowledgeSlate';
import { TIMING,LAYOUT,SCENE_1_CONFIG } from '../../constants';
import { easings } from '../../utils/animation';
import { getTheme } from '../../theme/palettes';

interface SceneProps {
    scenario?: FactScenario;
}

export const SceneContent: React.FC<SceneProps> = ({ scenario }) => {
    const frame = useCurrentFrame();
    const { fps,width:vid_width, height:vid_height } = useVideoConfig();
    
    // 1. DYNAMIC TIMING (Backward Calculation from t_title)
    const T_TITLE_FRAME = Math.round(scenario.timings.t_title * fps);
    
    // 1. The Move Up finishes at T_TITLE_FRAME
    //const  = T_TITLE_FRAME - TIMING.S1_MOVE_DURATION_FRAMES;
    
    // 2. The Click happens immediately before the move starts
    //const  = MOVE_START_FRAME - TIMING.S1_CLICK_DURATION_FRAMES;
    
    // 3. The Pause after Smash
    //const  = CLICK_START_FRAME - TIMING.S1_POST_SMASH_PAUSE_FRAMES;
    
    // 4. The Smash (Thrust)
    //const  = SMASH_END_FRAME - TIMING.S1_SMASH_DURATION_FRAMES;
    
    // Inside SceneContent (Scene1.tsx)
    // 1. Fixed Durations from Constants
    const DURATION_SEARCH = Math.min(
        Math.round(scenario.timings.t_title * fps * 0.5), // Max 50% of time for search
        TIMING.MAX_SEARCH_FRAMES
    );

    // 2. Forward Chain
    const SMASH_START_FRAME = DURATION_SEARCH + TIMING.S1_PRE_SMASH_PAUSE_FRAMES;
    const SMASH_END_FRAME = SMASH_START_FRAME + TIMING.S1_SMASH_DURATION_FRAMES;

    const CLICK_START_FRAME = SMASH_END_FRAME + TIMING.S1_POST_SMASH_PAUSE_FRAMES;
    const CLICK_END = CLICK_START_FRAME + TIMING.S1_CLICK_DURATION_FRAMES;

    const MOVE_START_FRAME = CLICK_END;
    const MOVE_END = MOVE_START_FRAME + TIMING.S1_MOVE_DURATION_FRAMES;

    // 3. The Boolean Lock
    // The slate is "At Top" from MOVE_END onwards, regardless of when Scene 2 starts
    const slate_reached_top = frame >= MOVE_END;

    // 4. Syncing with Scene 2
    //const T_TITLE_FRAME = Math.round(scenario.timings.t_title * fps);
    //const HOLD_AT_END_DURATION = T_TITLE_FRAME - (DURATION_SEARCH + ACTION_FRAMES);   
    // 2. LAYOUT
    const slateWidth = LAYOUT.S1_SLATE_WIDTH;
    
    const { height : unscaledheight} = useThree((state) => state.viewport); // Dynamic Viewport Height
    //const currentTime = frame / fps;

    const viewport_height_scalefactor=1;

    const height=unscaledheight * viewport_height_scalefactor;
    const width = height * (9/16); // Assuming Vertical 9:16 Video
    

    // --- HELPER: NVU TO WORLD COORDINATES ---
    // NVU 0.0 is Bottom (-height/2)
    // NVU 1.0 is Top (+height/2)
    const nvuToWorld = (nvu: number) => (nvu - 0.5) * height ;

    //const { TARGET_COORDINATE, TEXT_SCALE_MAX } = SCENE_1_CONFIG;
    const { TEXT_SCALE_MAX } = SCENE_1_CONFIG;
    const { TARGET_SLATE_ITEM } = SCENE_1_CONFIG;
    const { GRID_X_COUNT,GRID_Y_COUNT,GRID_Z_COUNT, TUNNEL_LENGTH,BOX_W_FACT,BOX_H_FACT } = SCENE_1_CONFIG;
    

    //const slateWidth=.75;

    const boxwidth_plus_gap = slateWidth/BOX_W_FACT;
    const boxwidth=boxwidth_plus_gap * BOX_W_FACT;
    const boxheight=boxwidth * 0.5625;
    const boxheight_plus_gap = boxheight / BOX_H_FACT;
    const boxdepth_plus_gap = TUNNEL_LENGTH / GRID_Z_COUNT;
    const TARGET_COORDINATEx=(TARGET_SLATE_ITEM.x - (GRID_X_COUNT - 1.05) / 2) * boxwidth_plus_gap;
    const TARGET_COORDINATEy=(TARGET_SLATE_ITEM.y - (GRID_Y_COUNT - 1.05) / 2) * boxheight_plus_gap;
    const TARGET_COORDINATEz=(boxdepth_plus_gap*TARGET_SLATE_ITEM.z);
    const TARGET_COORDINATE={ x: TARGET_COORDINATEx, y: TARGET_COORDINATEy, z: -TARGET_COORDINATEz }

    //console.log("Hello1");

    const theme=getTheme(scenario.meta.theme_seed);
    //console.log("Hello2");
    const hookText=scenario.content.hook_3d;
    //console.log(hookText);


    // 1. Reference point: The specific wall Z
    const wallZ = TARGET_COORDINATE.z;
    const gap = boxdepth_plus_gap;

    // 2. Point Light: Always in front so we see the emoji immediately
    const lightZ = wallZ + (gap * 0.5);

    // TIMINGS 
    //const DURATION_SEARCH =3 * fps; // [cite: 153]
    //const DURATION_SMASH = TIMING.S1_SMASH_DURATION_FRAMES;  // Approx impact time
    const SLATE_START_Z = wallZ - (gap * 0.2); // Spawns behind text


    // 2. Set Camera Final Z to be safely between the walls
    // We position it at 75% of the way between the previous wall and target wall
    const cameraFinalZ = TARGET_COORDINATE.z + (boxdepth_plus_gap * 0.75);
    const cameraFinalY = TARGET_COORDINATE.y;
    // 1.2 CAMERA PATHING 
    const curve = useMemo(() => {
        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 5),         // Start
            new THREE.Vector3(TARGET_COORDINATE.x/3, 2*cameraFinalY/3, (cameraFinalZ)*0.33),     // Swoop
            new THREE.Vector3(-2*TARGET_COORDINATE.x/3, -2*cameraFinalY/3, (cameraFinalZ)*0.66),   // Bank
            new THREE.Vector3(TARGET_COORDINATE.x, cameraFinalY, cameraFinalZ) // End facing target
        ]);
    }, [TARGET_COORDINATE,cameraFinalZ]);

    // Animate Camera along path
    const cameraProgress = interpolate(frame, [0, DURATION_SEARCH], [0, 1], {
        extrapolateRight: "clamp",
        easing: easings.searchPath // [cite: 150] Non-Linear Speed Ramp
    });
    
    const camPos = curve.getPoint(cameraProgress);
    const camLookAt = new THREE.Vector3(TARGET_COORDINATE.x, TARGET_COORDINATE.y, TARGET_COORDINATE.z);



    // 1.3 HOOK TEXT ANIMATION 
    const textScale = interpolate(frame, [DURATION_SEARCH - 10, DURATION_SEARCH], [TEXT_SCALE_MAX, TEXT_SCALE_MAX], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easings.elasticOut // [cite: 162] Elastic Entrance
    });
    // 1.3 Slate ANIMATION 
    /* const slateScale = interpolate(frame, [DURATION_SEARCH - 10, DURATION_SEARCH], [0.001, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easings.elasticOut // [cite: 162] Elastic Entrance
    }); */

    const slateScale =1.0;
    // 1. Get the direction the camera is looking
const lookDir = useMemo(() => new THREE.Vector3(), []);
lookDir.subVectors(camLookAt, camPos).normalize();

// 2. Project the text position along that look direction
// This ensures the text is always dead-center of the frame
const TEXT_DISTANCE = 2;
const HookTextPos = useMemo(() => new THREE.Vector3(), []);
HookTextPos.copy(camPos).add(lookDir.multiplyScalar(TEXT_DISTANCE));

// Use these for your Billboard and Explosion
const HookTextPosX = HookTextPos.x;
const HookTextPosY = HookTextPos.y;
const HookTextPosZ = HookTextPos.z;

    // --- 1. IMPROVED POSITIONING ---
// This ensures the text is always exactly in the center of the camera's vision
const camToTargetVec = useMemo(() => new THREE.Vector3(), []);
const hookPos = useMemo(() => new THREE.Vector3(), []);

// Calculate the point 50% of the way between camera and target
camToTargetVec.set(
    TARGET_COORDINATE.x - camPos.x,
    TARGET_COORDINATE.y - camPos.y,
    TARGET_COORDINATE.z - camPos.z
);
hookPos.copy(camPos).add(camToTargetVec.multiplyScalar(0.5));

// --- 2. DYNAMIC FONT SCALING ---
// Vertical video is narrow. Shrink font if text is long.
const responsiveScale = useMemo(() => {
    const baseScale = TEXT_SCALE_MAX;
    const maxLength = 15; // Max characters before we start shrinking
    if (hookText.length > maxLength) {
        return baseScale * (maxLength / hookText.length);
    }
    return baseScale;
}, [hookText, TEXT_SCALE_MAX]);

// Apply the entrance animation to our responsive scale
const animatedScale = textScale * (responsiveScale / TEXT_SCALE_MAX);
const fov = 50;

// The final slateZ should be the Camera's final Z minus this distance
    // 1.4 THE SMASH LOGIC 
    // The Slate moves from behind text to Camera Z=0
    const distToReach90Percent = (slateWidth / 0.9) / (2 * Math.tan((fov * Math.PI) / 180 / 2) * (9/16));
    const finalStopZ = cameraFinalZ - distToReach90Percent;
    const slateZ = interpolate(frame, [SMASH_START_FRAME, SMASH_END_FRAME], [SLATE_START_Z, finalStopZ], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.back(1.5)) // [cite: 172] Heavy spring Halt
    });

    // Collision Detection: When Slate passes the Text
    const hasCollided = slateZ > HookTextPosZ; 
    console.log(slateZ,camPos.z)
    // Constants for the interaction sequence
    //const POST_SMASH_PAUSE = 0.5 * fps;
    //const CLICK_START_FRAME = DURATION_SEARCH + DURATION_SMASH + POST_SMASH_PAUSE;

    // How many frames since the click started? (Negative if it hasn't started yet)
    const clickFrame = frame - CLICK_START_FRAME; 
    const isPlaying = frame >= (CLICK_START_FRAME);
    console.log(theme.bg_gradient[0]);

    // --- NEW: VERTICAL POSITIONING LOGIC ---

    // 1. Get the viewport at the depth where the slate finally stops
    // We use useThree inside SceneContent to get the camera and viewport
    const { viewport, camera } = useThree();
    /* const localViewport = useMemo(() => {
        // We calculate viewport at the 'finalStopZ' depth
        return viewport.getCurrentViewport(camera, new THREE.Vector3(TARGET_COORDINATE.x, TARGET_COORDINATE.y, finalStopZ));
    }, [viewport, camera, TARGET_COORDINATE.x, TARGET_COORDINATE.y, finalStopZ]);
 */
    // Replace your spring with this for 100% consistency
    //const MOVE_DURATION = 30; // 1 second at 30fps
    const moveProgress = interpolate(
        frame,
        [MOVE_START_FRAME, MOVE_END],
        [0, 1],
        {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: (t) => 1 - Math.pow(1 - t, 4) // Fast start, very smooth slow finish
        }
    );

   

    // 3. Calculate Coordinates in 3D Units
    //const slateHeight = slateWidth * 0.5625;
    //const topEdge3D = localViewport.height / 2;
    //const margin3D = localViewport.height * 0.05; // 15% from top
    //const destinationY = topEdge3D - margin3D - (slateHeight / 2);

    // Lock the viewport values so they don't shift during the move
    const lockedDestinationY = useMemo(() => {
        // 1. Get the camera's resting Y (where it ends after the path)
        //const finalCamPos = curve.getPoint(1);
        const camY = cameraFinalY;
        const camZ = cameraFinalZ;

        // 2. Distance from camera to slate at the end
        const distance = Math.abs(camZ - finalStopZ);

        // 3. Calculate full viewport height at that distance
        // fov is in degrees, so we convert to radians and divide by 2 for the triangle
        const vHeightAtDepth = 2 * distance * Math.tan((fov * Math.PI) / 360);

        // 4. Determine coordinates
        const slateHeight = slateWidth * 0.5625;
        const topEdgeWorldY = camY + (vHeightAtDepth / 2);
        
        // 5. Apply the Layout Margin (e.g., 5% from top)
        const marginAmount = vHeightAtDepth * LAYOUT.S2_SLATE_TOP;
        
        // The final center position for the slate
        return topEdgeWorldY - marginAmount - (slateHeight / 2);
    }, [cameraFinalZ, finalStopZ, slateWidth, fov]);
    // Notice we DON't include 'frame' here, so it stays constant.

    const isAtTop = frame >= MOVE_END;
    // 4. Interpolate Y from the "Smash" height (TARGET_COORDINATE.y) to destinationY
    const animatedY = !isAtTop?interpolate(moveProgress, [0, 1], [TARGET_COORDINATE.y, TARGET_COORDINATE.y*0+lockedDestinationY], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp"
    }):TARGET_COORDINATE.y*0+lockedDestinationY;

    // 1. Scale the tunnel down (recede into the distance)
    const tunnelScale = interpolate(moveProgress, [0, 1], [1, 0.5], {
        extrapolateRight: 'clamp'
    });

    // 2. Fade the tunnel out
    const tunnelOpacity = interpolate(moveProgress, [0, 0.8], [1, 0], {
        extrapolateRight: 'clamp'
    });

    return (
        <>
                {/* LIGHTING */}
                <ambientLight intensity={1.5} />
                  
                         <pointLight 
                    position={[TARGET_COORDINATE.x, TARGET_COORDINATE.y, lightZ]} 
                    intensity={35} 
                    color={theme.accent_primary} 
                    distance={gap*5.5}
                    decay={3.5}
                />
                 

                {/* CAMERA */}
                <PerspectiveCamera 
                    makeDefault 
                    position={camPos} 
                    fov={fov}
                    onUpdate={(c) => c.lookAt(camLookAt)}
                />

                {/* ENVIRONMENT */}
                <group scale={[tunnelScale, tunnelScale, tunnelScale]}>
                    <InfiniteTunnel 
                        theme={theme} 
                        vp_width={width}
                        slateWidth={slateWidth}
                        opacity={tunnelOpacity} // Ensure your tunnel materials use this
                    />
                </group>

                {/* HOOK TEXT - THE OBSTACLE */}
                {!hasCollided && ( 
                    <Billboard position={[HookTextPosX, HookTextPosY, HookTextPosZ]}>
                     <Center bottom   key={hookText}  > {/* Apply your desired position here */}   
                         <Text3D
                            font={staticFile("assets/fonts/bold.json")} 
                            size={0.8}
                            height={0.1}
                            curveSegments={12}
                            bevelEnabled
                            bevelThickness={0.1}
                            bevelSize={0.05}
                            bevelOffset={0}
                            bevelSegments={5}
                            scale={animatedScale}
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
                {hasCollided && frame <  SMASH_END_FRAME + TIMING.S1_EXPLOSION_DURATION && (
                     <Explosion origin={{ x: HookTextPosX, y: HookTextPosY, z: HookTextPosZ +gap*0.1 }} theme={theme} startTime={SMASH_END_FRAME} duration={TIMING.S1_EXPLOSION_DURATION} />
                )}

                {/* THE KNOWLEDGE SLATE */}
                 <group 
                    position={[0, 0, 0]} 
                    // Apply both the global scale factor AND the dynamic scale-in value
                    scale={[
                        slateScale, 
                        slateScale, 
                        1
                    ]}
                >
                <KnowledgeSlate 
                    theme={theme} 
                    position={[TARGET_COORDINATE.x, animatedY, slateZ]} // Centered X/Y, Moving Z
                    isPlaying={isPlaying}
                    slateWidth={slateWidth}
                    clickFrame={clickFrame}
                    scenario={scenario}
                />
                </group>

        </>

         
    );
};

// Simple Particle Explosion Helper
const Explosion = ({ origin, theme, startTime, duration }: any) => {
    const frame = useCurrentFrame();
    // Normalize progress from 0 to 1 over the duration of the explosion
    const progress = (frame - startTime) / duration;
    
    const particles = useMemo(() => {
        return new Array(50).fill(0).map(() => ({
            dir: new THREE.Vector3(
                (Math.random() - 0.5) * 2, 
                (Math.random() - 0.5) * 2, 
                (Math.random() - 0.5) * 2
            ).normalize(),
            speed: Math.random() * 4 + 2, // Slower, more "floaty" debris
            scale: Math.random() * 0.004 + 0.01
        }));
    }, []);

    return (
        <group position={[origin.x, origin.y, origin.z]}>
            {particles.map((p, i) => {
                // Particles travel outward based on speed and progress
                const currentPos = p.dir.clone().multiplyScalar(progress * p.speed);
                
                return (
                    <mesh key={i} position={[currentPos.x, currentPos.y, currentPos.z]}>
                        <boxGeometry args={[p.scale, p.scale, p.scale]} />
                        <meshBasicMaterial 
                            color={theme.text_3d_face} 
                            transparent 
                            opacity={Math.max(0, 1 - progress)} // Smooth linear fade
                        />
                    </mesh>
                );
            })}
        </group>
    );
};


export const Scene1: React.FC<SceneProps> = ({ scenario }) => {
    const theme = getTheme(scenario.meta.theme_seed+5);
    const { width, height } = useVideoConfig();
    //const variant = getVariant(scenario.meta.seed);
    //console.log("ParticleSystem Variant:", variant);

    //console.log(theme.bg[0],theme.bg[1])
    //const audioSource = staticFile(scenario.assets.audio_url);

    return (
        <AbsoluteFill>
            <ThreeCanvas
                linear
                width={width}
                height={height}
                style={{ backgroundColor: theme.bg_gradient[0] }}
             >
                {/*</ThreeCanvas><div style={{ width: '100%', height: '100%', background: `radial-gradient(circle, ${theme.bg[0]}, ${theme.bg[1]})` }}>
                */}    
            
            
            
                
                <SceneContent scenario={scenario} />
            </ThreeCanvas>
            {/* Layer 100: The Ghost UI Overlay */}
            {/*<Watermark scenario={scenario} />*/}
        {/*</div>*/}
       
        </AbsoluteFill>  
    );
};