import { random } from 'remotion';

// --- 1. THE 12-KEY HOLLYWOOD PALETTE INTERFACE ---
export interface Theme {
  // A. THE ENVIRONMENT (The "Infinite Studio")
  bg_gradient_inner: string; // Deep Center Color
  bg_gradient_outer: string; // Vignette Edge (True Black)

  // B. THE ENERGY (The "Pop")
  accent_primary: string;    // Main Neon (Rim Lights, Pipe Core, Pill BG)
  accent_highlight: string;  // Specular Sparkle (Chrome Reflections)
  accent_secondary: string;  // Atmosphere (Glass Tint, Tunnel Fog)

  // C. THE CTA SURFACE (Smart Visibility)
  surface_pill_bg: string;   // The Theme Neon Color
  text_on_pill: string;      // Auto-Contrast (Black or White)

  // D. THE INFORMATION (Context-Aware Text)
  text_header_3d: string;    // Pure White / Chrome (Hook, Title)
  text_body_dark: string;    // Silver / Off-White (For Glass Card)
  text_body_light: string;   // Charcoal (For Outro White BG)
  text_muted: string;        // Mid-Grey (Copyright)

  // E. FUNCTIONAL KEYS
  outro_primary: string;     // Darker/Print-Safe version of Primary
  brand_youtube: string;     // Fixed #FF0000
}

// --- 2. THE SEED ARCHETYPES ---
const PRESETS = [
  { name: 'Cyber Math',     hue: 190, sat: 100, lum: 50 }, // Electric Cyan (Bright)
  { name: 'Quantum Phys',   hue: 290, sat: 100, lum: 50 }, // Neon Purple (Dark)
  { name: 'Bio Organic',    hue: 140, sat: 100, lum: 50 }, // Toxic Green (Bright)
  { name: 'Royal History',  hue: 45,  sat: 100, lum: 50 }, // Golden Amber (Bright)
  { name: 'Deep Space',     hue: 220, sat: 90,  lum: 60 }, // Ice Blue (Bright-ish)
  { name: 'Volcanic Geo',   hue: 15,  sat: 100, lum: 55 }, // Magma Red (Dark)
];

// --- 3. COLOR MATH HELPERS ---
const hsl = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`;

// Helper: Returns true if the background is "Bright" (needs black text)
const isBright = (hue: number, lum: number) => {
  // Yellow/Green/Cyan/Orange range (Hue 20-185) with high luminance needs Black text
  if (hue > 30 && hue < 185 && lum > 45) return true;
  // Very light blues/pinks also need black text
  if (lum > 70) return true;
  return false;
};

// --- 4. THE GENERATOR FUNCTION ---
export const getTheme = (seed: number): Theme => {
  // A. Pick a deterministic preset
  const presetIndex = Math.floor(random(seed) * PRESETS.length);
  const p = PRESETS[presetIndex];

  // B. Calculate Dynamic Values
  const primaryColor = hsl(p.hue, p.sat, p.lum);
  const pillTextColor = isBright(p.hue, p.lum) ? '#000000' : '#FFFFFF';

  // C. Return The Palette
  return {
    // 1. ENVIRONMENT
    bg_gradient_inner: hsl(p.hue, 80, 8), 
    bg_gradient_outer: '#000000', 

    // 2. ENERGY
    accent_primary: primaryColor,
    accent_highlight: hsl(p.hue, 50, 90),
    accent_secondary: hsl(p.hue, 40, 25),

    // 3. CTA SURFACES (The Neon Pill Logic)
    surface_pill_bg: primaryColor, // Same as accent_primary
    text_on_pill: pillTextColor,   // Smart Switch

    // 4. TEXT HIERARCHY
    text_header_3d: '#FFFFFF', 
    text_body_dark: '#E6E6E6', 
    text_body_light: '#1F1F1F',
    text_muted: '#999999',     

    // 5. FUNCTIONAL
    outro_primary: (p.lum > 60 || (p.hue > 40 && p.hue < 70)) 
        ? hsl(p.hue, 100, 35) 
        : hsl(p.hue, 100, 40),

    brand_youtube: '#FF0000',
  };
};