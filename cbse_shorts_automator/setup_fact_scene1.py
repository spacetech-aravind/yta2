import os
import subprocess
import json

# ==========================================
# CONFIGURATION
# ==========================================
PROJECT_NAME = "cbse_shorts_automator/visual_engine_fact"
ROOT_DIR = os.path.join(os.getcwd(), PROJECT_NAME)

# ==========================================
# FILE CONTENT GENERATORS
# ==========================================

def get_package_json():
    return """{
  "name": "visual_engine_fact",
  "version": "1.0.0",
  "description": "NCERT QuickPrep Visual Engine",
  "scripts": {
    "start": "remotion preview",
    "render": "remotion render",
    "upgrade": "remotion upgrade"
  },
  "dependencies": {
    "remotion": "4.0.78",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@remotion/cli": "4.0.78",
    "@remotion/three": "^4.0.78",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.88.0",
    "three": "^0.158.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/three": "^0.158.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.0.0"
  }
}"""

def get_tsconfig():
    return """{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "react-jsx",
    "moduleResolution": "node",
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}"""

def get_remotion_config():
    return """import { Config } from '@remotion/cli/config';
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);"""

def get_src_index():
    return """import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

registerRoot(RemotionRoot);"""

def get_src_constants():
    return """// Constants Implementation
export const TIMING = {
  SCENE2_DELAY_TITLE: 0.15,
  SCENE2_DELAY_DECODE: 0.2,
  SCENE3_DELAY_FLIP: 0.1,
  SCENE3_DELAY_BADGE: 0.6,
  SCENE3_DELAY_HAND: 1.2,
  SCENE3_DURATION_SOCIAL: 2.5,
  SCENE4_DELAY_LOGO: 0.1,
  SCENE4_DELAY_USP1: 0.5,
  SCENE4_DELAY_USP2: 1.2,
  SCENE4_DELAY_COPY: 0.5
};

export const LAYOUT = {
  MARGIN_X: 0.15,
  MARGIN_Y_BOTTOM_DEAD: 0.20,
  S2_SLATE_TOP: 0.15,
  S2_TITLE_TOP: 0.20,
  S2_BODY_TOP: 0.45,
  S3_CTA_CENTER_Y: 0.65,
  S3_BADGE_OFFSET_X: 0.25
};

// Scene 1 specific constants from visual spec
export const SCENE_1_CONFIG = {
    TUNNEL_LENGTH: 1000,
    FOG_DENSITY: 0.02,
    CUBE_COUNT: 500,
    TARGET_COORDINATE: { x: 10, y: 5, z: -300 }, // [cite: 145]
    TEXT_SCALE_MAX: 1.5,
};
"""

def get_src_theme_palettes():
    return """// Strict Palette Implementation
export interface Theme {
    id: string;
    bg_gradient: string[];
    accent_primary: string;
    accent_secondary: string;
    container_bg: string;
    text_3d_face: string;
    text_3d_side: string;
    particle_shape: 'box' | 'tetrahedron' | 'torus';
    fog_density: number;
}

export const THEMES: Theme[] = [
    // Theme 0: Neural Network (Tech) [cite: 54]
    {
        id: 'neural',
        bg_gradient: ['#050A14', '#000000'],
        accent_primary: '#00F0FF',
        accent_secondary: '#0055FF',
        container_bg: 'rgba(5, 10, 20, 0.7)',
        text_3d_face: '#FFFFFF',
        text_3d_side: '#00F0FF',
        particle_shape: 'box',
        fog_density: 0.02
    },
    // Theme 1: Golden Archive [cite: 66]
    {
        id: 'golden',
        bg_gradient: ['#1A1A1A', '#0F0F0F'],
        accent_primary: '#FFD700',
        accent_secondary: '#C5A000',
        container_bg: 'rgba(26, 26, 26, 0.7)',
        text_3d_face: '#FFFDD0',
        text_3d_side: '#B8860B',
        particle_shape: 'tetrahedron',
        fog_density: 0.025
    },
    // Theme 2: Quantum Lab [cite: 78]
    {
        id: 'quantum',
        bg_gradient: ['#021205', '#000000'],
        accent_primary: '#39FF14',
        accent_secondary: '#FF007F',
        container_bg: 'rgba(2, 18, 5, 0.7)',
        text_3d_face: '#FFFFFF',
        text_3d_side: '#39FF14',
        particle_shape: 'torus',
        fog_density: 0.03
    }
];

export const getTheme = (seed: number) => THEMES[seed % THEMES.length];
"""

def get_src_utils_animation():
    return """import { interpolate, Easing } from 'remotion';

// Hardcoded Spring Configs / Easings

export const easings = {
    elasticOut: Easing.elastic(1),
    backOut: Easing.back(2), // [cite: 172] Heavy spring
    searchPath: Easing.bezier(0.25, 0.1, 0.25, 1), // Non-linear search
};

export const remap = (value: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number) => {
    return outputMin + ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin);
};
"""

def get_src_components_3d_tunnel():
    return """import React, { useMemo, useRef } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Theme } from '../../theme/palettes';
import { SCENE_1_CONFIG } from '../../constants';

// The Environment: Infinite Library
export const InfiniteTunnel: React.FC<{ theme: Theme }> = ({ theme }) => {
    const { CUBE_COUNT, TUNNEL_LENGTH } = SCENE_1_CONFIG;

    // Procedural generation of cube positions
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < CUBE_COUNT; i++) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = -Math.random() * TUNNEL_LENGTH;
            const scale = Math.random() * 2 + 0.5;
            temp.push({ x, y, z, scale });
        }
        return temp;
    }, [CUBE_COUNT, TUNNEL_LENGTH]);

    return (
        <group>
            {/* Volumetric Fog matching BG */}
            <fog attach="fog" args={[theme.bg_gradient[0], 10, 500]} />
            
            <Instances range={CUBE_COUNT}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial 
                    color={theme.accent_secondary} 
                    emissive={theme.accent_secondary}
                    emissiveIntensity={0.5}
                    roughness={0.1}
                />
                {particles.map((data, i) => (
                    <Instance
                        key={i}
                        position={[data.x, data.y, data.z]}
                        scale={[data.scale, data.scale, data.scale]}
                        rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
                    />
                ))}
            </Instances>
        </group>
    );
};
"""

def get_src_components_3d_slate():
    return """import React from 'react';
import { RoundedBox, useVideoTexture } from '@react-three/drei';
import { staticFile } from 'remotion';
import { Theme } from '../../theme/palettes';

// The Knowledge Slate (Hero Object)
interface Props {
    theme: Theme;
    position: [number, number, number];
    isPlaying: boolean;
}

export const KnowledgeSlate: React.FC<Props> = ({ theme, position, isPlaying }) => {
    // Geometry: 16x9x1.5, Radius 0.5
    // VideoTexture handling
    const texture = useVideoTexture(staticFile("assets/video_src.mp4"), {
        start: isPlaying,
        muted: true // Muted for auto-play browser policies in preview
    });

    return (
        <group position={position}>
            {/* The Slab */}
            <RoundedBox args={[16, 9, 1.5]} radius={0.5} smoothness={4}>
                {/* Materials */}
                <meshStandardMaterial attach="material-0" color={theme.accent_primary} metalness={0.8} roughness={0.2} /> {/* Right */}
                <meshStandardMaterial attach="material-1" color={theme.accent_primary} metalness={0.8} roughness={0.2} /> {/* Left */}
                <meshStandardMaterial attach="material-2" color={theme.accent_primary} metalness={0.8} roughness={0.2} /> {/* Top */}
                <meshStandardMaterial attach="material-3" color={theme.accent_primary} metalness={0.8} roughness={0.2} /> {/* Bottom */}
                <meshBasicMaterial attach="material-4" map={texture} toneMapped={false} /> {/* Front (Video) */}
                <meshStandardMaterial attach="material-5" color="#111" /> {/* Back */}
            </RoundedBox>
            
            {/* Diegetic UI Placeholder (Simple chin button) */}
            <mesh position={[0, -5, 0.76]}>
                 <capsuleGeometry args={[0.2, 2, 4, 8]} />
                 <meshStandardMaterial 
                    color="white" 
                    emissive="white" 
                    emissiveIntensity={isPlaying ? 0.5 : 2.0} // [cite: 176] Pulse effect logic
                 />
                 <mesh rotation={[0,0, Math.PI/2]}>
                     <capsuleGeometry args={[0.2, 2, 4, 8]} />
                     <meshStandardMaterial color={theme.accent_primary} />
                 </mesh>
            </mesh>
        </group>
    );
};
"""

def get_src_components_scene1():
    return """import React, { useMemo, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { Text3D, Billboard, CatmullRomLine, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { staticFile } from 'remotion';

import { Theme } from '../../theme/palettes';
import { InfiniteTunnel } from '../3d/InfiniteTunnel';
import { KnowledgeSlate } from '../3d/KnowledgeSlate';
import { SCENE_1_CONFIG } from '../../constants';
import { easings } from '../../utils/animation';

interface SceneProps {
    theme: Theme;
    hookText: string;
}

export const Scene1_Hook: React.FC<SceneProps> = ({ theme, hookText }) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const { TARGET_COORDINATE, TEXT_SCALE_MAX } = SCENE_1_CONFIG;

    // TIMINGS 
    const DURATION_SEARCH = 1.2 * fps; // [cite: 153]
    const DURATION_SMASH = 2.0 * fps;  // Approx impact time
    const SLATE_START_Z = TARGET_COORDINATE.z - 50; // Spawns behind text

    // 1.2 CAMERA PATHING 
    const curve = useMemo(() => {
        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),         // Start
            new THREE.Vector3(5, -5, -100),     // Swoop
            new THREE.Vector3(-10, 10, -200),   // Bank
            new THREE.Vector3(TARGET_COORDINATE.x, TARGET_COORDINATE.y, TARGET_COORDINATE.z + 40) // End facing target
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

    // 1.4 THE SMASH LOGIC 
    // The Slate moves from behind text to Camera Z=0
    const slateZ = interpolate(frame, [DURATION_SEARCH + 10, DURATION_SEARCH + 40], [SLATE_START_Z, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: easings.backOut // [cite: 172] Heavy spring Halt
    });

    // Collision Detection: When Slate passes the Text
    const hasCollided = slateZ > TARGET_COORDINATE.z; 
    const isPlaying = slateZ >= 0; // [cite: 175] Auto-play when stops

    return (
        <AbsoluteFill>
            <ThreeCanvas
                linear
                width={width}
                height={height}
                style={{ backgroundColor: theme.bg_gradient[0] }}
            >
                {/* LIGHTING */}
                <ambientLight intensity={0.3} />
                <pointLight 
                    position={[TARGET_COORDINATE.x, TARGET_COORDINATE.y, TARGET_COORDINATE.z]} 
                    intensity={2} 
                    color={theme.accent_primary} 
                    distance={100}
                />

                {/* CAMERA */}
                <PerspectiveCamera 
                    makeDefault 
                    position={camPos} 
                    fov={75}
                    onUpdate={(c) => c.lookAt(camLookAt)}
                />

                {/* ENVIRONMENT */}
                <InfiniteTunnel theme={theme} />

                {/* HOOK TEXT - THE OBSTACLE */}
                {!hasCollided && ( // [cite: 169] Visible = false on impact
                    <Billboard position={[TARGET_COORDINATE.x, TARGET_COORDINATE.y, TARGET_COORDINATE.z]}>
                         <Text3D
                            font={staticFile("assets/fonts/bold.ttf")} // [cite: 201]
                            size={4}
                            height={1}
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
                    </Billboard>
                )}

                {/* PARTICLE EXPLOSION (Simulated) [cite: 170] */}
                {hasCollided && frame < DURATION_SEARCH + 60 && (
                     <Explosion origin={TARGET_COORDINATE} theme={theme} startTime={DURATION_SEARCH + 25} />
                )}

                {/* THE KNOWLEDGE SLATE */}
                <KnowledgeSlate 
                    theme={theme} 
                    position={[0, 0, slateZ]} // Centered X/Y, Moving Z
                    isPlaying={isPlaying}
                />

            </ThreeCanvas>
        </AbsoluteFill>
    );
};

// Simple Particle Explosion Helper
const Explosion = ({ origin, theme, startTime }: any) => {
    const frame = useCurrentFrame();
    const progress = (frame - startTime) * 0.5;
    
    // Create 50 random debris chunks
    const particles = useMemo(() => {
        return new Array(50).fill(0).map(() => ({
            dir: new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize(),
            speed: Math.random() * 2 + 1,
            scale: Math.random() * 0.5
        }));
    }, []);

    return (
        <group position={[origin.x, origin.y, origin.z]}>
            {particles.map((p, i) => (
                <mesh key={i} position={p.dir.clone().multiplyScalar(progress * p.speed * 5)} rotation={[progress, progress, 0]}>
                    <boxGeometry args={[p.scale, p.scale, p.scale]} />
                    <meshBasicMaterial color={theme.accent_secondary} transparent opacity={1 - (progress/10)} />
                </mesh>
            ))}
        </group>
    );
};
"""

def get_src_root():
    return """import { Composition, staticFile } from 'remotion';
import { Scene1_Hook } from './components/scenes/Scene1_Hook';
import { getTheme } from './theme/palettes';
import scenario from '../public/scenario.json';

// The Actor: Remotion Root
export const RemotionRoot: React.FC = () => {
    const theme = getTheme(scenario.meta.theme_seed);
    const durationInFrames = 30 * 4; // 4 Seconds for Scene 1 test

    return (
        <>
            <Composition
                id="Scene1_Hook"
                component={Scene1_Hook}
                durationInFrames={durationInFrames}
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    theme: theme,
                    hookText: scenario.content.hook_3d
                }}
            />
        </>
    );
};
"""

def get_public_scenario():
    return """{
  "timings": { "t_title": 3.5 },
  "content": { "hook_3d": "DID YOU KNOW?" },
  "meta": { "theme_seed": 1 }
}"""

# ==========================================
# EXECUTION
# ==========================================

def create_file(path, content):
    full_path = os.path.join(ROOT_DIR, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Created: {path}")

def run_command(command, cwd):
    print(f"Running: {command}")
    subprocess.run(command, shell=True, check=True, cwd=cwd)

def main():
    print(f"Initializing Project in: {ROOT_DIR}")
    
    # 1. Scaffold Directory
    os.makedirs(ROOT_DIR, exist_ok=True)
    
    # 2. Write Config Files
    create_file("package.json", get_package_json())
    create_file("tsconfig.json", get_tsconfig())
    create_file("remotion.config.ts", get_remotion_config())
    
    # 3. Write Source Code
    create_file("src/index.ts", get_src_index())
    create_file("src/Root.tsx", get_src_root())
    create_file("src/constants.ts", get_src_constants())
    create_file("src/theme/palettes.ts", get_src_theme_palettes())
    create_file("src/utils/animation.ts", get_src_utils_animation())
    
    # 4. Write Components
    create_file("src/components/3d/InfiniteTunnel.tsx", get_src_components_3d_tunnel())
    create_file("src/components/3d/KnowledgeSlate.tsx", get_src_components_3d_slate())
    create_file("src/components/scenes/Scene1_Hook.tsx", get_src_components_scene1())
    
    # 5. Write Public Assets (Mock)
    create_file("public/scenario.json", get_public_scenario())
    
    # 6. Create Asset Folders
    os.makedirs(os.path.join(ROOT_DIR, "public/assets/fonts"), exist_ok=True)
    
    print("\\n[!] IMPORTANT: INSTALLATION REQUIRED")
    print("1. cd cbse_shorts_automator/visual_engine_fact")
    print("2. npm install")
    print("3. Download a .ttf font (e.g., Montserrat-Bold) to public/assets/fonts/bold.ttf")
    print("4. Place a dummy video at public/assets/video_src.mp4")
    print("5. npm start")

if __name__ == "__main__":
    main()