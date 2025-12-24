// Strict Palette Implementation
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
        bg_gradient: ['#000902', '#000000'],
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
