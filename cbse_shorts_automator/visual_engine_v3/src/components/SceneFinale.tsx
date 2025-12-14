import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';
import { ShreddingParticleSystem } from './ShreddingParticleSystem';
import { GridShreddingSystem } from './GridShreddingSystem';
import { ThumbnailSlide } from './ThumbnailSlide';
import { CTAPill } from './CTAPill';
import { VisualScenario } from '../types/schema';

// Props passed from SceneContent.tsx
interface SceneFinaleProps {
    scenario: VisualScenario;
    fps: number;
    // Layout Props
    viewportWidth: number;
    height: number;
    // Calculated Layout Positions
    thumbnailFinalY: number;
    THUMBNAIL_WIDTH: number;
    THUMBNAIL_HEIGHT: number;
    ctaPillFinalY: number;
    CTA_PILL_HEIGHT: number;
    // Expl. Card Props for Shredder
    explanationCardCenterY: number;
    explanationCardWidth: number;
    explanationCardHeight: number;
    CARD_COLOR: string;
}

export const SceneFinale: React.FC<SceneFinaleProps> = ({
    scenario,
    fps,
    viewportWidth,
    height,
    thumbnailFinalY,
    THUMBNAIL_WIDTH,
    THUMBNAIL_HEIGHT,
    ctaPillFinalY,
    CTA_PILL_HEIGHT,
    explanationCardCenterY,
    explanationCardWidth,
    explanationCardHeight,
    CARD_COLOR,
}) => {
    const frame = useCurrentFrame();
    const { timeline, assets } = scenario;
    const t_cta_start = timeline.cta.start_time;

    // Determine the visibility of the entire CTA sequence
    const showCTA = frame / fps >= t_cta_start; 

    // Explicit Timings for CTA Elements
    const T_THUMBNAIL_SLIDE_START = t_cta_start + 0.2;
    const T_CTA_REVEAL = t_cta_start + 1.5;

    if (!showCTA) {
        return null;
    }

    // Approximation of ExplCard height for the shredder
    const EXPLANATION_CARD_HEIGHT_APPROX = explanationCardHeight; 

    return (
        <group name="SceneFinale_Container">
            {/* 1. EXPLANATION CARD SHREDDING PARTICLE SYSTEM (t_cta_start + 0.0s) */}
            <GridShreddingSystem
                startTime={t_cta_start}
                cardCenterY={explanationCardCenterY}
                cardWidth={explanationCardWidth}
                cardHeight={EXPLANATION_CARD_HEIGHT_APPROX}
                color={CARD_COLOR}
                fps={fps}
            />

            {/* 2. THUMBNAIL SLIDE (t_cta_start + 0.2s) */}
            <ThumbnailSlide
                imageUrl={assets.thumbnail_url}
                width={THUMBNAIL_WIDTH}
                height={THUMBNAIL_HEIGHT}
                finalY={thumbnailFinalY}
                startTime={T_THUMBNAIL_SLIDE_START}
                fps={fps}
            />

            {/* 3. CTA FLOATING GLASS PILL (t_cta_start + 0.8s) */}
            <CTAPill
                ctaSocial={timeline.cta.social_text}
                ctaLink={timeline.cta.link_text}
                width={THUMBNAIL_WIDTH}
                height={CTA_PILL_HEIGHT}
                finalY={ctaPillFinalY}
                startTime={T_CTA_REVEAL}
                fps={fps}
                fontUrl={assets.font_url}
            />
        </group>
    );
};