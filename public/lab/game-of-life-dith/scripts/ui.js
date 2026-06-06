// scripts/ui.js
import { seedGolFromDither } from '../gol.js';

export function initDomBindings(videoElement, themes, ditherEffect, themeCallback) {
    const themeSelector = document.getElementById('theme-selector');
    themeSelector.addEventListener('change', e => {
        const selectedTheme = e.target.value;
        applyTheme(selectedTheme, themes, ditherEffect);
        themeCallback(selectedTheme);
    });

    document.getElementById('seed-btn').addEventListener('click', () => {
        seedGolFromDither(ditherEffect.image);
    });
}

export function applyTheme(themeName, themes, ditherEffect) {
    document.documentElement.className = themeName;
    const theme = themes[themeName];
    if (theme) {
        ditherEffect.palette = theme.palette;
    }
}
