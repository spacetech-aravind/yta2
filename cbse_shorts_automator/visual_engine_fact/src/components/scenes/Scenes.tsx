import React from 'react';
import { Series } from 'remotion';
import { Scene1 } from './Scene1';
//import { Scene2 } from './Scene2';
import { FactScenario } from '../../types/schema';

export const Scenes: React.FC<{ scenario: FactScenario }> = ({ scenario }) => {
    const { fps } = scenario.meta.config;
    
    // Scene 1 lasts until 't_details' (4.8s)
    const scene1Duration = Math.round(scenario.timings.t_title * fps);
    
    // Scene 2 lasts for the remainder of the video
    const totalFrames = Math.round(scenario.timings.total_duration * fps);
    const scene2Duration = totalFrames - scene1Duration;

    return (
        <Series>
            <Series.Sequence durationInFrames={scene1Duration}>
                <Scene1 scenario={scenario} />
            </Series.Sequence>
            {/* <Series.Sequence durationInFrames={scene2Duration}>
                <Scene2 scenario={scenario} />
            </Series.Sequence> */}
        </Series>
    );
};