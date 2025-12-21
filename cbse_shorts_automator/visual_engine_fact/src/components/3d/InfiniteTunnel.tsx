import React, { useMemo, useRef } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Theme } from '../../theme/palettes';
import { SCENE_1_CONFIG } from '../../constants';
import { Edges } from '@react-three/drei'

const createSVGTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 144;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Texture();

    // 1. Data Pools
    const subjects = [
        { name: 'SCIENCE', emoji: '🔬' },
        { name: 'MATHS', emoji: '📐' },
        { name: 'ENGLISH', emoji: '📖' },
        { name: 'HISTORY', emoji: '🏺' },
        { name: 'PHYSICS', emoji: '⚡' },
        { name: 'GEOGRAPHY', emoji: '🌍' }
    ];
    const classes = ['CLASS 8', 'CLASS 9', 'CLASS 10', 'CLASS 12'];
    const chapters = ['CH-01', 'CH-05', 'CH-07', 'CH-12', 'CH-15'];

    const mode = Math.floor(Math.random() * 3);
    let topText = "";
    let emoji = "";

    if (mode === 0) {
        const item = subjects[Math.floor(Math.random() * subjects.length)];
        topText = item.name; emoji = item.emoji;
    } else if (mode === 1) {
        topText = classes[Math.floor(Math.random() * classes.length)]; emoji = '🏫';
    } else {
        topText = chapters[Math.floor(Math.random() * chapters.length)]; emoji = '📑';
    }

    // 2. Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Emoji & Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '100px serif'; 
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 8;
    ctx.fillText(emoji, canvas.width * 0.35, canvas.height / 2 - 5);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(topText, canvas.width * 0.58, canvas.height / 2);

    // --- 4. YOUTUBE STYLE PROGRESS BAR ---
    const barPadding = 0; // Set to 0 to make it hit the edges like YT thumbnails
    const barHeight = 6;
    const barY = canvas.height - barHeight -10;
    
    // Grey Background Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(barPadding, barY, canvas.width - (barPadding * 2), barHeight);

    // Random Progress (25% to 65%)
    const progressPercent = Math.random() * (0.65 - 0.25) + 0.25;
    const progressWidth = (canvas.width - (barPadding * 2)) * progressPercent;

    // Red Progress Bar
    ctx.fillStyle = '#FF0000'; // YouTube Red
    ctx.fillRect(barPadding, barY, progressWidth, barHeight);

    // Optional: Scrubber (the little red dot)
    /* ctx.beginPath();
    ctx.arc(barPadding + progressWidth, barY + (barHeight/2), 5, 0, Math.PI * 2);
    ctx.fill();
    */

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
};

// The Environment: Infinite Library
export const InfiniteTunnel: React.FC<{ theme: Theme; 
                                        vp_width:number
                                        slateWidth:number
                                        opacity:number}> = 
                                        ({ theme, 
                                            vp_width, 
                                            slateWidth,opacity}) => {
    const { GRID_X_COUNT,GRID_Y_COUNT,GRID_Z_COUNT, TUNNEL_LENGTH, BOX_W_FACT, BOX_H_FACT} = SCENE_1_CONFIG;

    //const vp_width=10;
    const vp_height=vp_width*1.777777;

    //const GRID_X_COUNT = 5;
    //const GRID_Y_COUNT = 5;
    //const GRID_Z_COUNT = 30;
    const boxwidth_plus_gap = slateWidth/BOX_W_FACT;
    const boxwidth=slateWidth;
    const boxheight=boxwidth * 0.5625;
    const boxheight_plus_gap = boxheight / BOX_H_FACT;
    
    //const boxwidth_plus_gap = vp_width / GRID_X_COUNT;
    //const boxheight_plus_gap = vp_height / GRID_Y_COUNT;
    //const boxwidth = boxwidth_plus_gap*BOX_W_FACT;
    //const boxheight = boxwidth/1.7777;
    //const SPACING_X = boxwidth_plus_gap-boxwidth;
    //const SPACING_Y = boxheight_plus_gap-boxheight;
    const SPACING_Z =  TUNNEL_LENGTH/GRID_Z_COUNT;

    // Create a larger pool of unique textures
    const texturePool = useMemo(() => Array.from({ length: 20 }, createSVGTexture), []);

    const gridItems = useMemo(() => {
        const items = [];
        for (let z = 0; z < GRID_Z_COUNT; z++) {
            for (let y = 0; y < GRID_Y_COUNT; y++) {
                for (let x = 0; x < GRID_X_COUNT; x++) {
                    items.push({
                        position: [
                            (x - (GRID_X_COUNT - 1) / 2) * boxwidth_plus_gap,
                            (y - (GRID_Y_COUNT - 1) / 2) * boxheight_plus_gap,
                            -z * (SPACING_Z )
                        ],
                        texture: texturePool[Math.floor(Math.random() * texturePool.length)]
                    });
                }
            }
        }
        return items;
    }, [texturePool]);

    // Procedural generation of cube positions
    /* const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < CUBE_COUNT; i++) {
            const x = (Math.random() - 0.25) * 100;
            const y = (Math.random() - 0.75) * 100;
            const z = -Math.random() * TUNNEL_LENGTH/2;
            const scale = Math.random() * 2 + 0.5;
            temp.push({ x, y, z, scale });
        }
        return temp;
    }, [CUBE_COUNT, TUNNEL_LENGTH]); */

    return (
        <group >
            {/* Volumetric Fog matching BG */}
            <fog attach="fog" args={[theme.bg_gradient[0], 5, TUNNEL_LENGTH]} />
            
            {gridItems.map((item, i) => (
                <mesh key={i} position={item.position as [number, number, number] }>
                    <boxGeometry args={[boxwidth, boxheight, boxheight*0.05]} />
                    
                    {/* Sides of the block use theme accent */}
                    <meshStandardMaterial attach="material-0" color={theme.accent_secondary} transparent={true}
                    opacity={opacity}/>
                    <meshStandardMaterial attach="material-1" color={theme.accent_secondary} transparent={true}
                    opacity={opacity}/>
                    <meshStandardMaterial attach="material-2" color={theme.accent_secondary} transparent={true}
                    opacity={opacity}/>
                    <meshStandardMaterial attach="material-3" color={theme.accent_secondary} transparent={true}
                    opacity={opacity}/>
                    
                    {/* Front Face: White background SVG */}
                    <meshStandardMaterial 
                        attach="material-4" 
                        map={item.texture} 
                        roughness={0.1}
                        metalness={0}
                        transparent={true}
                        opacity={opacity}
                    />
                    
                    {/* Back Face */}
                    <meshStandardMaterial attach="material-5" color={theme.accent_secondary} />
                </mesh>
            ))}
        </group>
    );
};
