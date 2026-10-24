import { layoutBlockForExport } from './auto-fit.js';
import { renderPage } from './pdf-engine.js';

function fitRect(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const scale = Math.min(targetWidth / Math.max(1, sourceWidth), targetHeight / Math.max(1, sourceHeight));
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  return {
    width,
    height,
    x: (targetWidth - width) / 2,
    y: (targetHeight - height) / 2,
  };
}

function isCjk(char) {
  return /[\u2e80-\u2fff\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7af]/.test(char);
}

function tokenize(text) {
  const tokens = [];
  let word = '';
  const flush = () => {
    if (word) {
      tokens.push(word);
      word = '';
    }
  };
  for (const char of String(text)) {
    if (char === '\n') {
      flush();
      tokens.push('\n');
    } else if (/\s/.test(char)) {
      flush();
      tokens.push(' ');
    } else if (isCjk(char)) {
      flush();
      tokens.push(char);
    } else {
      word += char;
    }
  }
  flush();
  return tokens;
}

function setCanvasFont(ctx, style) {
  const font = `${style.fontStyle || 'normal'} ${style.fontWeight || 400} ${style.fontSize} ${style.fontFamily}`;
  ctx.font = font;
  try {
    ctx.letterSpacing = style.letterSpacing || '0px';
  } catch {
    // Older canvas implementations simply won't support letter spacing.
  }
}

function splitLongToken(ctx, token, maxWidth) {
  const parts = [];
  let line = '';
  for (const char of token) {
    const test = line + char;
    if (line && ctx.measureText(test).width > maxWidth) {
      parts.push(line);
      line = char;
    } else {
      line = test;
    }
  }
  if (line) parts.push(line);
  return parts;
}

function wrapCanvasText(ctx, text, maxWidth) {
  const paragraphs = String(text).split('\n');
  const lines = [];

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('');
      continue;
    }
    const tokens = tokenize(paragraph);
    let line = '';

    const pushLine = () => {
      lines.push(line.replace(/\s+$/g, ''));
      line = '';
    };

    for (const token of tokens) {
      if (token === '\n') {
        pushLine();
        continue;
      }
      if (token === ' ' && !line) continue;
      const test = line + token;
      if (ctx.measureText(test).width <= maxWidth || !line) {
        if (!line && token === ' ') continue;
        if (!line && ctx.measureText(token).width > maxWidth) {
          const parts = splitLongToken(ctx, token, maxWidth);
          for (let i = 0; i < parts.length - 1; i += 1) lines.push(parts[i]);
          line = parts[parts.length - 1] || '';
        } else {
          line = test;
        }
      } else {
        pushLine();
        if (token === ' ') continue;
        line = token;
        if (ctx.measureText(line).width > maxWidth) {
          const parts = splitLongToken(ctx, line, maxWidth);
          for (let i = 0; i < parts.length - 1; i += 1) lines.push(parts[i]);
          line = parts[parts.length - 1] || '';
        }
      }
    }
    pushLine();
  }

  return lines.length ? lines : [''];
}

function textMetrics(ctx, fontSize) {
  const metrics = ctx.measureText('Mg');
  const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent || fontSize * 0.2;
  return { ascent, descent };
}

function drawJustifiedLine(ctx, text, x, y, width) {
  const words = text.split(' ').filter(Boolean);
  if (words.length < 2) {
    ctx.fillText(text, x, y);
    return;
  }
  const textWidth = words.reduce((sum, word, index) => sum + ctx.measureText(word).width + (index ? ctx.measureText(' ').width : 0), 0);
  const gapCount = words.length - 1;
  const extra = Math.max(0, width - textWidth) / gapCount;
  let cursor = x;
  words.forEach((word, index) => {
    ctx.fillText(word, cursor, y);
    cursor += ctx.measureText(word).width;
    if (index < gapCount) {
      cursor += ctx.measureText(' ').width + extra;
    }
  });
}

function drawTextBlock(ctx, block, scale) {
  const base = layoutBlockForExport(block, scale);
  if (!base.text || !base.text.trim()) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(base.left, base.top, base.width, base.height);
  ctx.clip();
  ctx.fillStyle = base.style.color;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.direction = 'ltr';

  let fontScale = 1;
  let fontSize = parseFloat(base.style.fontSize);
  let lineHeight = parseFloat(base.style.lineHeight) * fontSize;
  setCanvasFont(ctx, base.style);
  let lines = wrapCanvasText(ctx, base.text, base.width);
  let metrics = textMetrics(ctx, fontSize);

  // Direct canvas shaping is a few percent tighter than the DOM preview. If
  // that produces an extra line, nudge the type down just enough to keep the
  // exported page identical to the "always inside the box" promise.
  for (let guard = 0; guard < 10; guard += 1) {
    const totalHeight = lines.length * lineHeight;
    if (totalHeight <= base.height + 0.5) break;
    fontScale *= 0.94;
    fontSize = parseFloat(base.style.fontSize) * fontScale;
    lineHeight = parseFloat(base.style.lineHeight) * fontSize;
    const nextStyle = { ...base.style, fontSize: `${fontSize}px` };
    setCanvasFont(ctx, nextStyle);
    lines = wrapCanvasText(ctx, base.text, base.width);
    metrics = textMetrics(ctx, fontSize);
  }

  const boxLineHeight = lineHeight;
  const offset = Math.max(0, (boxLineHeight - (metrics.ascent + metrics.descent)) / 2);
  const visibleLines = lines;
  const align = base.style.textAlign;

  for (let i = 0; i < visibleLines.length; i += 1) {
    const line = visibleLines[i];
    if (!line) continue;
    const lineWidth = ctx.measureText(line).width;
    const y = base.top + offset + metrics.ascent + i * boxLineHeight;
    let x = base.left;
    if (align === 'center') x += (base.width - lineWidth) / 2;
    else if (align === 'right') x += base.width - lineWidth;
    let decorationX = x;
    let decorationWidth = lineWidth;
    if (align === 'justify' && i < visibleLines.length - 1 && line.includes(' ')) {
      drawJustifiedLine(ctx, line, base.left, y, base.width);
      decorationX = base.left;
      decorationWidth = base.width;
    } else {
      ctx.fillText(line, x, y);
    }

    const decoration = base.style.textDecoration || 'none';
    if (decoration !== 'none') {
      const fontSize = parseFloat(base.style.fontSize);
      ctx.save();
      ctx.strokeStyle = base.style.color;
      ctx.lineWidth = Math.max(1, fontSize * 0.055);
      if (decoration.includes('underline')) {
        ctx.beginPath();
        ctx.moveTo(decorationX, y + fontSize * 0.12);
        ctx.lineTo(decorationX + decorationWidth, y + fontSize * 0.12);
        ctx.stroke();
      }
      if (decoration.includes('line-through')) {
        ctx.beginPath();
        ctx.moveTo(decorationX, y - fontSize * 0.3);
        ctx.lineTo(decorationX + decorationWidth, y - fontSize * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

function overlayEditedText(ctx, page, scale) {
  const edits = page.edits || [];
  if (!edits.length) return;

  for (const block of edits) {
    const box = layoutBlockForExport(block, scale);
    const pad = Math.max(1.2 * scale, 1.5);
    ctx.save();
    ctx.fillStyle = box.background;
    if (block.sourceRect) {
      const source = block.sourceRect;
      ctx.fillRect(
        source.x * scale - pad,
        source.y * scale - pad,
        source.width * scale + pad * 2,
        source.height * scale + pad * 2
      );
    }
    ctx.fillRect(box.left - pad, box.top - pad, box.width + pad * 2, box.height + pad * 2);
    ctx.restore();
    if (block.text && block.text.trim()) {
      drawTextBlock(ctx, block, scale);
    }
  }
}

export async function renderCompositePage(page, source, scale = 2.25) {
  const maxPixels = 18_000_000;
  let actualScale = scale;
  if (page.width * page.height * actualScale * actualScale > maxPixels) {
    actualScale = Math.sqrt(maxPixels / (page.width * page.height));
  }

  const canvas = document.createElement('canvas');
  await renderPage(page, source, canvas, actualScale, 1);
  const ctx = canvas.getContext('2d');
  overlayEditedText(ctx, page, actualScale);
  return canvas;
}

export async function exportPdf({ pages, sources, originalBytes, fileName, onProgress }) {
  const { PDFDocument, degrees } = window.PDFLib;
  if (!PDFDocument) throw new Error('PDF 导出引擎未加载');

  const out = await PDFDocument.create();
  out.setProducer('Folio PDF Studio');
  out.setCreator('Folio PDF Studio');
  out.setTitle((fileName || 'document').replace(/\.pdf$/i, '') + ' · edited');
  out.setCreationDate(new Date());
  await document.fonts.ready;

  const originalDoc = await PDFDocument.load(originalBytes, { ignoreEncryption: true });
  const replacementDocs = new Map();
  const replacementEmbeds = new Map();

  for (const [id, source] of Object.entries(sources)) {
    if (id === 'original' || !source?.bytes || source.kind === 'original') continue;
    const doc = await PDFDocument.load(source.bytes, { ignoreEncryption: true });
    replacementDocs.set(id, doc);
  }

  const total = pages.length;
  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i];
    onProgress?.(i, total, page);

    if (page.kind === 'original' && !page.edits.length) {
      const [copied] = await out.copyPages(originalDoc, [page.sourcePageIndex]);
      out.addPage(copied);
      if (page.rotation) {
        const sourcePage = originalDoc.getPage(page.sourcePageIndex);
        const totalRotation = ((sourcePage.getRotation().angle + page.rotation) % 360 + 360) % 360;
        copied.setRotation(degrees(totalRotation));
      }
      continue;
    }

    if (page.kind === 'replacement' && !page.edits.length && !page.rotation) {
      const sourceDoc = replacementDocs.get(page.sourceId);
      if (!sourceDoc) throw new Error('替换页来源丢失');
      const embedKey = `${page.sourceId}:${page.sourcePageIndex}`;
      let embedded = replacementEmbeds.get(embedKey);
      if (!embedded) {
        const embeddedPages = await out.embedPdf(sourceDoc, [page.sourcePageIndex]);
        embedded = embeddedPages[0];
        replacementEmbeds.set(embedKey, embedded);
      }
      const target = out.addPage([page.width, page.height]);
      const rect = fitRect(embedded.width, embedded.height, page.width, page.height);
      target.drawPage(embedded, {
        x: rect.x,
        y: page.height - rect.y - rect.height,
        width: rect.width,
        height: rect.height,
      });
      continue;
    }

    const target = out.addPage([page.width, page.height]);
    const canvas = await renderCompositePage(page, sources[page.sourceId], 2.25);
    const dataUrl = canvas.toDataURL('image/png');
    const image = await out.embedPng(dataUrl);
    target.drawImage(image, { x: 0, y: 0, width: page.width, height: page.height });
  }

  onProgress?.(total, total, null);
  return out.save({ useObjectStreams: true, addDefaultPage: false });
}
