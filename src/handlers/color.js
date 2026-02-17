// Color conversion & utility functions

export function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) throw new Error('Invalid hex color');
  const num = parseInt(hex, 16);
  if (isNaN(num)) throw new Error('Invalid hex color');
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgbHelper(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function hslToRgb(h, s, l) {
  return hslToRgbHelper(h, s, l);
}

export function hslToHex(h, s, l) {
  const { r, g, b } = hslToRgbHelper(h, s, l);
  return rgbToHex(r, g, b);
}

export function contrastRatio(color1, color2) {
  // color1, color2 are {r, g, b}
  const luminance = ({ r, g, b }) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  const l1 = luminance(color1);
  const l2 = luminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  const ratio = parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
  return {
    ratio,
    aa: { normal: ratio >= 4.5, large: ratio >= 3 },
    aaa: { normal: ratio >= 7, large: ratio >= 4.5 },
  };
}

export function lighten(r, g, b, amount) {
  const hsl = rgbToHsl(r, g, b);
  hsl.l = Math.min(100, hsl.l + amount);
  return hslToRgbHelper(hsl.h, hsl.s, hsl.l);
}

export function darken(r, g, b, amount) {
  const hsl = rgbToHsl(r, g, b);
  hsl.l = Math.max(0, hsl.l - amount);
  return hslToRgbHelper(hsl.h, hsl.s, hsl.l);
}

export function complementary(r, g, b) {
  const hsl = rgbToHsl(r, g, b);
  const compH = (hsl.h + 180) % 360;
  const comp = hslToRgbHelper(compH, hsl.s, hsl.l);
  return { ...comp, hex: rgbToHex(comp.r, comp.g, comp.b) };
}

export function palette(r, g, b, type = 'analogous') {
  const hsl = rgbToHsl(r, g, b);
  const makeColor = (h) => {
    const rgb = hslToRgbHelper((h + 360) % 360, hsl.s, hsl.l);
    return { ...rgb, hex: rgbToHex(rgb.r, rgb.g, rgb.b) };
  };

  switch (type) {
    case 'complementary':
      return [makeColor(hsl.h), makeColor(hsl.h + 180)];
    case 'triadic':
      return [makeColor(hsl.h), makeColor(hsl.h + 120), makeColor(hsl.h + 240)];
    case 'split-complementary':
      return [makeColor(hsl.h), makeColor(hsl.h + 150), makeColor(hsl.h + 210)];
    case 'tetradic':
      return [makeColor(hsl.h), makeColor(hsl.h + 90), makeColor(hsl.h + 180), makeColor(hsl.h + 270)];
    case 'analogous':
    default:
      return [makeColor(hsl.h - 30), makeColor(hsl.h), makeColor(hsl.h + 30)];
  }
}

export function parseColor(input) {
  // Parse hex
  if (typeof input === 'string') {
    const hex = input.replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) {
      const rgb = hexToRgb(input);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      return { hex: rgbToHex(rgb.r, rgb.g, rgb.b), rgb, hsl };
    }
    // Parse rgb(r, g, b)
    const rgbMatch = input.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      const hsl = rgbToHsl(r, g, b);
      return { hex: rgbToHex(r, g, b), rgb: { r, g, b }, hsl };
    }
    // Parse hsl(h, s%, l%)
    const hslMatch = input.match(/^hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)$/i);
    if (hslMatch) {
      const [, h, s, l] = hslMatch.map(Number);
      const rgb = hslToRgbHelper(h, s, l);
      return { hex: rgbToHex(rgb.r, rgb.g, rgb.b), rgb, hsl: { h, s, l } };
    }
  }
  throw new Error('Cannot parse color. Use hex (#ff0000), rgb(255,0,0), or hsl(0,100%,50%)');
}
