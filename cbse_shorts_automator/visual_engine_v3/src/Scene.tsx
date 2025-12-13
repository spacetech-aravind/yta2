import React, { Suspense } from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Canvas, useThree } from '@react-three/fiber';
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill } from 'remotion';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { VisualScenario } from './types/schema';
import { getTheme, getVariant } from './utils/theme';
import { ZONES } from './utils/animation';
import { ThreeStage } from './components/ThreeStage';
import { ParticleSystem } from './components/ParticleSystem';
import { NanoText } from './components/Typography';
import { Watermark } from './components/Watermark';
import { AnimatedHook } from './components/AnimatedHook';
import { TypewriterQuestion, estimateQuestionHeight } from './components/TypewriterQuestion';
import { OptionCard } from './components/OptionCard';



interface SceneProps {
    scenario: VisualScenario;
}

// Internal component to access the R3F Context (useThree)
const SceneContent: React.FC<SceneProps> = ({ scenario }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { height } = useThree((state) => state.viewport); // Dynamic Viewport Height
    const currentTime = frame / fps;

    // --- HELPER: NVU TO WORLD COORDINATES ---
    // NVU 0.0 is Bottom (-height/2)
    // NVU 1.0 is Top (+height/2)
    const nvuToWorld = (nvu: number) => (nvu - 0.5) * height ;

    const theme = getTheme(scenario.meta.seed);
    const variant = getVariant(scenario.meta.seed);
    const { timeline } = scenario;

    // --- DYNAMIC LAYOUT CALCULATIONS ---
    // 1. Stage Center: Average of Top (1.0) and Bridge Top (0.65)
    const stageY = nvuToWorld((ZONES.STAGE_TOP + ZONES.STAGE_BOTTOM) / 2);
    
    // 2. Question Anchor: Slightly above the bottom of the Bridge zone
    //const questionY = nvuToWorld(ZONES.BRIDGE_BOTTOM + 0.03); 
    
    // 3. Options Start: Top of Interaction Zone
    //const optionsStartY = nvuToWorld(ZONES.INTERACTION_TOP - 0.05);

    // --- STATE MACHINE ---
    const showHook = currentTime < timeline.quiz.question.start_time;
    const showQuestion = currentTime >= timeline.quiz.question.start_time;
    const showOptions = currentTime >= timeline.quiz.options[0].start_time-0.4;
    const showAnswer = currentTime >= timeline.answer.start_time;
    const showCTA = currentTime >= timeline.cta.start_time;

    // --- CAMERA ANIMATION ---
    const camZ = interpolate(frame, [0, 50], [6, 5], { extrapolateRight: 'clamp' });

    const viewportWidth = height * (9/16); // Assuming Vertical 9:16 Video
    const questionText = timeline.quiz.question.text;
    
    // 1. NEW SYMMETRICAL SAFE ZONE (10% - 90%)
    // Left: 0.1, Right: 0.9
    // Center: 0.5 (Perfectly centered, no offset needed)
    const SAFE_OFFSET_X = 0; 
    
    // Width: 0.9 - 0.1 = 0.8 (80% of screen width)
    const SAFE_MAX_WIDTH = viewportWidth * 0.80;
    // 2. DYNAMIC HEIGHT CALCULATION (Auto-Stack)
    const questionHeight = estimateQuestionHeight(questionText, SAFE_MAX_WIDTH, viewportWidth);
    
    // 3. ANCHOR POINTS
    // Question Center Y
    const questionY = nvuToWorld(ZONES.BRIDGE_BOTTOM + 0.03); 
    
    // Options Start Y: Question Y - Half Question Height - Padding
    const GAP = height * 0.03; // 3% vertical gap
    const optionsStartY = questionY - (questionHeight / 2) - GAP;

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, camZ]} fov={50} />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

            {/* 1. PARTICLE SYSTEM */}
            
            <ParticleSystem variant={variant} color={theme.primary} />

            {/* 2. THE STAGE (Dynamic Positioning) */}
            <group position={[0, stageY, 0]}>
                <Suspense fallback={null}>
                     <ThreeStage videoUrl={scenario.assets.video_source_url} overlayProgress={0.2} />
                </Suspense>
            </group>

            {/* 3. THE BRIDGE (Question Card) */}
            {showQuestion && (
                <TypewriterQuestion
                    text={questionText}
                    theme={theme}
                    viewportWidth={viewportWidth}
                    maxWidth={SAFE_MAX_WIDTH} // Pass strict width
                    startTime={timeline.quiz.question.start_time}
                    finishTime={timeline.quiz.options[0].start_time}
                    position={[SAFE_OFFSET_X, questionY, 0]} // Apply Offset
                />
            )}

            {/* 4. OPTION CARDS (Centered, Synced, Sliding) */}
            {showOptions && timeline.quiz.options.map((opt, i) => {
                // State Logic
                let cardState: 'neutral' | 'correct' | 'dimmed' | 'wrong' = 'neutral';
                if (showAnswer) {
                    cardState = opt.id === timeline.answer.correct_option_id 
                        ? 'correct' 
                        : 'wrong';
                }

                // Layout Constants
                const cardHeight = height * 0.09; 
                const cardGap = height * 0.02;
                
                // Final resting Y position for this card
                const finalYPos = optionsStartY - (cardHeight/2) - (i * (cardHeight + cardGap));

                // x=0 for center, z=0 for base depth
                const positionZ = 0; 
                
                return (
                    <OptionCard
                        key={opt.id}
                        text={opt.text}
                        state={cardState}
                        theme={theme}
                        width={SAFE_MAX_WIDTH} 
                        height={cardHeight}
                        landingTime={opt.start_time} // SYNC TRIGGER
                        finalY={finalYPos} // FINAL RESTING Y
                        positionZ={positionZ} // BASE Z
                    />
                );
            })}
            {/* 5. HOOK (Overlay) - DYNAMIC ANIMATION */}
            {showHook && (
                <AnimatedHook 
                    text={timeline.hook.text_content}
                    seed={scenario.meta.seed+0}
                    theme={theme}
                    fontSize={height * 0.06}
                    fontUrl={scenario.assets.font_url}
                />
            )}

            <Environment preset="city" />
        </>
    );
};

export const Scene: React.FC<SceneProps> = ({ scenario }) => {
    const theme = getTheme(scenario.meta.seed);
    const { width, height } = useVideoConfig();
    const variant = getVariant(scenario.meta.seed);
    console.log("ParticleSystem Variant:", variant);

    console.log(theme.bg[0],theme.bg[1])

    return (
        
    <div style={{ width: '100%', height: '100%', background: `radial-gradient(circle, ${theme.bg[0]}, ${theme.bg[1]})` }}>
            <ThreeCanvas shadows dpr={[1, 2]} 
            width={width} 
            height={height}            
            >
                
                <SceneContent scenario={scenario} />
            </ThreeCanvas>
            {/* Layer 100: The Ghost UI Overlay */}
            <Watermark scenario={scenario} />
        </div>
       
    );
};