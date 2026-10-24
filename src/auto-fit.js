import { getFontStack } from './text-blocks.js';

const MIN_LINE_HEIGHT = 1;
const MIN_FONT_SCALE = 0.1;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getBaseBoxHeight(block) {
  return Math.max(1, block.height || 1);
}

export function getMaxBoxHeight(block) {
  const base = getBaseBoxHeight(block);
  const max = Number.isFinite(block.maxHeight) ? block.maxHeight : base;
  return Math.max(base, max);
}

export function buildTextStyle(block, zoom, fit = {}) {
  const style = block.style;
  const fontScale = fit.fontScale || 1;
  const lineHeight = fit.lineHeight || style.lineHeight || 1.35;
  return {
    fontFamily: getFontStack(style),
    fontSize: `${Math.max(1.5, style.fontSize * zoom * fontScale)}px`,
    fontWeight: String(style.weight || 400),
    fontStyle: style.italic ? 'italic' : 'normal',
    color: style.color || '#1B2420',
    lineHeight: String(lineHeight),
    letterSpacing: `${(style.letterSpacing || 0) * zoom}px`,
    textAlign: style.align || 'left',
    textDecoration: [style.underline ? 'underline' : '', style.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    fontSynthesis: 'weight style',
    fontKerning: 'normal',
    textRendering: 'geometricPrecision',
  };
}

export function applyTextStyle(element, block, zoom, fit = {}) {
  const css = buildTextStyle(block, zoom, fit);
  Object.assign(element.style, css);
}

function contentHeight(element) {
  const previousHeight = element.style.height;
  element.style.height = 'auto';
  const rect = element.getBoundingClientRect();
  const height = Math.ceil(rect.height * 100) / 100;
  element.style.height = previousHeight;
  return Math.max(1, height);
}

function measureWith(element, block, zoom, fontScale, lineHeight) {
  applyTextStyle(element, block, zoom, { fontScale, lineHeight });
  return contentHeight(element);
}

/**
 * Lay out a block inside its original text region (or the free space below it).
 * It first tries the contextual line-height, then compresses line spacing, and
 * only then reduces the font size. The box never grows past the next text block
 * or the page's bottom margin.
 */
export function layoutBlock(element, block, zoom, options = {}) {
  const editable = Boolean(options.editable);
  const autoFit = block.autoFit !== false;
  const baseLineHeight = clamp(Number(block.style.lineHeight) || 1.35, 0.86, 2.2);
  const maxHeight = getMaxBoxHeight(block) * zoom;
  const baseHeight = getBaseBoxHeight(block) * zoom;

  element.style.width = `${block.width * zoom}px`;
  element.style.height = 'auto';
  element.style.padding = '0';
  element.style.margin = '0';
  element.style.overflow = 'visible';

  let fontScale = 1;
  let lineHeight = baseLineHeight;
  let measured = measureWith(element, block, zoom, fontScale, lineHeight);
  let compression = 1;

  if (!autoFit) {
    const boxHeight = Math.max(baseHeight, measured);
    element.style.height = `${boxHeight}px`;
    element.style.overflow = 'hidden';
    const fit = {
      boxHeight: boxHeight / zoom,
      fontScale: 1,
      lineHeight: baseLineHeight,
      measuredHeight: measured / zoom,
      compression: 0,
      lineCompression: 0,
      fontCompression: 0,
      lineCount: Math.max(1, Math.round(measured / Math.max(1, block.style.fontSize * zoom * baseLineHeight))),
      status: 'fits',
      autoFit: false,
      overflow: false,
      editable,
    };
    block.fit = fit;
    return fit;
  }

  if (measured <= maxHeight + 0.35) {
    const boxHeight = Math.max(baseHeight, measured);
    element.style.height = `${boxHeight}px`;
    element.style.overflow = 'hidden';
    const fit = {
      boxHeight: boxHeight / zoom,
      fontScale: 1,
      lineHeight: baseLineHeight,
      measuredHeight: measured / zoom,
      compression: 0,
      lineCompression: 0,
      fontCompression: 0,
      lineCount: Math.max(1, Math.round(measured / Math.max(1, block.style.fontSize * zoom * baseLineHeight))),
      status: 'fits',
      autoFit: true,
      overflow: false,
      editable,
    };
    block.fit = fit;
    return fit;
  }

  // Step 1: keep the glyph size, squeeze the leading down toward a single
  // line box. The floor never expands text that was already set tighter.
  const minLineHeight = Math.min(baseLineHeight, MIN_LINE_HEIGHT);
  let low = minLineHeight;
  let high = baseLineHeight;
  let bestLine = minLineHeight;
  let bestMeasured = measureWith(element, block, zoom, 1, bestLine);
  let lineFits = bestMeasured <= maxHeight + 0.35;
  if (lineFits) {
    for (let i = 0; i < 9; i += 1) {
      const mid = (low + high) / 2;
      const test = measureWith(element, block, zoom, 1, mid);
      if (test <= maxHeight + 0.35) {
        low = mid;
        bestLine = mid;
        bestMeasured = test;
      } else {
        high = mid;
      }
    }
    lineHeight = bestLine;
    measured = bestMeasured;
    fontScale = 1;
  } else {
    lineHeight = minLineHeight;
    measured = bestMeasured;
  }

  // Step 2: if leading compression is not enough, shrink the type just enough
  // to stay inside the available box. We stop at 10% so extreme edits still
  // remain on the page; the inspector shows the applied compression.
  if (measured > maxHeight + 0.35) {
    let fontLow = MIN_FONT_SCALE;
    let fontHigh = 1;
    let bestFont = MIN_FONT_SCALE;
    let bestHeight = measureWith(element, block, zoom, bestFont, lineHeight);
    let fontFits = bestHeight <= maxHeight + 0.35;
    if (fontFits) {
      for (let i = 0; i < 11; i += 1) {
        const mid = (fontLow + fontHigh) / 2;
        const test = measureWith(element, block, zoom, mid, lineHeight);
        if (test <= maxHeight + 0.35) {
          fontLow = mid;
          bestFont = mid;
          bestHeight = test;
        } else {
          fontHigh = mid;
        }
      }
      fontScale = bestFont;
      measured = bestHeight;
    } else {
      fontScale = MIN_FONT_SCALE;
      measured = bestHeight;
    }
  }

  const boxHeight = Math.min(maxHeight, Math.max(baseHeight, measured));
  element.style.height = `${boxHeight}px`;
  element.style.overflow = 'hidden';
  applyTextStyle(element, block, zoom, { fontScale, lineHeight });

  // The DOM text box and the measured content can differ by a hair. Verify with
  // the element's own scroll metrics and shave a little more type if needed, so
  // the editor never shows visibly clipped lines.
  let settleGuard = 0;
  while (
    element.scrollHeight > element.clientHeight + 1.5 &&
    fontScale > MIN_FONT_SCALE + 0.001 &&
    settleGuard < 10
  ) {
    fontScale = Math.max(MIN_FONT_SCALE, fontScale * 0.93);
    applyTextStyle(element, block, zoom, { fontScale, lineHeight });
    measured = contentHeight(element);
    element.style.height = `${Math.min(maxHeight, Math.max(baseHeight, measured))}px`;
    settleGuard += 1;
  }

  const finalBoxHeight = Math.min(maxHeight, Math.max(baseHeight, measured));
  element.style.height = `${finalBoxHeight}px`;
  const linePx = Math.max(1, block.style.fontSize * zoom * fontScale * lineHeight);
  const lineCount = Math.max(1, Math.round(measured / linePx));
  const overflow = element.scrollHeight > element.clientHeight + 1.5;
  compression = 1 - (fontScale * lineHeight) / (baseLineHeight || 1);

  const fit = {
    boxHeight: finalBoxHeight / zoom,
    fontScale,
    lineHeight,
    measuredHeight: measured / zoom,
    compression: clamp(compression, 0, 0.95),
    lineCompression: clamp(1 - lineHeight / baseLineHeight, 0, 0.95),
    fontCompression: clamp(1 - fontScale, 0, 0.95),
    lineCount,
    status: overflow ? 'overflow' : compression > 0.001 ? 'compressed' : 'fits',
    autoFit: true,
    overflow,
    editable,
  };
  block.fit = fit;
  return fit;
}

export function layoutBlockForExport(block, scale) {
  const fit = block.fit || {
    boxHeight: block.height,
    fontScale: 1,
    lineHeight: block.style.lineHeight,
  };
  const style = buildTextStyle(block, scale, fit);
  return {
    left: block.x * scale,
    top: block.y * scale,
    width: Math.max(2, block.width * scale),
    height: Math.max(2, fit.boxHeight * scale),
    background: block.patchColor || '#fff',
    style,
    text: block.text,
  };
}

export function setBlockStyleFromDetection(block, detected) {
  block.style.color = detected.color;
  block.style.weight = detected.weight;
  block.style.weightName = detected.weightName;
  block.style.family = detected.family || block.fontMeta?.family || 'sans';
  block.style.fontFace = detected.fontFace || block.fontMeta?.familyLabel || 'Sans Serif';
  block.style.italic = Boolean(detected.italic);
  block.style.fontSize = detected.fontSize;
  block.style.lineHeight = detected.lineHeight;
}
