const FONT_STACKS = {
  sans: '"Helvetica Neue", "Segoe UI", Arial, "Microsoft YaHei UI", "Microsoft YaHei", "PingFang SC", sans-serif',
  serif: '"Times New Roman", Georgia, Cambria, "Songti SC", SimSun, serif',
  mono: '"Courier New", Consolas, Menlo, monospace',
};

const KNOWN_FONTS = [
  [/times[\s-]*new[\s-]*roman|timesnewroman|times-roman/i, 'Times New Roman', 'serif'],
  [/\btimes\b|timesmt|timesps/i, 'Times New Roman', 'serif'],
  [/georgia/i, 'Georgia', 'serif'],
  [/garamond/i, 'Garamond', 'serif'],
  [/cambria/i, 'Cambria', 'serif'],
  [/palatino/i, 'Palatino Linotype', 'serif'],
  [/book[\s-]*antiqua/i, 'Book Antiqua', 'serif'],
  [/bookman/i, 'Bookman Old Style', 'serif'],
  [/century[\s-]*schoolbook/i, 'Century Schoolbook', 'serif'],
  [/simsun|songti|songti sc|nsimsun|宋体|宋/i, 'SimSun', 'serif'],
  [/mincho|mingliu|ming/i, 'MingLiU', 'serif'],
  [/arial/i, 'Arial', 'sans'],
  [/helvetica/i, 'Helvetica', 'sans'],
  [/calibri/i, 'Calibri', 'sans'],
  [/segoe[\s-]*ui/i, 'Segoe UI', 'sans'],
  [/roboto/i, 'Roboto', 'sans'],
  [/open[\s-]*sans/i, 'Open Sans', 'sans'],
  [/lato/i, 'Lato', 'sans'],
  [/montserrat/i, 'Montserrat', 'sans'],
  [/inter/i, 'Inter', 'sans'],
  [/source[\s-]*sans/i, 'Source Sans 3', 'sans'],
  [/noto[\s-]*sans/i, 'Noto Sans', 'sans'],
  [/noto[\s-]*serif/i, 'Noto Serif', 'serif'],
  [/yahei|微软雅黑/i, 'Microsoft YaHei', 'sans'],
  [/pingfang|苹方/i, 'PingFang SC', 'sans'],
  [/simhei|heiti|黑体/i, 'SimHei', 'sans'],
  [/kaiti|楷体/i, 'KaiTi', 'serif'],
  [/fangsong|仿宋/i, 'FangSong', 'serif'],
  [/courier/i, 'Courier New', 'mono'],
  [/consolas/i, 'Consolas', 'mono'],
  [/menlo/i, 'Menlo', 'mono'],
  [/monaco/i, 'Monaco', 'mono'],
  [/monospace|\bmono\b/i, 'Monospace', 'mono'],
  [/verdana/i, 'Verdana', 'sans'],
  [/tahoma/i, 'Tahoma', 'sans'],
  [/trebuchet/i, 'Trebuchet MS', 'sans'],
  [/candara/i, 'Candara', 'sans'],
  [/corbel/i, 'Corbel', 'sans'],
  [/futura/i, 'Futura', 'sans'],
  [/gill[\s-]*sans/i, 'Gill Sans', 'sans'],
];

const ACTUAL_FONT_RULES = [
  [/microsoft\s*yahei\s*light/i, 'Microsoft YaHei Light', 'sans'],
  [/microsoft\s*yahei|msyh/i, 'Microsoft YaHei', 'sans'],
  [/simhei/i, 'SimHei', 'sans'],
  [/simsun|nsimsun/i, 'SimSun', 'serif'],
  [/songti/i, 'Songti SC', 'serif'],
  [/pingfang/i, 'PingFang SC', 'sans'],
  [/kaiti/i, 'KaiTi', 'serif'],
  [/fangsong/i, 'FangSong', 'serif'],
  [/times[\s-]*new[\s-]*roman|timesnewroman|times-roman|\btimes\b|timesmt|timesps/i, 'Times New Roman', 'serif'],
  [/georgia/i, 'Georgia', 'serif'],
  [/arial/i, 'Arial', 'sans'],
  [/helvetica/i, 'Arial', 'sans'],
  [/calibri/i, 'Calibri', 'sans'],
  [/cambria/i, 'Cambria', 'serif'],
  [/candara/i, 'Candara', 'sans'],
  [/corbel/i, 'Corbel', 'sans'],
  [/constantia/i, 'Constantia', 'serif'],
  [/consolas/i, 'Consolas', 'mono'],
  [/courier/i, 'Courier New', 'mono'],
  [/verdana/i, 'Verdana', 'sans'],
  [/tahoma/i, 'Tahoma', 'sans'],
  [/trebuchet/i, 'Trebuchet MS', 'sans'],
  [/segoe[\s-]*ui/i, 'Segoe UI', 'sans'],
  [/roboto/i, 'Roboto', 'sans'],
  [/open[\s-]*sans/i, 'Open Sans', 'sans'],
  [/source[\s-]*sans/i, 'Source Sans 3', 'sans'],
  [/noto[\s-]*sans/i, 'Noto Sans', 'sans'],
  [/noto[\s-]*serif/i, 'Noto Serif', 'serif'],
  [/dejavu[\s-]*sans/i, 'DejaVu Sans', 'sans'],
  [/dejavu[\s-]*serif/i, 'DejaVu Serif', 'serif'],
  [/lato/i, 'Lato', 'sans'],
  [/montserrat/i, 'Montserrat', 'sans'],
  [/\binter\b/i, 'Inter', 'sans'],
  [/futura/i, 'Futura', 'sans'],
  [/gill[\s-]*sans/i, 'Gill Sans', 'sans'],
  [/menlo/i, 'Menlo', 'mono'],
  [/monaco/i, 'Monaco', 'mono'],
];

const WEIGHT_RULES = [
  [/extra[\s-]*black|ultra[\s-]*black|black|heavy/i, 900, 'Black'],
  [/extra[\s-]*bold|ultra[\s-]*bold/i, 800, 'ExtraBold'],
  [/semi[\s-]*bold|demi[\s-]*bold|\bdemi\b/i, 600, 'SemiBold'],
  [/bold/i, 700, 'Bold'],
  [/medium/i, 500, 'Medium'],
  [/semi[\s-]*light|demi[\s-]*light/i, 350, 'SemiLight'],
  [/extra[\s-]*light|ultra[\s-]*light/i, 200, 'ExtraLight'],
  [/light/i, 300, 'Light'],
  [/\bthin\b|hairline/i, 100, 'Thin'],
  [/regular|book|normal|roman/i, 400, 'Regular'],
];

const WEIGHT_NAMES = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  350: 'SemiLight',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isCjkChar(char = '') {
  return /[\u2e80-\u2fff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/.test(char);
}

export function isCjkText(text = '') {
  return isCjkChar(text.trim()[0] || '');
}

function cleanFontName(raw = '') {
  return String(raw)
    .replace(/^[A-Z]{6}\+/, '')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function genericCategory(textStyle = {}) {
  const family = String(textStyle?.fontFamily || '').toLowerCase();
  if (/monospace|\bmono\b/.test(family)) return 'mono';
  if (/sans[-\s]*serif/.test(family)) return 'sans';
  if (/\bserif\b/.test(family)) return 'serif';
  return null;
}

function categoryForBaseFont(baseFont = '') {
  for (const [pattern, , category] of ACTUAL_FONT_RULES) {
    if (pattern.test(baseFont)) return category;
  }
  if (/mono|courier|consol/i.test(baseFont)) return 'mono';
  if (/serif|times|georgia|cambria|song|ming|宋|mincho/i.test(baseFont)) return 'serif';
  return 'sans';
}

function fontFaceForBaseFont(baseFont = '') {
  for (const [pattern, label] of ACTUAL_FONT_RULES) {
    if (pattern.test(baseFont)) return label;
  }
  const cleaned = cleanFontName(baseFont)
    .replace(/(?:MT|PSMT|PS|Regular|Roman)$/i, '')
    .split('-')[0]
    .trim();
  return cleaned && !/^(font|unknown|embedded)$/i.test(cleaned) ? cleaned : null;
}

function widthScoreForFont(font, samples, textStyle) {
  const meta = parseFontMeta(font.baseFont, textStyle);
  const family = meta.fontFace;
  if (!family || /^(Sans Serif|Serif|Monospace)$/i.test(family)) return Infinity;
  if (document.fonts?.check && !document.fonts.check(`12px "${family}"`)) return Infinity;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${meta.italic ? 'italic' : 'normal'} ${meta.weight || 400} 100px "${family}"`;
  let error = 0;
  let count = 0;
  for (const sample of samples) {
    if (!sample.str?.trim() || !Number.isFinite(sample.width) || !sample.width) continue;
    const measured = ctx.measureText(sample.str).width / 100 * (Number(sample.height) || 10);
    if (!Number.isFinite(measured) || measured <= 0) continue;
    error += Math.abs(measured - sample.width) / Math.max(sample.width, 1);
    count += 1;
  }
  return count ? error / count : Infinity;
}

function matchFontsToStyles(styles = {}, pageFonts = [], items = []) {
  const result = {};
  if (!pageFonts?.length) return result;

  for (const [fontName, textStyle] of Object.entries(styles || {})) {
    const styleCategory = genericCategory(textStyle);
    const candidates = [];
    for (const font of pageFonts) {
      if (!Number.isFinite(font.ascent) || !Number.isFinite(font.descent)) continue;
      const baseScore = Math.abs(font.ascent - Number(textStyle.ascent || 0)) +
        Math.abs(font.descent - Number(textStyle.descent || 0));
      if (baseScore > 0.006) continue;
      const fontCategory = categoryForBaseFont(font.baseFont);
      const penalty = styleCategory && styleCategory !== fontCategory ? 0.02 : 0;
      candidates.push({ font, score: baseScore + penalty, baseScore });
    }
    candidates.sort((a, b) => a.score - b.score);
    let best = candidates[0];
    let tied = candidates.filter((candidate) => candidate.score <= best.score + 0.001);

    if (!candidates.length) {
      const samples = items
        .filter((item) => item.fontName === fontName && item.str?.trim() && item.width)
        .slice(0, 8);
      if (!samples.length) continue;
      const hasCjk = samples.some((item) => /[\u3400-\u9fff]/.test(item.str));
      let pool = pageFonts.filter((font) => {
        if (!styleCategory) return true;
        return categoryForBaseFont(font.baseFont) === styleCategory;
      });
      if (hasCjk) {
        const cjkFonts = pool.filter((font) => /yahei|simhei|simsun|song|hei|kai|ming|pingfang|noto[\s-]*(sans|serif)?[\s-]*cjk/i.test(font.baseFont));
        if (cjkFonts.length) pool = cjkFonts;
      }
      let bestFont = null;
      let bestError = Infinity;
      for (const font of pool) {
        const error = widthScoreForFont(font, samples, textStyle);
        if (error < bestError) {
          bestError = error;
          bestFont = font;
        }
      }
      if (!bestFont || !Number.isFinite(bestError) || bestError > 0.22) continue;
      best = { font: bestFont, score: 0 };
      tied = [best];
    } else if (tied.length > 1) {
      const samples = items
        .filter((item) => item.fontName === fontName && item.str?.trim() && item.width)
        .slice(0, 8);
      let bestError = Infinity;
      for (const candidate of tied) {
        const error = widthScoreForFont(candidate.font, samples, textStyle);
        if (error < bestError) {
          bestError = error;
          best = candidate;
        }
      }
    }

    const uniqueWeights = new Set(tied
      .map((candidate) => parseFontMeta(candidate.font.baseFont, textStyle).weight));
    result[fontName] = {
      ...best.font,
      ambiguousWeight: uniqueWeights.size > 1,
    };
  }
  return result;
}

export function parseFontMeta(fontName = '', textStyle = {}, actualFont = null) {
  let family = null;
  let familyLabel = null;
  let fontFace = null;
  let weight = 400;
  let weightName = 'Regular';
  let weightSource = 'fallback';
  let italic = false;
  let raw = cleanFontName(`${fontName || ''} ${textStyle?.fontFamily || ''}`);
  let actualName = '';

  if (actualFont?.baseFont) {
    actualName = cleanFontName(actualFont.baseFont);
    raw = cleanFontName(`${actualName} ${textStyle?.fontFamily || ''}`);
    family = categoryForBaseFont(actualName);
    fontFace = fontFaceForBaseFont(actualName) || null;
    familyLabel = fontFace || (family === 'serif' ? 'Serif' : family === 'mono' ? 'Monospace' : 'Sans Serif');

    for (const [pattern, value, label] of WEIGHT_RULES) {
      if (pattern.test(actualName)) {
        weight = value;
        weightName = label;
        weightSource = 'font-name';
        break;
      }
    }
    if (Number.isFinite(actualFont.weight) && actualFont.weight >= 100 && actualFont.weight <= 900) {
      if (actualFont.weight > weight) {
        weight = actualFont.weight;
        weightName = weightLabelFor(weight);
      }
      weightSource = 'font-name';
    }
    italic = /italic|oblique/i.test(actualName) ||
      Math.abs(Number(actualFont.italicAngle) || 0) > 0.5 ||
      Boolean(actualFont.flags & 64);
  } else {
    const lower = raw.toLowerCase();
    for (const [pattern, label, key] of KNOWN_FONTS) {
      if (pattern.test(raw)) {
        family = key;
        familyLabel = label;
        break;
      }
    }

    if (!family) {
      if (/monospace/i.test(lower)) {
        family = 'mono';
        familyLabel = 'Monospace';
      } else if (/\bserif\b/i.test(lower) && !/sans[-\s]*serif/i.test(lower)) {
        family = 'serif';
        familyLabel = 'Serif';
      } else {
        family = 'sans';
        familyLabel = 'Sans Serif';
      }
    }

    for (const [pattern, value, label] of WEIGHT_RULES) {
      if (pattern.test(raw)) {
        weight = value;
        weightName = label;
        weightSource = 'font-name';
        break;
      }
    }
    italic = /italic|oblique/i.test(raw);
  }

  if (!family) {
    family = 'sans';
    familyLabel = familyLabel || 'Sans Serif';
  }
  if (!fontFace) fontFace = familyLabel;
  if (!familyLabel) familyLabel = fontFace;

  const genericName = /^g_d\d+_f\d+$/i.test(cleanFontName(fontName)) || /^f\d+$/i.test(cleanFontName(fontName));

  return {
    fontName: actualName || cleanFontName(fontName) || 'Embedded font',
    fontFace,
    family,
    familyLabel,
    weight,
    weightName: weightLabelFor(weight),
    weightSource,
    italic,
    genericName: genericName && !actualFont,
    ambiguousWeight: Boolean(actualFont?.ambiguousWeight),
    actual: Boolean(actualFont),
    raw,
  };
}

export function getFontStack(style = {}) {
  const generic = FONT_STACKS[style.family] || FONT_STACKS.sans;
  if (style.fontChoice && style.fontChoice !== 'auto') {
    return FONT_STACKS[style.fontChoice] || generic;
  }
  if (style.fontFace && !/^(Sans Serif|Serif|Monospace)$/i.test(style.fontFace)) {
    const escaped = String(style.fontFace).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}", ${generic}`;
  }
  return generic;
}

export function weightLabelFor(value) {
  return WEIGHT_NAMES[clamp(Math.round(value / 50) * 50, 100, 900)] || 'Regular';
}

function colorDistance(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr * 0.9 + dg * dg * 1.15 + db * db * 0.85);
}

function toHex({ r, g, b }) {
  const value = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${value(r)}${value(g)}${value(b)}`.toUpperCase();
}

export function hexToRgb(hex) {
  let value = String(hex || '').trim().replace(/^#/, '');
  if (value.length === 3) value = value.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(value)) return { r: 27, g: 36, b: 32 };
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function quantKey(r, g, b, step = 16) {
  return `${Math.round(r / step)},${Math.round(g / step)},${Math.round(b / step)}`;
}

function readPixels(canvas, x, y, width, height) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const sx = clamp(Math.floor(x), 0, canvas.width - 1);
  const sy = clamp(Math.floor(y), 0, canvas.height - 1);
  const ex = clamp(Math.ceil(x + width), sx + 1, canvas.width);
  const ey = clamp(Math.ceil(y + height), sy + 1, canvas.height);
  return { data: ctx.getImageData(sx, sy, ex - sx, ey - sy).data, sx, sy, ex, ey };
}

function estimateBackground(canvas, box, scale) {
  const pad = Math.max(4, Math.round(3 * scale));
  const bx = box.x * scale;
  const by = box.y * scale;
  const bw = Math.max(2, box.width * scale);
  const bh = Math.max(2, box.height * scale);
  const outer = {
    x: bx - pad,
    y: by - pad,
    width: bw + pad * 2,
    height: bh + pad * 2,
  };
  const { data, sx, sy, ex, ey } = readPixels(canvas, outer.x, outer.y, outer.width, outer.height);
  const width = ex - sx;
  const height = ey - sy;
  const innerLeft = Math.max(0, Math.round(bx - sx) + 1);
  const innerTop = Math.max(0, Math.round(by - sy) + 1);
  const innerRight = Math.min(width, Math.round(bx + bw - sx) - 1);
  const innerBottom = Math.min(height, Math.round(by + bh - sy) - 1);
  const bands = [];
  const band = Math.max(2, pad);
  bands.push([0, 0, width, Math.min(band, height)]);
  bands.push([0, Math.max(0, height - band), width, height]);
  bands.push([0, 0, Math.min(band, width), height]);
  bands.push([Math.max(0, width - band), 0, width, height]);

  const counts = new Map();
  const samples = [];
  for (const [x1, y1, x2, y2] of bands) {
    for (let y = y1; y < y2; y += 2) {
      for (let x = x1; x < x2; x += 2) {
        if (x >= innerLeft && x <= innerRight && y >= innerTop && y <= innerBottom) continue;
        const i = (y * width + x) * 4;
        const alpha = data[i + 3];
        if (alpha < 20) continue;
        const r = 255 - (255 - data[i]) * (alpha / 255);
        const g = 255 - (255 - data[i + 1]) * (alpha / 255);
        const b = 255 - (255 - data[i + 2]) * (alpha / 255);
        const key = quantKey(r, g, b);
        counts.set(key, (counts.get(key) || 0) + 1);
        samples.push({ r, g, b });
      }
    }
  }

  if (!samples.length) {
    return { color: { r: 255, g: 255, b: 255 }, uniform: true, samples: 1 };
  }

  let bestKey = '';
  let bestCount = -1;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }

  let sr = 0;
  let sg = 0;
  let sb = 0;
  let n = 0;
  const [kr, kg, kb] = bestKey.split(',').map(Number);
  for (const sample of samples) {
    if (
      Math.abs(Math.round(sample.r / 16) - kr) <= 1 &&
      Math.abs(Math.round(sample.g / 16) - kg) <= 1 &&
      Math.abs(Math.round(sample.b / 16) - kb) <= 1
    ) {
      sr += sample.r;
      sg += sample.g;
      sb += sample.b;
      n += 1;
    }
  }

  return {
    color: n
      ? { r: sr / n, g: sg / n, b: sb / n }
      : { r: 255, g: 255, b: 255 },
    uniform: n / samples.length > 0.56,
    samples: samples.length,
  };
}

function detectInkColor(canvas, box, scale, background) {
  const inset = Math.max(0, Math.round(1.2 * scale));
  const x = box.x * scale + inset;
  const y = box.y * scale + inset;
  const w = Math.max(2, box.width * scale - inset * 2);
  const h = Math.max(2, box.height * scale - inset * 2);
  const { data } = readPixels(canvas, x, y, w, h);

  const values = [];
  let maxDistance = 0;
  let total = 0;
  let inkCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 28) continue;
    const pixel = {
      r: 255 - (255 - data[i]) * (alpha / 255),
      g: 255 - (255 - data[i + 1]) * (alpha / 255),
      b: 255 - (255 - data[i + 2]) * (alpha / 255),
    };
    const distance = colorDistance(pixel, background);
    total += 1;
    if (distance > 36) inkCount += 1;
    if (distance > maxDistance) maxDistance = distance;
    if (distance > 30) {
      pixel.distance = distance;
      values.push(pixel);
    }
  }

  if (!values.length || maxDistance < 26) {
    return {
      color: '#1B2420',
      contrast: 0,
      density: 0,
      confidence: 0.15,
    };
  }

  const thresholds = [0.97, 0.94, 0.9, 0.84].map((ratio) => Math.max(50, maxDistance * ratio));
  let core = [];
  for (const threshold of thresholds) {
    core = values.filter((pixel) => pixel.distance >= threshold);
    if (core.length >= 3) break;
  }
  if (!core.length) core = values.slice().sort((a, b) => b.distance - a.distance).slice(0, 3);

  let r = 0;
  let g = 0;
  let b = 0;
  let weight = 0;
  const coreCount = core.length;
  for (const pixel of core) {
    const w = Math.pow(pixel.distance, 5);
    r += pixel.r * w;
    g += pixel.g * w;
    b += pixel.b * w;
    weight += w;
  }

  const color = weight
    ? toHex({ r: r / weight, g: g / weight, b: b / weight })
    : toHex(values.reduce((acc, pixel) => ({
      r: acc.r + pixel.r,
      g: acc.g + pixel.g,
      b: acc.b + pixel.b,
    }), { r: 0, g: 0, b: 0 }));
  const rgb = hexToRgb(color);
  const contrast = colorDistance(rgb, background);
  const density = total ? inkCount / total : 0;
  const confidence = clamp((maxDistance / 360) * 0.65 + (coreCount / Math.max(1, values.length)) * 0.35, 0.2, 0.98);

  return { color, contrast, density, confidence, inkCount, totalPixels: total };
}

export function detectBlockAppearance(canvas, block, scale) {
  const bg = estimateBackground(canvas, block, scale);
  const ink = detectInkColor(canvas, block, scale, bg.color);

  let weight = block.fontMeta.weight;
  let weightText = block.fontMeta.weightName;
  let weightSource = block.fontMeta.weightSource;
  const generic = block.fontMeta.genericName || block.fontMeta.ambiguousWeight;

  if (generic && ink.density) {
    const asciiRatio = (block.text.match(/[A-Za-z0-9]/g) || []).length / Math.max(1, block.text.length);
    let visualWeight = 400;
    if (asciiRatio > 0.55) {
      if (ink.density > 0.44) visualWeight = 700;
      else if (ink.density > 0.37) visualWeight = 600;
      else if (ink.density > 0.335) visualWeight = 500;
      else if (ink.density < 0.095) visualWeight = 300;
    } else if (ink.density > 0.5) {
      visualWeight = 700;
    } else if (ink.density > 0.44) {
      visualWeight = 600;
    } else if (ink.density > 0.385) {
      visualWeight = 500;
    }
    if (visualWeight !== 400) {
      weight = visualWeight;
      weightText = weightLabelFor(visualWeight);
      weightSource = 'visual';
    }
  }

  return {
    color: ink.color,
    background: toHex(bg.color),
    backgroundRgb: bg.color,
    uniformBackground: bg.uniform,
    contrast: ink.contrast,
    confidence: ink.confidence,
    density: ink.density,
    weight,
    weightName: weightText,
    weightSource,
  };
}

function textStyleForItem(item, textContent, fontMap) {
  const meta = parseFontMeta(
    item.fontName,
    textContent.styles?.[item.fontName],
    fontMap?.[item.fontName] || null
  );
  return meta;
}

function styleKey(style) {
  return `${style.family}|${Math.round(style.weight / 100)}|${style.italic ? 1 : 0}`;
}

function buildLineText(items) {
  let text = '';
  let prevRight = null;
  let prevFont = 0;
  let prevSingleUpper = false;
  for (const item of items) {
    const piece = String(item.str || '');
    if (!piece) continue;
    const singleUpper = /^[A-Z]$/.test(piece.trim());
    if (!text) {
      text = piece;
    } else {
      const gap = prevRight == null ? 0 : item.x - prevRight;
      const tightLetters = prevSingleUpper && singleUpper && gap < Math.max(prevFont, item.fontSize) * 0.4;
      const spaceThreshold = tightLetters
        ? Math.max(2.5, Math.min(prevFont || item.fontSize, item.fontSize) * 0.4)
        : Math.max(1.2, Math.min(prevFont || item.fontSize, item.fontSize) * 0.17);
      const startsTight = /^[,.;:!?，。；：！？、）】》”’]/.test(piece);
      if (gap > spaceThreshold && !/\s$/.test(text) && !startsTight) text += ' ';
      text += piece;
    }
    prevRight = item.x + item.width;
    prevFont = item.fontSize;
    prevSingleUpper = singleUpper;
  }
  return text.replace(/[ \t]+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
}

function makeSegment(items, pageWidth, pageHeight) {
  items = [...items].sort((a, b) => a.x - b.x);
  const text = buildLineText(items);
  if (!text) return null;

  const left = Math.min(...items.map((item) => item.x));
  const right = Math.max(...items.map((item) => item.x + item.width));
  const top = Math.min(...items.map((item) => item.top));
  const bottom = Math.max(...items.map((item) => item.bottom));
  const baseline = items.reduce((sum, item) => sum + item.baseline * item.textLength, 0) /
    Math.max(1, items.reduce((sum, item) => sum + item.textLength, 0));
  const fontSize = items.reduce((sum, item) => sum + item.fontSize * item.textLength, 0) /
    Math.max(1, items.reduce((sum, item) => sum + item.textLength, 0));

  const counts = new Map();
  for (const item of items) {
    const key = styleKey(item.fontMeta);
    const entry = counts.get(key) || { count: 0, meta: item.fontMeta };
    entry.count += item.textLength;
    counts.set(key, entry);
  }
  let dominant = null;
  for (const entry of counts.values()) {
    if (!dominant || entry.count > dominant.count) dominant = entry;
  }

  const style = dominant?.meta || items[0].fontMeta;
  return {
    text,
    items,
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
    bottom,
    baseline,
    fontSize,
    fontMeta: style,
    weight: style.weight,
    italic: style.italic,
    family: style.family,
    hasEOL: items[items.length - 1]?.hasEOL || false,
    pageWidth,
    pageHeight,
  };
}

function canMergeLines(block, line) {
  if (!block || !line) return false;
  const debug = globalThis.__FOLIO_GROUP_DEBUG;
  const reject = (reason) => {
    if (debug) console.debug('[group] reject', reason, block.text.slice(0, 30), '->', line.text.slice(0, 30));
    return false;
  };
  if (block.family !== line.family) return reject('family');
  if (block.italic !== line.italic) return reject('italic');
  if (Math.abs(block.weight - line.weight) > 280) return reject('weight');
  const sizeRatio = line.fontSize / Math.max(1, block.fontSize);
  if (sizeRatio < 0.8 || sizeRatio > 1.22) return reject('size');

  const vGap = line.y - block.bottom;
  const maxGap = Math.max(3.2, Math.min(block.fontSize, line.fontSize) * 0.95);
  if (vGap > maxGap) return reject(`vGap ${vGap.toFixed(2)} > ${maxGap.toFixed(2)}`);
  if (vGap < -Math.max(4, line.fontSize * 0.95)) return reject(`overlap ${vGap.toFixed(2)}`);

  const overlap = Math.min(block.x + block.width, line.x + line.width) - Math.max(block.x, line.x);
  const minWidth = Math.max(1, Math.min(block.width, line.width));
  const overlapRatio = overlap / minWidth;
  const leftAligned = Math.abs(block.x - line.x) < line.fontSize * 0.55;
  const rightAligned = Math.abs((block.x + block.width) - (line.x + line.width)) < line.fontSize * 0.8;
  if (overlapRatio < 0.34 && !leftAligned && !rightAligned) return reject(`overlapRatio ${overlapRatio.toFixed(2)}`);

  const paragraphBreak = /[.!?。！？；;：:]$/.test(block.text) && vGap > line.fontSize * 0.38;
  if (paragraphBreak) return reject('paragraph break');

  if (debug) console.debug('[group] merge', block.text.slice(0, 30), '->', line.text.slice(0, 30), { vGap: +vGap.toFixed(1), maxGap: +maxGap.toFixed(1), overlapRatio: +overlapRatio.toFixed(2) });
  return true;
}

function isBulletStart(text = '') {
  return /^([•·▪◦‣∙○●■□–—\-*]|\d+[.)、]|[（(]?[一二三四五六七八九十]+[、.)）])/.test(text.trim());
}

function joinLineText(previous, next) {
  if (!previous) return next;
  if (!next) return previous;
  const last = previous.slice(-1);
  const first = next.slice(0, 1);
  if (/[-‐‑]$/.test(previous) && /^[a-z]/.test(next)) {
    return previous.slice(0, -1) + next;
  }
  if (isCjkChar(last) || isCjkChar(first)) return previous + next;
  if (/\s$/.test(previous)) return previous + next;
  return `${previous} ${next}`;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function inferAlignment(lines, block, pageWidth) {
  if (lines.length > 1) {
    const lefts = lines.map((line) => line.x);
    const rights = lines.map((line) => line.x + line.width);
    const centers = lines.map((line) => line.x + line.width / 2);
    const spread = (values) => Math.max(...values) - Math.min(...values);
    const leftSpread = spread(lefts);
    const rightSpread = spread(rights);
    const centerSpread = spread(centers);
    const tolerance = Math.max(2.5, block.fontSize * 0.75);
    if (leftSpread <= tolerance && rightSpread <= tolerance && lines.length >= 2) {
      return 'justify';
    }
    if (leftSpread <= tolerance) return 'left';
    if (rightSpread <= tolerance) return 'right';
    if (centerSpread <= tolerance && leftSpread > tolerance) return 'center';
    return 'left';
  }

  const centerDelta = Math.abs(block.x + block.width / 2 - pageWidth / 2);
  if (centerDelta < pageWidth * 0.055 && block.width < pageWidth * 0.78) return 'center';
  if (block.x + block.width > pageWidth * 0.9 && block.x > pageWidth * 0.5) return 'right';
  return 'left';
}

export function extractTextBlocks({ textContent, viewport, scale, canvas, pageWidth, pageHeight, pageFonts = [] }) {
  const items = [];
  const fontMap = matchFontsToStyles(textContent.styles, pageFonts, textContent.items);

  for (const rawItem of textContent.items || []) {
    if (!rawItem || typeof rawItem.str !== 'string' || !rawItem.str.trim() || !rawItem.transform) continue;
    if (rawItem.dir === 'ttb') continue;
    const tx = pdfjsTransform(viewport.transform, rawItem.transform);
    const fontSize = Math.hypot(tx[2], tx[3]);
    if (!Number.isFinite(fontSize) || fontSize < 2) continue;

    const textLength = Math.max(1, rawItem.str.trim().length);
    const width = Math.max(0.8, Number(rawItem.width || 0) * scale);
    {
      const fontMeta = textStyleForItem(rawItem, textContent, fontMap);
      items.push({
        str: rawItem.str,
        x: tx[4],
        baseline: tx[5],
        width,
        height: fontSize * 1.16,
        top: tx[5] - fontSize * 0.83,
        bottom: tx[5] + fontSize * 0.26,
        fontSize,
        textLength,
        fontMeta,
        hasEOL: Boolean(rawItem.hasEOL),
      });
    }
  }

  if (!items.length) return [];

  items.sort((a, b) => (a.baseline - b.baseline) || (a.x - b.x));

  const rows = [];
  for (const item of items) {
    let row = null;
    for (let i = rows.length - 1; i >= Math.max(0, rows.length - 7); i -= 1) {
      const candidate = rows[i];
      const candidateSize = candidate.items[0]?.fontSize || item.fontSize;
      const tolerance = Math.max(1.8, Math.min(candidateSize, item.fontSize) * 0.36);
      if (Math.abs(candidate.baseline - item.baseline) <= tolerance) {
        row = candidate;
        break;
      }
      if (candidate.baseline < item.baseline - tolerance) break;
    }
    if (!row) {
      row = { baseline: item.baseline, items: [] };
      rows.push(row);
    }
    row.items.push(item);
  }

  const segments = [];
  for (const row of rows) {
    const sorted = [...row.items].sort((a, b) => a.x - b.x);
    let group = [];
    let groupRight = null;
    for (const item of sorted) {
      const gap = groupRight == null ? 0 : item.x - groupRight;
      const splitGap = Math.max(item.fontSize * 2.3, pageWidth * scale * 0.034);
      if (group.length && gap > splitGap) {
        if (globalThis.__FOLIO_GROUP_DEBUG) {
          console.debug('[group] split row', { gap: +gap.toFixed(1), splitGap: +splitGap.toFixed(1), pageWidth, scale, prev: group.map((i) => i.str).join('').slice(-20), next: item.str.slice(0, 20) });
        }
        const segment = makeSegment(group, pageWidth * scale, pageHeight * scale);
        if (segment) segments.push(segment);
        group = [];
        groupRight = null;
      }
      group.push(item);
      groupRight = Math.max(groupRight == null ? item.x + item.width : groupRight, item.x + item.width);
    }
    const segment = makeSegment(group, pageWidth * scale, pageHeight * scale);
    if (segment) segments.push(segment);
  }

  segments.sort((a, b) => (a.y - b.y) || (a.x - b.x));
  if (globalThis.__FOLIO_GROUP_DEBUG) {
    console.table(segments.map((segment) => ({
      text: segment.text.slice(0, 42),
      x: +segment.x.toFixed(1),
      y: +segment.y.toFixed(1),
      w: +segment.width.toFixed(1),
      h: +segment.height.toFixed(1),
      bottom: +segment.bottom.toFixed(1),
      family: segment.family,
      weight: segment.weight,
      size: +segment.fontSize.toFixed(1),
    })));
  }

  const openBlocks = [];
  const makeBlock = (segment) => ({
    lines: [segment],
    text: segment.text,
    x: segment.x,
    y: segment.y,
    width: segment.width,
    height: segment.height,
    bottom: segment.bottom,
    fontSize: segment.fontSize,
    family: segment.family,
    weight: segment.weight,
    italic: segment.italic,
    fontMeta: segment.fontMeta,
    baselines: [segment.baseline],
  });

  for (const segment of segments) {
    let target = null;
    for (const block of openBlocks) {
      if (isBulletStart(segment.text) && block.lines.length && !isBulletStart(block.text)) continue;
      if (!canMergeLines(block, segment)) continue;
      if (!target || block.bottom > target.bottom) target = block;
    }

    if (!target) {
      openBlocks.push(makeBlock(segment));
      continue;
    }

    target.text = joinLineText(target.text, segment.text);
    target.lines.push(segment);
    target.x = Math.min(target.x, segment.x);
    target.width = Math.max(target.x + target.width, segment.x + segment.width) - target.x;
    target.y = Math.min(target.y, segment.y);
    target.bottom = Math.max(target.bottom, segment.bottom);
    target.height = target.bottom - target.y;
    target.baselines.push(segment.baseline);
    target.fontSize = median(target.lines.map((line) => line.fontSize));
  }

  const blocks = openBlocks.sort((a, b) => (a.y - b.y) || (a.x - b.x));

  return blocks.map((block, index) => {
    const gaps = [];
    for (let i = 1; i < block.baselines.length; i += 1) {
      gaps.push(block.baselines[i] - block.baselines[i - 1]);
    }
    const lineGap = gaps.length ? median(gaps) : block.height;
    const lineHeight = clamp(lineGap / Math.max(1, block.fontSize), gaps.length ? 0.92 : 1.0, 2.2);
    const left = clamp(block.x / scale, 0, pageWidth);
    const top = clamp(block.y / scale, 0, pageHeight);
    const width = clamp(block.width / scale, 1, pageWidth - left);
    const height = clamp(block.height / scale, 1, pageHeight - top);
    const fontSize = block.fontSize / scale;

    const lineCount = block.lines.length;
    const isHeading = lineCount <= 2 && (fontSize > 20 || block.weight >= 700);
    const kind = isHeading ? 'heading' : lineCount === 1 ? 'line' : 'paragraph';
    const hasCjk = /[\u3400-\u9fff]/.test(block.text);
    let family = block.family;
    let fontFace = block.fontMeta.familyLabel;
    if (hasCjk && family === 'mono' && !block.fontMeta.actual) {
      // Many CJK fonts advertise a fixed-pitch flag; in a mixed document that
      // should still read as a normal Chinese sans face, not a code font.
      family = 'sans';
      fontFace = 'Microsoft YaHei';
    }
    if (hasCjk && !block.fontMeta.actual && /^(Sans Serif|Serif|Monospace)$/i.test(fontFace)) {
      fontFace = family === 'serif' ? 'SimSun' : 'Microsoft YaHei';
    }
    if (!block.fontMeta.actual && hasCjk && family === 'mono') {
      family = 'sans';
    }

    return {
      id: `det-${index}`,
      text: block.text.replace(/\s+/g, ' ').trim(),
      x: left + 0.6,
      y: top + 0.8,
      width: Math.max(3, width - 1.2),
      height: Math.max(3, height - 0.8),
      sourceRect: {
        x: left + 0.6,
        y: top + 0.8,
        width: Math.max(3, width - 1.2),
        height: Math.max(3, height - 0.8),
      },
      sourceLines: block.lines.length,
      kind,
      fontMeta: { ...block.fontMeta, family, familyLabel: fontFace, fontFace },
      style: {
        family,
        fontChoice: 'auto',
        fontFace,
        fontSize,
        weight: block.weight,
        weightName: block.fontMeta.weightName,
        italic: block.italic,
        color: '#1B2420',
        lineHeight,
        letterSpacing: 0,
        underline: false,
        strike: false,
        align: inferAlignment(block.lines, block, pageWidth * scale),
      },
      appearance: null,
      patchColor: '#FFFFFF',
      confidence: 0,
      density: 0,
      weightSource: block.fontMeta.weightSource,
    };
  }).map((block) => {
    const appearance = detectBlockAppearance(canvas, block, scale);
    block.appearance = appearance;
    block.style.color = appearance.color;
    block.style.weight = appearance.weight;
    block.style.weightName = appearance.weightName;
    block.patchColor = appearance.uniformBackground ? appearance.background : appearance.background;
    block.confidence = appearance.confidence;
    block.density = appearance.density;
    block.weightSource = appearance.weightSource;
    block.style.weightName = weightLabelFor(appearance.weight);
    block.detectedStyle = structuredClone(block.style);
    return block;
  });
}

function pdfjsTransform(m1, m2) {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

export function attachMaxHeights(blocks, pageHeight) {
  const sorted = [...blocks].sort((a, b) => a.y - b.y);
  for (const block of sorted) {
    let boundary = pageHeight - 26;
    for (const other of sorted) {
      if (other === block) continue;
      if (other.y <= block.y + 1) continue;
      const overlap = Math.min(block.x + block.width, other.x + other.width) - Math.max(block.x, other.x);
      const ratio = overlap / Math.max(1, Math.min(block.width, other.width));
      if (ratio > 0.28) {
        boundary = Math.min(boundary, other.y - 3);
      }
    }
    block.maxHeight = Math.max(block.height, boundary - block.y);
  }
  return blocks;
}

export function nearestBlockStyle(blocks, x, y) {
  if (!blocks.length) {
    return {
      family: 'sans',
      fontChoice: 'auto',
      fontFace: 'Sans Serif',
      fontSize: 12,
      weight: 400,
      weightName: 'Regular',
      italic: false,
      color: '#1B2420',
      lineHeight: 1.4,
      letterSpacing: 0,
      underline: false,
      strike: false,
      align: 'left',
    };
  }
  let best = null;
  let bestDistance = Infinity;
  for (const block of blocks) {
    const dx = x < block.x ? block.x - x : x > block.x + block.width ? x - block.x - block.width : 0;
    const dy = y < block.y ? block.y - y : y > block.y + block.height ? y - block.y - block.height : 0;
    const distance = Math.hypot(dx, dy * 1.4);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = block;
    }
  }
  const style = { ...best.style };
  if (style.fontSize > 18 && bestDistance > 70) style.fontSize = 12;
  return {
    ...style,
    fontChoice: 'auto',
    lineHeight: clamp(style.lineHeight, 1.1, 1.7),
  };
}
