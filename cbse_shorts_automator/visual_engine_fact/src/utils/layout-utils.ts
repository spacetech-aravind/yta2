// src/utils/layout-utils.ts
import { LAYOUT } from '../constants';

export const estimateExplanationLayout = (
    text: string, 
    viewportWidth: number, 
    fontSizeInp: number
) => {
    const padding = viewportWidth * 0.02;
    const textWidth = viewportWidth - (padding * 2);
    const maxLines = 2;
    
    let charsPerLine = Math.ceil(text.length / maxLines);
    const MaxCharWidth = textWidth / charsPerLine;
    const CharWidthFactor = 0.682; 
    let fontSize = Math.min(MaxCharWidth / CharWidthFactor, fontSizeInp); 
    fontSize = Math.max(
        LAYOUT.S2_TITLE.MIN_FONT_SIZE, 
        Math.min(fontSize, LAYOUT.S2_TITLE.MAX_FONT_SIZE)
    );
    //const fontSize = Math.min(MaxCharWidth / CharWidthFactor, fontSizeInp); 
    const avgCharWidth = fontSize * CharWidthFactor;
    //const lineHeight = fontSize +0.1;
    const lineHeight = fontSize * LAYOUT.S2_TITLE.LINE_HEIGHT_MULT;
    charsPerLine = textWidth / avgCharWidth;
    const lines = Math.ceil(text.length / charsPerLine);

    return { fontSize, textWidth, lineHeight, padding, avgCharWidth,lines };
};