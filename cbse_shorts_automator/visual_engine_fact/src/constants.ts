// Constants Implementation
export const TIMING = {
  S1_PRE_SMASH_PAUSE_FRAMES: 10,
  S1_CLICK_DURATION_FRAMES: 7,
  S1_MOVE_DURATION_FRAMES: 30,      // The vertical slide duration
  S1_SMASH_DURATION_FRAMES: 20,     // The duration of the heavy slam
  S1_POST_SMASH_PAUSE_FRAMES: 30,   // Wait after smash before moving up
  S1_EXPLOSION_DURATION: 60,
  REQUIRED_HOLD_DURATION: 2,
  MAX_SEARCH_FRAMES:60,
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
  S1_SLATE_WIDTH: 0.75,             // 3D units width
  S1_TEXT_DISTANCE: 2,              // Distance of hook text from camera
  S1_MARGIN_TOP: 0.05,              // 5% from top
  MARGIN_X: 0.15,
  MARGIN_Y_BOTTOM_DEAD: 0.20,
  S2_SLATE_TOP: 0.05,
  S2_TITLE_TOP: 0.20,
  S2_BODY_TOP: 0.45,
  S3_CTA_CENTER_Y: 0.65,
  S3_BADGE_OFFSET_X: 0.25
};

// Scene 1 specific constants from visual spec
export const SCENE_1_CONFIG = {
    TUNNEL_LENGTH: 200,
    FOG_DENSITY: 0.02,
    GRID_X_COUNT: 5,
    GRID_Y_COUNT: 9,
    GRID_Z_COUNT: 20,
    BOX_W_FACT:0.5,
    BOX_H_FACT:0.5,
    TARGET_SLATE_ITEM: { x: 3, y:1, z: 16 },
    TARGET_COORDINATE: { x: 10, y: 5, z: -300 }, // [cite: 145]
    TEXT_SCALE_MAX: 0.2,
};
