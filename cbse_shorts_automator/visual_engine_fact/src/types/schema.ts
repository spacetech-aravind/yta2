export interface Resolution {
  w: number;
  h: number;
}

export interface Config {
  resolution: Resolution;
  fps: number;
}

export interface Meta {
  theme_seed: number;
  config: Config;
}

export interface Assets {
  video_src: string;
  thumb_src: string;
  logo_src: string;
  audio_track: string;
}

export interface Timings {
  t_title: number;
  t_details: number;
  detailsAudioDuration: number;
  t_cta: number;
  t_outro: number;
  total_duration: number;
}

export interface CtaContent {
  social_text: string;
  link_text: string;
}

export interface OutroContent {
  usp_line_1: string;
  usp_line_2: string;
}

export interface Content {
  hook_3d: string;
  fact_title: string;
  fact_body_html: string;
  cta_content: CtaContent;
  outro_content: OutroContent;
  usp_badge_text: string;
  watermark_text: string;
  copyright_text: string;
}

export interface FactScenario {
  meta: Meta;
  assets: Assets;
  timings: Timings;
  content: Content;
}