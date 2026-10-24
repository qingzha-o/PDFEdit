const ASSET_BASE = new URL('../vendor/tesseract/', import.meta.url);

let workerPromise = null;
let activeProgress = null;

function requireTesseract() {
  if (!window.Tesseract) {
    throw new Error('OCR 引擎未加载，请刷新页面后重试。');
  }
  return window.Tesseract;
}

function getWorker() {
  if (workerPromise) return workerPromise;
  const Tesseract = requireTesseract();
  activeProgress?.({ status: '正在加载 OCR 引擎', progress: 0 });
  workerPromise = Tesseract.createWorker(['chi_sim', 'eng'], 1, {
    workerPath: new URL('worker.min.js', ASSET_BASE).href,
    corePath: new URL('core', ASSET_BASE).href,
    langPath: new URL('lang', ASSET_BASE).href,
    workerBlobURL: false,
    logger: (message) => activeProgress?.(message),
  }).catch((error) => {
    workerPromise = null;
    throw error;
  });
  return workerPromise;
}

function cleanOcrText(raw) {
  let text = String(raw || '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u3000/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
  // Tesseract often inserts spaces between every CJK glyph. Remove only the
  // spaces that sit between two CJK characters, then clean up punctuation.
  for (let i = 0; i < 4; i += 1) {
    const next = text.replace(/([\u3400-\u9fff\uf900-\ufaff])\s+(?=[\u3400-\u9fff\uf900-\ufaff])/g, '$1');
    if (next === text) break;
    text = next;
  }
  text = text
    .replace(/\s+([，。！？、；：,.!?;:）】》」』])/g, '$1')
    .replace(/([（【《「『])\s+/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

export async function recognizeOcr(source, { onProgress } = {}) {
  activeProgress = onProgress || null;
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(source);
    const text = cleanOcrText(data.text);
    if (!text) throw new Error('没有识别到文字，请换一张更清晰或方向正确的图片。');
    const lines = (data.lines || [])
      .map((line) => ({
        text: cleanOcrText(line.text),
        confidence: Math.round(Number(line.confidence) || 0),
        bbox: line.bbox,
      }))
      .filter((line) => line.text && line.bbox && line.bbox.x1 > line.bbox.x0 && line.bbox.y1 > line.bbox.y0);
    return {
      text,
      rawText: data.text,
      confidence: Math.round(Number(data.confidence) || 0),
      lines,
    };
  } finally {
    activeProgress = null;
  }
}

export async function resetOcrWorker() {
  const current = workerPromise;
  workerPromise = null;
  if (!current) return;
  try {
    const worker = await current;
    await worker.terminate();
  } catch {
    // ignore
  }
}
