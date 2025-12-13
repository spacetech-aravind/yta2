import React from 'react';
import { Text } from '@react-three/drei';
import { staticFile } from 'remotion';

interface NanoTextProps {
    text: string;
    position: [number, number, number];
    fontSize?: number;
    color?: string;
    anchorX?: 'center' | 'left' | 'right';
    anchorY?: 'middle' | 'top' | 'bottom';
    fontUrl?: string;// NEW PROPS FOR WRAPPING
    maxWidth?: number;
    textAlign?: 'left' | 'right' | 'center' | 'justify';
}

export const NanoText: React.FC<NanoTextProps> = ({ 
    text, position, fontSize = 0.5, color = 'white', anchorX = 'center', anchorY='middle', fontUrl,maxWidth,    // <--- Receive prop
    textAlign = 'center' // <--- Default to center 
}) => {
    const adjustedSize = text.length > 20 ? fontSize * 0.75 : fontSize;
    
    // Logic: If fontUrl is provided (from JSON), use it (wrapped in staticFile if it's local path).
    // If not, use default local font.
    // The JSON generator now gives us "/assets/font.woff2", so we wrap it.
    
    const finalFontUrl = fontUrl 
        ? staticFile(fontUrl) 
        : staticFile('/assets/font.woff');

    return (
        <Text
            position={position}
            fontSize={adjustedSize}
            color={color}
            font={finalFontUrl} 
            anchorX={anchorX}
            anchorY={anchorY}
            outlineWidth={0.02}
            outlineColor="#000000"// NEW PROPS PASSED DOWN
            maxWidth={maxWidth}
            textAlign={textAlign}
        >
            {text}
        </Text>
    );
};