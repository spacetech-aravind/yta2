import { interpolate, Easing } from 'remotion';

// Hardcoded Spring Configs / Easings

export const easings = {
    elasticOut: Easing.elastic(1),
    backOut: Easing.back(2), // [cite: 172] Heavy spring
    //searchPath: Easing.bezier(0.25, 0.1, 0.25, 1), // Non-linear search
    searchPath: (t: number) => 1 - Math.pow(1 - t, 4)
};

export const remap = (value: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number) => {
    return outputMin + ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin);
};
