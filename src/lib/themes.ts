// Color theme definitions
export interface ColorTheme {
    id: string;
    name: string;
    colors: {
        stops: [number, number, number, number, number]; // 5 hue values
        saturation: number;
        baseLightness: number;
    };
    preview: string; // CSS gradient for preview
}

export const colorThemes: ColorTheme[] = [
    {
        id: 'sunset',
        name: 'Sunset',
        colors: {
            stops: [0.95, 0.05, 0.6, 0.75, 0.88],  // pink -> orange -> blue -> purple -> magenta
            saturation: 0.9,
            baseLightness: 0.12
        },
        preview: 'linear-gradient(90deg, #ff6b9d, #ff8a50, #4a9eff, #9d4edd, #ff6bcb)'
    },
    {
        id: 'ocean',
        name: 'Ocean',
        colors: {
            stops: [0.5, 0.55, 0.6, 0.65, 0.7],  // cyan -> teal -> blue -> indigo -> purple
            saturation: 0.85,
            baseLightness: 0.1
        },
        preview: 'linear-gradient(90deg, #00d4ff, #00a3cc, #0066ff, #4a4eff, #8b5cf6)'
    },
    {
        id: 'aurora',
        name: 'Aurora',
        colors: {
            stops: [0.3, 0.45, 0.55, 0.7, 0.85],  // green -> teal -> cyan -> purple -> pink
            saturation: 0.9,
            baseLightness: 0.11
        },
        preview: 'linear-gradient(90deg, #00ff88, #00d4aa, #00d4ff, #8b5cf6, #ff6bcb)'
    },
    {
        id: 'ember',
        name: 'Ember',
        colors: {
            stops: [0.0, 0.03, 0.06, 0.95, 0.9],  // red -> orange -> yellow-ish -> pink -> magenta
            saturation: 0.95,
            baseLightness: 0.12
        },
        preview: 'linear-gradient(90deg, #ff4444, #ff6b35, #ff8c00, #ff6b9d, #ff3399)'
    },
    {
        id: 'cosmic',
        name: 'Cosmic',
        colors: {
            stops: [0.75, 0.8, 0.85, 0.65, 0.7],  // purple -> magenta -> pink-ish -> blue -> indigo
            saturation: 0.88,
            baseLightness: 0.1
        },
        preview: 'linear-gradient(90deg, #9d4edd, #c77dff, #ff6bcb, #4a9eff, #6366f1)'
    },
    {
        id: 'monochrome',
        name: 'Mono',
        colors: {
            stops: [0.0, 0.0, 0.0, 0.0, 0.0],  // all white/gray
            saturation: 0.0,
            baseLightness: 0.15
        },
        preview: 'linear-gradient(90deg, #888, #aaa, #fff, #aaa, #888)'
    }
];

export function getDefaultTheme(): ColorTheme {
    return colorThemes[2]; // Aurora
}
