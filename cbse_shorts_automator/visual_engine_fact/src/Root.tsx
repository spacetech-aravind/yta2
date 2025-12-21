import { Composition, staticFile, continueRender, delayRender  } from 'remotion';
import React, { useEffect, useState } from 'react';
import { Scenes } from './components/scenes/Scenes';
import { getTheme } from './theme/palettes';
//import scenario from '../public/scenario.json';
import { FactScenario } from './types/schema';

// Define a type for the initial metadata and full scenario we need to fetch
interface DynamicCompositionData {
    scenario: FactScenario;
    durationInFrames: number;
    width: number;
    height: number;
    fps:number;
}

// The Actor: Remotion Root
export const RemotionRoot: React.FC = () => {


    const [handle] = useState(() => delayRender());

    const [compData, setCompData] = useState<DynamicCompositionData | null>(null);
    //const theme = getTheme(data.meta.theme_seed);
     // Define a consistent FPS for conversion



    useEffect(() => {
        // 1. Fetch the scenario data from the public folder
        fetch(staticFile('scenario.json')) 
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data: FactScenario) => {
                const { total_duration } = data.timings;
                const { resolution } =data.meta.config;
                const { fps } =data.meta.config;
                const FPS = fps;
                
                const theme = data.meta.theme_seed;
                // 2. Calculate dynamic properties
                const durationInFrames = Math.ceil(total_duration * FPS);
                
                // 3. Store the full scenario and calculated metadata
                setCompData({
                    scenario: data,
                    durationInFrames,
                    width: resolution.w,
                    height: resolution.h,
                    fps:FPS
                });
                
                // 4. Signal Remotion to continue once data is ready
                continueRender(handle);
            })
            .catch(err => {
                console.error("❌ Failed to load scenario data for composition:", err);
                // In a real environment, you might log this error or show a safe fallback.
                // We keep the render delayed to prevent showing an unconfigured Composition.
            });
    }, [handle]);

    if (!compData) {
        // Display loading message while fetching data
        return (
            <div style={{ flex: 1, backgroundColor: '#18181b', color: '#fff', fontSize: 32, padding: 50 }}>
                Loading Composition Metadata...
            </div>
        );
    }

    return (
        <>
            <Composition
                id="MainAutomator"
                component={Scenes}
                // --- DYNAMIC VALUES FROM JSON METADATA ---
                durationInFrames={compData.durationInFrames}
                fps={compData.fps} 
                width={compData.width}
                height={compData.height}
                defaultProps={{
                    scenario:compData.scenario
                }}
            />
        </>
    );
};
