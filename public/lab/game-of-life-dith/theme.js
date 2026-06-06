// theme.js
const THEMES = [
  {
    id: 'theme-poetic-light',
    uiAccent: '#D32F2F',
    uiAccentText: '#FFF8e7',
    ditherFg: [0,0,0],
    ditherBg: [255,248,231],
    invert: false,
    gol: false
  },
  {
    id: 'theme-systemic-light',
    uiAccent: '#1976D2',
    uiAccentText: '#FFF8e7',
    ditherFg: [255,255,255], // inverted mapping for this light variant
    ditherBg: [0,0,0],
    invert: true,
    gol: false
  },
  {
    id: 'theme-poetic-dark',
    uiAccent: '#FFF8e7',
    uiAccentText: '#D32F2F',
    ditherFg: [0,31,63],
    ditherBg: [255,65,54],
    invert: true,
    gol: true
  },
  {
    id: 'theme-systemic-dark',
    uiAccent: '#FFF8e7',
    uiAccentText: '#001f3f',
    ditherFg: [255,65,54],
    ditherBg: [0,31,63],
    invert: true,
    gol: true
  },
  {
    id: 'theme-cyan-dark',
    uiAccent: '#00FFFF',
    uiAccentText: '#0000FF',
    ditherFg: [0,255,255],
    ditherBg: [0,0,255],
    invert: true,
    gol: true
  },
  {
    id: 'theme-cyan-light',
    uiAccent: '#0000FF',
    uiAccentText: '#00FFFF',
    ditherFg: [0,0,255],
    ditherBg: [0,255,255],
    invert: true,
    gol: true
  },
  {
    id: 'theme-white-invert',
    uiAccent: '#D32F2F',
    uiAccentText: '#000000',
    ditherFg: [0,0,0],       // black normally
    ditherBg: [255,255,255], // white normally
    invert: true,            // means palette will be swapped to create a true invert
    gol: false
  }
];

function getTheme(index) {
  return THEMES[index % THEMES.length];
}

