function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case nr:
      h = ((ng - nb) / d + (ng < nb ? 6 : 0)) / 6;
      break;
    case ng:
      h = ((nb - nr) / d + 2) / 6;
      break;
    case nb:
      h = ((nr - ng) / d + 4) / 6;
      break;
  }

  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

function generateSteps(baseH: number, baseS: number, count: number, hueShift: (i: number) => number): string[] {
  return Array.from({ length: count }, (_, i) => {
    const h = (baseH + hueShift(i) + 1) % 1;
    const s = baseS;
    const l = 0.2 + (i / (count - 1)) * 0.5;
    return hslToHex(h, s, l);
  });
}

export function generateMono(base: string, count = 6): string[] {
  const { h, s } = hexToHSL(base);
  return generateSteps(h, s, count, () => 0);
}

export function generateAnalogous(base: string, count = 5): string[] {
  const { h, s } = hexToHSL(base);
  return generateSteps(h, s, count, (i) => (i - Math.floor(count / 2)) * 0.05);
}

export function generateComplementary(base: string): string[] {
  const { h, s } = hexToHSL(base);
  return [
    hslToHex(h, s, 0.45),
    hslToHex(h, s * 0.4, 0.6),
    hslToHex((h + 0.5) % 1, s, 0.45),
    hslToHex((h + 0.5) % 1, s * 0.4, 0.6),
    hslToHex(h, s * 0.8, 0.85),
    hslToHex((h + 0.5) % 1, s * 0.8, 0.85),
  ];
}

export function generateTriadic(base: string): string[] {
  const { h, s } = hexToHSL(base);
  const colors: string[] = [];
  for (let i = 0; i < 3; i++) {
    const hue = (h + i * (1 / 3)) % 1;
    colors.push(hslToHex(hue, s, 0.4));
    colors.push(hslToHex(hue, s * 0.5, 0.7));
  }
  return colors;
}

export function generateSplitComplementary(base: string): string[] {
  const { h, s } = hexToHSL(base);
  return [
    hslToHex(h, s, 0.45),
    hslToHex((h + 0.42) % 1, s, 0.45),
    hslToHex((h + 0.42) % 1, s * 0.5, 0.65),
    hslToHex((h + 0.58) % 1, s, 0.45),
    hslToHex((h + 0.58) % 1, s * 0.5, 0.65),
    hslToHex(h, s * 0.3, 0.85),
  ];
}

export function generatePalette(
  base: string,
  type: string,
  count: number,
): string[] {
  switch (type) {
    case 'monochromatic':
      return generateMono(base, count);
    case 'analogous':
      return generateAnalogous(base, count);
    case 'complementary':
      return generateComplementary(base);
    case 'triadic':
      return generateTriadic(base);
    case 'split-complementary':
      return generateSplitComplementary(base);
    default:
      return generateMono(base, count);
  }
}

export function adjustColor(
  color: string,
  operation: string,
  amount: number,
): string {
  let { h, s, l } = hexToHSL(color);
  const factor = amount / 100;

  switch (operation) {
    case 'lighten':
      l = Math.min(1, l + l * factor + 0.05);
      break;
    case 'darken':
      l = Math.max(0, l - l * factor - 0.05);
      break;
    case 'saturate':
      s = Math.min(1, s + s * factor + 0.05);
      break;
    case 'desaturate':
      s = Math.max(0, s - s * factor - 0.05);
      break;
  }

  return hslToHex(h, s, l);
}
