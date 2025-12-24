// Constants Implementation
export const TIMING = {
  S1_PRE_SMASH_PAUSE_FRAMES: 10,
  S1_CLICK_DURATION_FRAMES: 7,
  S1_MOVE_DURATION_FRAMES: 30,      // The vertical slide duration
  S1_SMASH_DURATION_FRAMES: 10,     // The duration of the heavy slam
  S1_POST_SMASH_PAUSE_FRAMES: 30,   // Wait after smash before moving up
  S1_EXPLOSION_DURATION: 30,
  REQUIRED_HOLD_DURATION: 2,
  MAX_SEARCH_FRAMES:90,
  S2_PIPES_GROWTH_DURATION: 15,    // How fast the pipes "draw" themselves
  S2_TITLE_POP_DURATION: 12,      // How snappy the title entrance is
  S2_DECODE_FRAMES: 90,           // Speed of the matrix text scramble
  SCENE2_DELAY_PIPES: 0,          // Pipes start immediately at t_title
  SCENE2_DELAY_TITLE: 0.2,        // Title pops 0.2s after pipes start
  SCENE2_DELAY_DECODE: 0.3,
  // NEW: Scene 2 Exit Delays (Relative to t_cta)
  S2_EXIT_DURATION: 0.6,          // seconds for the exit animation
  S2_DELAY_EXIT_BODY: -10,       // Start exiting Body 10 frames BEFORE t_cta
  //S2_DELAY_EXIT_PIPES: 0,        // Pipes exit exactly at t_cta
  S2_HANG_DURATION:0.2,
  S2_DECODE_START_DELAY: 30,  // Frames to wait after card starts opening
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
  S2_TITLE_TOP: 0.10,
  S2_TEXT_BOX_WIDTH: 1.2, 
  S2_TITLE_TO_BODY_GAP_VH: 0.04,
  S2_GAP_BETWEEN_TEXTS_VH: 0.05,     
  S2_FONT_SIZE_VH: 0.06,       
  S2_PADDING_VH: 0.028,         
  S2_BORDER_RADIUS_VH: 2.3,   // Rounded corners relative to height
  S2_TITLE: {
        MAX_WIDTH_PERCENT: 0.90, // 90% of screen width
        MAX_HEIGHT_PERCENT: 0.15, // 15% of screen height
        MIN_HEIGHT_PERCENT: 0.05, // 8% of screen height
        PADDING_FROM_SLATE_BOTTOM: 0.07,  
        BEVEL_SIZE: 0.01,
        FONT_SIZE: .8, // Base unit for calculation
        // NEW: Guardrails for typography
        MIN_FONT_SIZE: 0.07,           // Prevents text from disappearing
        MAX_FONT_SIZE: 0.25,           // Prevents short text from becoming huge
        LINE_HEIGHT_MULT: 1.1,
    },
  S2_PIPES: {
    RADIUS: 0.012,
    GLOW_INTENSITY: 0.8,
    PULSE_SPEED: 0.1,
  },
  S2_BODY_CARD: {
        GAP_FROM_TITLE_BOTTOM: .02,    // Controls distance from Title to Glass Card
        WIDTH_VW: 0.8,                 // 85% of screen width
        PADDING_VH: 0.01,               // Internal padding of the card
    },
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
    TARGET_SLATE_ITEM: { x: 1, y:7, z: 16 },
    TARGET_COORDINATE: { x: 10, y: 5, z: -300 }, // [cite: 145]
    TEXT_SCALE_MAX: 0.15,
};
