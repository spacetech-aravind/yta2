import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { FactScenario } from '../../types/schema';
import { getTheme } from '../../theme/palettes';

export const Scene2: React.FC<{ scenario: FactScenario }> = ({ scenario }) => {
    const frame = useCurrentFrame();
    const theme = getTheme(scenario.meta.seed);

    return (
        <AbsoluteFill style={{ 
            backgroundColor: theme.bg_gradient[1], 
            justifyContent: 'center', 
            alignItems: 'center' 
        }}>
            <h1 style={{ color: 'white', fontSize: 80 }}>Scene 2: The Deep Dive</h1>
            <p style={{ color: 'white' }}>Fact: {scenario.content.fact_short_1}</p>
        </AbsoluteFill>
    );
};