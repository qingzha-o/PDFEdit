import * as pdfjsLib from '../vendor/pdfjs/build/pdf.min.mjs';
import { extractTextBlocks, attachMaxHeights } from './text-blocks.js';

const WORKER_URL = new URL('../vendor/pdfjs/build/pdf.worker.min.mjs', import.meta.url).href;
const CMAP_URL = new URL('../vendor/pdfjs/cmaps/', import.meta.url).href;
const STANDARD_FONT_URL = new URL('../vendor/pdfjs/standard_fonts/', import.meta.url).href;

pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_URL;

const LOAD_OPTIONS = {
  cMapUrl: CMAP_URL,
  cMapPacked: true,
  standardFontDataUrl: STANDARD_FONT_URL,
  isEvalSupported: false,
  useSystemFonts: true,
};

export function bytesCopy(bytes) {
  return bytes instanceof Uint8Array
    ? bytes.slice().buffer
    : bytes.slice(0);
}

export async function openPdf(bytes) {
  const data = new Uint8Array(bytesCopy(bytes));
  return pdfjsLib.getDocument({ ...LOAD_OPTIONS, data }).promise;
}

export function getViewport(pageProxy, scale = 1) {
  return pageProxy.getViewport({ scale });
}

export function pageFit(page, nativeViewport) {
  const fit = Math.min(
    page.width / Math.max(1, nativeViewport.width),
    page.height / Math.max(1, nativeViewport.height)
  );
  const width = nativeViewport.width * fit;
  const height = nativeViewport.height * fit;
  return {
    fit,
    x: (page.width - width) / 2,
    y: (page.height - height) / 2,
    width,
    height,
  };
}

function paintWhite(ctx, width, height) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export async function renderPage(pageModel, source, canvas, scale, dpr = 1) {
  const width = Math.max(1, Math.round(pageModel.width * scale * dpr));
  const height = Math.max(1, Math.round(pageModel.height * scale * dpr));
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { alpha: false });
  paintWhite(ctx, width, height);

  if (pageModel.kind === 'blank' || !source?.pdfDoc) {
    return canvas;
  }

  const pageProxy = await source.pdfDoc.getPage(pageModel.sourcePageIndex + 1);
  const totalRotation = (((Number(pageProxy.rotate) || 0) + (Number(pageModel.rotation) || 0)) % 360 + 360) % 360;
  if (pageModel.kind === 'replacement') {
    const native = pageProxy.getViewport({ scale: 1, rotation: totalRotation });
    const fit = pageFit(pageModel, native);
    const viewport = pageProxy.getViewport({ scale: scale * dpr * fit.fit, rotation: totalRotation });
    const ox = Math.round(fit.x * scale * dpr);
    const oy = Math.round(fit.y * scale * dpr);
    await pageProxy.render({
      canvasContext: ctx,
      viewport,
      transform: [1, 0, 0, 1, ox, oy],
      background: 'rgba(255,255,255,0)',
    }).promise;
  } else {
    const viewport = pageProxy.getViewport({ scale: scale * dpr, rotation: totalRotation });
    await pageProxy.render({
      canvasContext: ctx,
      viewport,
      background: 'rgba(255,255,255,0)',
    }).promise;
  }

  return canvas;
}

export async function renderPageToCanvas(pageModel, source, scale, dpr = 1) {
  const canvas = document.createElement('canvas');
  await renderPage(pageModel, source, canvas, scale, dpr);
  return canvas;
}

export async function analyzePage(pageModel, source, detectScale = 2) {
  if (pageModel.kind === 'blank' || !source?.pdfDoc) {
    return [];
  }
  // Rotated pages are rendered rotated for orientation/export. Text editing
  // remains available on the normal orientation; turn the page back to edit.
  if (Math.abs(Number(pageModel.rotation) || 0) % 360 !== 0) {
    return [];
  }

  const pageProxy = await source.pdfDoc.getPage(pageModel.sourcePageIndex + 1);
  const totalRotation = (((Number(pageProxy.rotate) || 0) + (Number(pageModel.rotation) || 0)) % 360 + 360) % 360;
  const viewport = pageProxy.getViewport({ scale: detectScale, rotation: totalRotation });
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = Math.max(1, Math.round(viewport.width));
  sourceCanvas.height = Math.max(1, Math.round(viewport.height));
  const ctx = sourceCanvas.getContext('2d', { alpha: false, willReadFrequently: true });
  paintWhite(ctx, sourceCanvas.width, sourceCanvas.height);
  await pageProxy.render({
    canvasContext: ctx,
    viewport,
    background: 'rgba(255,255,255,0)',
  }).promise;

  const textContent = await pageProxy.getTextContent();
  const sourceWidth = viewport.width / detectScale;
  const sourceHeight = viewport.height / detectScale;

  const blocks = extractTextBlocks({
    textContent,
    viewport,
    scale: detectScale,
    canvas: sourceCanvas,
    pageWidth: sourceWidth,
    pageHeight: sourceHeight,
    pageFonts: source.fontCatalog?.[pageModel.sourcePageIndex] || [],
  });

  if (pageModel.kind === 'replacement') {
    const native = pageProxy.getViewport({ scale: 1, rotation: totalRotation });
    const fit = pageFit(pageModel, native);
    for (const block of blocks) {
      block.x = block.x * fit.fit + fit.x;
      block.y = block.y * fit.fit + fit.y;
      block.width *= fit.fit;
      block.height *= fit.fit;
      block.style.fontSize *= fit.fit;
      block.style.letterSpacing *= fit.fit;
      if (block.sourceRect) {
        block.sourceRect.x = block.sourceRect.x * fit.fit + fit.x;
        block.sourceRect.y = block.sourceRect.y * fit.fit + fit.y;
        block.sourceRect.width *= fit.fit;
        block.sourceRect.height *= fit.fit;
      }
    }
  }

  attachMaxHeights(blocks, pageModel.height);
  return blocks;
}

export async function getPageOuterSize(pageProxy) {
  const viewport = pageProxy.getViewport({ scale: 1 });
  return { width: viewport.width, height: viewport.height };
}

export function closeDocument(pdfDoc) {
  try {
    pdfDoc?.destroy?.();
  } catch {
    // The worker might already be gone.
  }
}
