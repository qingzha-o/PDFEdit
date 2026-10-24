import {
  openPdf,
  renderPage,
  renderPageToCanvas,
  analyzePage,
  closeDocument,
  bytesCopy,
} from './pdf-engine.js';
import {
  nearestBlockStyle,
  weightLabelFor,
  hexToRgb,
} from './text-blocks.js';
import {
  layoutBlock,
  buildTextStyle,
} from './auto-fit.js';
import { exportPdf, renderCompositePage } from './exporter.js';
import { readPdfFontCatalog } from './pdf-fonts.js';
import { recognizeOcr, resetOcrWorker } from './ocr.js';

const $ = (selector) => document.querySelector(selector);

const dom = {
  docPill: $('#docPill'),
  fileName: $('#fileName'),
  fileState: $('#fileState'),
  docDot: $('#docDot'),
  btnOpenAnother: $('#btnOpenAnother'),
  toolSelect: $('#toolSelect'),
  toolText: $('#toolText'),
  toolReplace: $('#toolReplace'),
  btnOcr: $('#btnOcr'),
  btnUndo: $('#btnUndo'),
  btnRedo: $('#btnRedo'),
  btnExport: $('#btnExport'),
  pageCount: $('#pageCount'),
  btnAddBlank: $('#btnAddBlank'),
  thumbList: $('#thumbList'),
  docCrumb: $('#docCrumb'),
  pageCrumb: $('#pageCrumb'),
  textLayerChip: $('#textLayerChip'),
  fitChip: $('#fitChip'),
  canvasScroll: $('#canvasScroll'),
  welcome: $('#welcome'),
  stageWrap: $('#stageWrap'),
  stage: $('#stage'),
  pageCanvas: $('#pageCanvas'),
  blockLayer: $('#blockLayer'),
  guideLayer: $('#guideLayer'),
  guideV: $('#guideV'),
  guideH: $('#guideH'),
  blockTools: $('#blockTools'),
  blockSizeBadge: $('#blockSizeBadge'),
  moveGrip: $('#moveGrip'),
  pageCaption: $('#pageCaption'),
  pageSizeCaption: $('#pageSizeCaption'),
  dropOverlay: $('#dropOverlay'),
  viewDock: $('#viewDock'),
  zoomValue: $('#zoomValue'),
  statusText: $('#statusText'),
  statusPage: $('#statusPage'),
  statusZoom: $('#statusZoom'),
  inspector: $('#inspector'),
  inspectorEmpty: $('#inspectorEmpty'),
  inspectorPage: $('#inspectorPage'),
  inspectorBlock: $('#inspectorBlock'),
  inspectPageTitle: $('#inspectPageTitle'),
  inspectPageKind: $('#inspectPageKind'),
  statPageSize: $('#statPageSize'),
  statBlocks: $('#statBlocks'),
  statEdits: $('#statEdits'),
  statPosition: $('#statPosition'),
  miniCanvas: $('#miniCanvas'),
  blockIndexLabel: $('#blockIndexLabel'),
  typeSpecimen: $('#typeSpecimen'),
  detectedFont: $('#detectedFont'),
  detectedMeta: $('#detectedMeta'),
  detectedColorSwatch: $('#detectedColorSwatch'),
  fontChoice: $('#fontChoice'),
  fontFaceHint: $('#fontFaceHint'),
  fontSize: $('#fontSize'),
  fontWeight: $('#fontWeight'),
  colorPreview: $('#colorPreview'),
  textColor: $('#textColor'),
  colorHex: $('#colorHex'),
  btnItalic: $('#btnItalic'),
  btnBold: $('#btnBold'),
  btnUnderline: $('#btnUnderline'),
  btnStrike: $('#btnStrike'),
  btnBulletList: $('#btnBulletList'),
  btnNumberList: $('#btnNumberList'),
  btnFontMinus: $('#btnFontMinus'),
  btnFontPlus: $('#btnFontPlus'),
  btnClearFormat: $('#btnClearFormat'),
  alignSegment: $('#alignSegment'),
  lineHeight: $('#lineHeight'),
  lineHeightValue: $('#lineHeightValue'),
  letterSpacing: $('#letterSpacing'),
  letterSpacingValue: $('#letterSpacingValue'),
  autoFitToggle: $('#autoFitToggle'),
  metricWrap: $('#metricWrap'),
  metricLine: $('#metricLine'),
  metricFont: $('#metricFont'),
  fitBarFill: $('#fitBarFill'),
  fitStatus: $('#fitStatus'),
  blockXValue: $('#blockXValue'),
  blockYValue: $('#blockYValue'),
  blockWValue: $('#blockWValue'),
  blockHValue: $('#blockHValue'),
  btnMoveMode: $('#btnMoveMode'),
  snapToggle: $('#snapToggle'),
  blockActions: $('#blockActions'),
  btnApplyBlock: $('#btnApplyBlock'),
  btnCancelBlock: $('#btnCancelBlock'),
  btnDeselect: $('#btnDeselect'),
  btnOpenDocPage: $('#btnOpenDocPage'),
  btnOcrPage: $('#btnOcrPage'),
  btnReplacePage: $('#btnReplacePage'),
  btnInsertBlank: $('#btnInsertBlank'),
  btnDeletePage: $('#btnDeletePage'),
  fileInput: $('#fileInput'),
  replaceInput: $('#replaceInput'),
  btnOpen: $('#btnOpen'),
  btnSample: $('#btnSample'),
  dropzone: $('#dropzone'),
  btnZoomOut: $('#btnZoomOut'),
  btnZoomIn: $('#btnZoomIn'),
  btnFitPage: $('#btnFitPage'),
  btnRotateLeft: $('#btnRotateLeft'),
  btnRotateRight: $('#btnRotateRight'),
  replaceModal: $('#replaceModal'),
  replacePageNum: $('#replacePageNum'),
  btnCloseReplace: $('#btnCloseReplace'),
  replaceDrop: $('#replaceDrop'),
  btnChooseReplacement: $('#btnChooseReplacement'),
  replaceSource: $('#replaceSource'),
  replaceSourceName: $('#replaceSourceName'),
  btnChangeReplacement: $('#btnChangeReplacement'),
  replacePages: $('#replacePages'),
  keepPageSize: $('#keepPageSize'),
  btnConfirmReplace: $('#btnConfirmReplace'),
  btnCancelReplace: $('#btnCancelReplace'),
  ocrModal: $('#ocrModal'),
  btnCloseOcr: $('#btnCloseOcr'),
  ocrCurrentPage: $('#ocrCurrentPage'),
  ocrPageLabel: $('#ocrPageLabel'),
  ocrImageInput: $('#ocrImageInput'),
  ocrStatus: $('#ocrStatus'),
  ocrProgress: $('#ocrProgress'),
  ocrBarFill: $('#ocrBarFill'),
  ocrProgressText: $('#ocrProgressText'),
  ocrText: $('#ocrText'),
  ocrMeta: $('#ocrMeta'),
  ocrCharCount: $('#ocrCharCount'),
  btnOcrCopy: $('#btnOcrCopy'),
  btnOcrNewPage: $('#btnOcrNewPage'),
  btnOcrApply: $('#btnOcrApply'),
  busyOverlay: $('#busyOverlay'),
  busyTitle: $('#busyTitle'),
  busyDetail: $('#busyDetail'),
  busyBar: $('#busyBar'),
  toastStack: $('#toastStack'),
};

const state = {
  docOpen: false,
  fileName: '',
  originalBytes: null,
  originalPdfDoc: null,
  sourceDocs: {},
  pages: [],
  activeIndex: 0,
  activeBlockId: null,
  currentBlocks: [],
  zoom: 1,
  fitMode: 'page',
  mode: 'select',
  blockCache: new Map(),
  thumbObserver: null,
  thumbQueue: Promise.resolve(),
  history: { past: [], future: [] },
  session: null,
  dirty: false,
  exported: false,
  busy: false,
  pageSeq: 0,
  blockSeq: 0,
  renderToken: 0,
  miniToken: 0,
  suppressUi: false,
  snapEnabled: true,
  transform: null,
  suppressClickUntil: 0,
  wheelLockUntil: 0,
  replacement: null,
  ocrBusy: false,
  ocrRunId: 0,
  ocrSourceLabel: '',
  ocrPreviewUrl: '',
  ocrPageResult: null,
  replacementSelected: 0,
};

const MAX_HISTORY = 40;
const MIN_ZOOM = 0.18;
const MAX_ZOOM = 3.2;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function isTypingTarget(target) {
  return Boolean(target?.closest?.('input, select, textarea, [contenteditable="true"]'));
}

function normalizeHex(value) {
  let hex = String(value || '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return `#${hex.toUpperCase()}`;
}

function clampHex(value, fallback = '#1B2420') {
  return normalizeHex(value) || fallback;
}

function pageLabelSize(width, height) {
  const near = (a, b, tol = 6) => Math.abs(a - b) <= tol;
  if ((near(width, 595.28) && near(height, 841.89)) || (near(height, 595.28) && near(width, 841.89))) {
    return 'A4';
  }
  if ((near(width, 612) && near(height, 792)) || (near(height, 612) && near(width, 792))) {
    return 'Letter';
  }
  if ((near(width, 419.53) && near(height, 595.28)) || (near(height, 419.53) && near(width, 595.28))) {
    return 'A5';
  }
  return `${Math.round(width)} × ${Math.round(height)} pt`;
}

function pageSizeDetail(width, height) {
  const mmW = Math.round(width / 72 * 25.4);
  const mmH = Math.round(height / 72 * 25.4);
  return `${pageLabelSize(width, height)} · ${mmW} × ${mmH} mm`;
}

function safeFileName(name) {
  return String(name || 'document.pdf').replace(/\.pdf$/i, '');
}

function getPage() {
  return state.pages[state.activeIndex] || null;
}

function getSource(page) {
  if (!page) return null;
  return state.sourceDocs[page.sourceId] || null;
}

function editableBlockCount(page) {
  if (!page) return 0;
  return new Set([
    ...state.currentBlocks.map((block) => block.id),
    ...page.edits.map((block) => block.id),
  ]).size;
}

function getSessionBlock() {
  if (!state.session) return null;
  const page = state.pages[state.session.pageIndex];
  return page?.edits.find((block) => block.id === state.session.blockId) || null;
}

function getActiveElement() {
  if (!state.activeBlockId) return null;
  return dom.blockLayer.querySelector(`[data-block-id="${cssEscape(state.activeBlockId)}"]`);
}

function cssEscape(value) {
  if (window.CSS?.escape) return window.CSS.escape(value);
  return String(value).replace(/["\\]/g, '\\$&');
}

function toast(message, type = 'ok') {
  const node = document.createElement('div');
  node.className = `toast${type === 'error' ? ' is-error' : ''}`;
  const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  icon.setAttribute('class', 'icon');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', type === 'error' ? '#i-info' : '#i-check');
  icon.appendChild(use);
  const text = document.createElement('span');
  text.textContent = message;
  node.append(icon, text);
  dom.toastStack.appendChild(node);
  setTimeout(() => {
    node.style.opacity = '0';
    node.style.transform = 'translateY(4px)';
    node.style.transition = '.18s ease';
    setTimeout(() => node.remove(), 200);
  }, type === 'error' ? 5200 : 3000);
}

function showBusy(title, detail = '请稍候…', progress = null) {
  state.busy = true;
  dom.busyOverlay.hidden = false;
  dom.busyTitle.textContent = title;
  dom.busyDetail.textContent = detail;
  dom.busyBar.style.width = progress == null ? '18%' : `${clamp(progress, 0, 100)}%`;
  updateToolbarState();
}

function updateBusy(progress, detail) {
  if (!dom.busyOverlay.hidden) {
    dom.busyBar.style.width = `${clamp(progress, 0, 100)}%`;
    if (detail) dom.busyDetail.textContent = detail;
  }
}

function hideBusy() {
  state.busy = false;
  dom.busyOverlay.hidden = true;
  updateToolbarState();
}

function updateToolbarState() {
  const usable = state.docOpen && !state.busy;
  dom.toolSelect.disabled = !usable;
  dom.toolText.disabled = !usable;
  dom.toolReplace.disabled = !usable;
  dom.btnOcr.disabled = !usable || state.ocrBusy;
  dom.btnOpenAnother.disabled = !usable;
  dom.btnOpenDocPage.disabled = !usable;
  dom.btnOcrPage.disabled = !usable || state.ocrBusy;
  dom.btnExport.disabled = !usable;
  dom.btnAddBlank.disabled = !usable;
  dom.btnUndo.disabled = !usable || !state.history.past.length;
  dom.btnRedo.disabled = !usable || !state.history.future.length;
  for (const button of [
    dom.btnZoomOut, dom.btnZoomIn, dom.btnFitPage, dom.zoomValue,
    dom.btnRotateLeft, dom.btnRotateRight,
  ]) {
    button.disabled = !usable;
  }
}

function updateFileUi() {
  const hasDoc = state.docOpen;
  dom.docPill.classList.toggle('is-open', hasDoc);
  dom.fileName.textContent = hasDoc ? state.fileName : '尚未打开文档';
  if (hasDoc) {
    dom.fileState.textContent = state.busy
      ? '正在处理…'
      : state.dirty
        ? `共 ${state.pages.length} 页 · 有未导出的修改`
        : state.exported
          ? `共 ${state.pages.length} 页 · 已导出`
          : `共 ${state.pages.length} 页 · 全部在本地处理`;
    dom.docCrumb.textContent = safeFileName(state.fileName);
    dom.pageCount.textContent = String(state.pages.length);
    dom.pageCrumb.textContent = state.pages.length ? `第 ${state.activeIndex + 1} 页` : '未选择页面';
  } else {
    dom.fileState.textContent = '全部处理均在本地完成';
    dom.docCrumb.textContent = '文档';
    dom.pageCrumb.textContent = '未选择页面';
    dom.pageCount.textContent = '0';
  }
  updateToolbarState();
}

function updateZoomUi() {
  const value = `${Math.round(state.zoom * 100)}%`;
  dom.zoomValue.textContent = value;
  dom.statusZoom.textContent = value;
}

function updateStatus() {
  const page = getPage();
  if (!state.docOpen || !page) {
    dom.statusText.textContent = '等待打开 PDF';
    dom.statusPage.textContent = '— / —';
    dom.statusText.parentElement.querySelector('.status-light')?.classList.remove('is-live');
    return;
  }
  let text = `第 ${state.activeIndex + 1} 页 · ${editableBlockCount(page)} 个文本块`;
  if (state.session) {
    const block = getSessionBlock();
    const fit = block?.fit;
    if (state.session.moveMode) {
      text = '移动模式 · 方向键微调 · Shift 加速 · Alt+M 退出';
    } else if (fit) {
      const compression = Math.round(fit.compression * 100);
      text = `正在编辑 · ${fit.lineCount} 行${compression ? ` · 已压缩 ${compression}%` : ' · 自动换行'}`;
    }
  } else if (page.edits.length) {
    text += ` · ${page.edits.length} 处修改`;
  }
  dom.statusText.textContent = text;
  dom.statusPage.textContent = `${state.activeIndex + 1} / ${state.pages.length}`;
  dom.statusText.parentElement.querySelector('.status-light')?.classList.add('is-live');
}

function updateChips() {
  if (!state.docOpen) {
    dom.textLayerChip.classList.remove('is-ready');
    dom.textLayerChip.innerHTML = '<span class="chip-dot"></span>文本层待识别';
    dom.fitChip.innerHTML = '<svg class="icon"><use href="#i-spark"/></svg>单页智能适配';
    return;
  }
  const page = getPage();
  const count = editableBlockCount(page);
  const rotated = Number(page?.rotation) % 360 !== 0;
  dom.textLayerChip.classList.toggle('is-ready', count > 0 && !rotated);
  dom.textLayerChip.innerHTML = `<span class="chip-dot"></span>${
    rotated ? '旋转视图 · 文字编辑暂停' : count ? `已识别 ${count} 个文本块` : '此页无文本层 · 可 OCR'
  }`;
  const edits = page?.edits.length || 0;
  dom.fitChip.innerHTML = `<svg class="icon"><use href="#i-spark"/></svg>${edits ? `${edits} 处已适配` : '单页智能适配'}`;
}

function updateHistoryButtons() {
  dom.btnUndo.disabled = !state.docOpen || state.busy || !state.history.past.length;
  dom.btnRedo.disabled = !state.docOpen || state.busy || !state.history.future.length;
}

function setDocUi(open) {
  state.docOpen = open;
  dom.welcome.hidden = open;
  dom.stageWrap.hidden = !open;
  dom.inspectorEmpty.hidden = open;
  dom.viewDock.hidden = !open;
  if (!open) {
    dom.inspectorPage.hidden = true;
    dom.inspectorBlock.hidden = true;
    dom.blockActions.hidden = true;
    dom.blockTools.hidden = true;
    if (!dom.ocrModal.hidden) {
      dom.ocrModal.hidden = true;
      state.ocrRunId += 1;
      state.ocrBusy = false;
    }
    clearGuides();
  }
  updateFileUi();
  updateChips();
}

function setMode(mode) {
  if (mode !== 'select' && !state.docOpen) return;
  if (state.session && mode === 'text') {
    commitSession({ rerender: true });
  }
  state.mode = mode;
  dom.toolSelect.classList.toggle('is-active', mode === 'select');
  dom.toolText.classList.toggle('is-active', mode === 'text');
  dom.stage.classList.toggle('is-adding', mode === 'text');
  dom.blockLayer.style.pointerEvents = mode === 'text' ? 'none' : '';
  if (mode === 'text') {
    dom.canvasScroll.style.cursor = 'crosshair';
  } else {
    dom.canvasScroll.style.cursor = '';
  }
}

function updateInspector() {
  if (!state.docOpen) {
    dom.inspectorEmpty.hidden = false;
    dom.inspectorPage.hidden = true;
    dom.inspectorBlock.hidden = true;
    dom.blockActions.hidden = true;
    return;
  }
  const sessionBlock = getSessionBlock();
  if (state.session && sessionBlock) {
    dom.inspectorEmpty.hidden = true;
    dom.inspectorPage.hidden = true;
    dom.inspectorBlock.hidden = false;
    dom.blockActions.hidden = false;
    populateBlockInspector(sessionBlock);
  } else {
    dom.inspectorEmpty.hidden = true;
    dom.inspectorBlock.hidden = true;
    dom.blockActions.hidden = true;
    dom.inspectorPage.hidden = false;
    populatePageInspector();
  }
}

function populatePageInspector() {
  const page = getPage();
  if (!page) return;
  dom.inspectPageTitle.textContent = `第 ${state.activeIndex + 1} 页`;
  const kindLabel = Number(page.rotation) % 360 !== 0
    ? `旋转 ${page.rotation}°`
    : page.kind === 'replacement' ? '替换页' : page.kind === 'blank' ? '空白页' : '原页';
  dom.inspectPageKind.textContent = kindLabel;
  dom.inspectPageKind.classList.toggle('is-replaced', page.kind === 'replacement');
  dom.statPageSize.textContent = pageSizeDetail(page.width, page.height);
  dom.statBlocks.textContent = String(editableBlockCount(page));
  dom.statEdits.textContent = String(page.edits.length);
  dom.statPosition.textContent = `${state.activeIndex + 1} / ${state.pages.length}`;
  renderMiniPage(page);
  updateOcrPageLabel();
}

function populateBlockInspector(block) {
  const original = state.session?.originalBlock || block;
  const style = block.style;
  state.suppressUi = true;

  dom.blockIndexLabel.textContent = pad2(
    Math.max(0, getPage().edits.findIndex((item) => item.id === block.id)) + 1
  );
  dom.detectedFont.textContent = original.fontMeta?.fontFace || style.fontFace || 'Sans Serif';
  dom.detectedMeta.textContent = [
    original.fontMeta?.fontName && !original.fontMeta.genericName ? original.fontMeta.fontName : original.fontMeta?.familyLabel,
    `${Number(original.style.fontSize).toFixed(1)} pt`,
    original.style.weightName || weightLabelFor(original.style.weight),
    original.style.color,
  ].filter(Boolean).join(' · ');
  dom.detectedColorSwatch.style.background = original.style.color;

  dom.fontChoice.value = style.fontChoice || 'auto';
  dom.fontFaceHint.textContent = style.fontChoice === 'auto'
    ? (original.fontMeta?.fontFace || '自动匹配')
    : style.fontChoice === 'sans' ? '无衬线' : style.fontChoice === 'serif' ? '衬线' : '等宽';
  dom.fontSize.value = Number(style.fontSize).toFixed(1).replace(/\.0$/, '');
  ensureWeightOption(style.weight);
  dom.fontWeight.value = String(Math.round(style.weight));
  dom.textColor.value = clampHex(style.color).toLowerCase();
  dom.colorHex.value = clampHex(style.color);
  dom.colorPreview.style.background = clampHex(style.color);
  dom.btnItalic.classList.toggle('is-on', Boolean(style.italic));
  dom.lineHeight.value = String(style.lineHeight);
  dom.lineHeightValue.textContent = Number(style.lineHeight).toFixed(2);
  dom.letterSpacing.value = String(style.letterSpacing || 0);
  dom.letterSpacingValue.textContent = Number(style.letterSpacing || 0).toFixed(1);
  dom.autoFitToggle.checked = block.autoFit !== false;

  for (const button of dom.alignSegment.querySelectorAll('button')) {
    button.classList.toggle('is-active', button.dataset.align === (style.align || 'left'));
  }

  updateSpecimen(block);
  updateFitMetrics(block);
  updateWordButtons(block);
  dom.snapToggle.checked = state.snapEnabled;
  updateTransformReadout();
  updateBlockTools();
  state.suppressUi = false;
}

function ensureWeightOption(weight) {
  const value = String(Math.round(weight / 50) * 50);
  if (![...dom.fontWeight.options].some((option) => option.value === value)) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = `${weightLabelFor(Number(value))} ${value}`;
    dom.fontWeight.appendChild(option);
  }
}

function updateSpecimen(block) {
  const style = block.style;
  const css = buildTextStyle(block, 1, { fontScale: 1, lineHeight: style.lineHeight });
  dom.typeSpecimen.style.fontFamily = css.fontFamily;
  dom.typeSpecimen.style.fontWeight = css.fontWeight;
  dom.typeSpecimen.style.fontStyle = css.fontStyle;
  dom.typeSpecimen.style.color = css.color;
  dom.typeSpecimen.style.letterSpacing = '0';
  dom.typeSpecimen.style.textDecoration = css.textDecoration;
}

function updateFitMetrics(block) {
  const fit = block.fit;
  if (!fit) {
    dom.metricWrap.textContent = '自动';
    dom.metricLine.textContent = '0%';
    dom.metricFont.textContent = '100%';
    dom.fitBarFill.style.width = '0%';
    dom.fitStatus.classList.remove('is-warn');
    dom.fitStatus.innerHTML = '<span class="fit-ok"></span>内容已落在原文本区域内';
    return;
  }
  const linePct = Math.round(fit.lineCompression * 100);
  const fontPct = Math.round(fit.fontCompression * 100);
  dom.metricWrap.textContent = fit.lineCount ? `${fit.lineCount} 行` : '自动';
  dom.metricLine.textContent = linePct ? `-${linePct}%` : '0%';
  dom.metricFont.textContent = fontPct ? `${Math.round(fit.fontScale * 100)}%` : '100%';
  const used = clamp(fit.measuredHeight / Math.max(0.1, fit.boxHeight) * 100, 0, 100);
  dom.fitBarFill.style.width = `${Math.max(2, Math.min(100, used))}%`;
  dom.fitStatus.classList.toggle('is-warn', fit.status === 'overflow');
  if (fit.status === 'overflow') {
    dom.fitStatus.innerHTML = '<span class="fit-ok"></span>内容已缩至最小，仍略有溢出';
  } else if (fit.fontScale < 0.5) {
    dom.fitStatus.innerHTML = `<span class="fit-ok"></span>已缩小字号 ${Math.round((1 - fit.fontScale) * 100)}% 以保持单页版式`;
  } else if (fit.compression > 0.002) {
    dom.fitStatus.innerHTML = `<span class="fit-ok"></span>已自动压缩 ${Math.round(fit.compression * 100)}%，仍在页内`;
  } else {
    dom.fitStatus.innerHTML = '<span class="fit-ok"></span>内容已落在原文本区域内';
  }
  updateStatus();
}

function setZoom(nextZoom, { render = true } = {}) {
  const clamped = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
  if (Math.abs(clamped - state.zoom) < 0.0005) return;
  if (state.session) commitSession({ rerender: false });
  state.zoom = clamped;
  updateZoomUi();
  if (render && state.docOpen) renderActivePage({ preserveScroll: true });
}

function calculateFitZoom() {
  const page = getPage();
  if (!page) return 1;
  const width = Math.max(220, dom.canvasScroll.clientWidth - 210);
  const height = Math.max(220, dom.canvasScroll.clientHeight - 126);
  return clamp(Math.min(width / page.width, height / page.height), MIN_ZOOM, 2.4);
}

function fitPage({ render = true } = {}) {
  if (!state.docOpen) return;
  state.fitMode = 'page';
  const next = calculateFitZoom();
  if (state.session) commitSession({ rerender: false });
  state.zoom = next;
  updateZoomUi();
  if (render) renderActivePage({ preserveScroll: false });
}

async function ensureBlocks(page) {
  if (!page) return [];
  if (state.blockCache.has(page.id)) return state.blockCache.get(page.id);
  const source = getSource(page);
  try {
    const blocks = await analyzePage(page, source, 2);
    state.blockCache.set(page.id, blocks);
    return blocks;
  } catch (error) {
    console.error('Text analysis failed', error);
    state.blockCache.set(page.id, []);
    toast('这一页的文本层解析失败，仍可使用页面替换。', 'error');
    return [];
  }
}

async function renderActivePage({ preserveScroll = false } = {}) {
  const page = getPage();
  if (!page) return;
  const token = ++state.renderToken;
  const source = getSource(page);

  dom.pageCanvas.style.width = `${page.width * state.zoom}px`;
  dom.pageCanvas.style.height = `${page.height * state.zoom}px`;
  dom.stage.style.width = `${page.width * state.zoom}px`;
  dom.stage.style.height = `${page.height * state.zoom}px`;

  const blocksPromise = ensureBlocks(page);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  try {
    await renderPage(page, source, dom.pageCanvas, state.zoom, dpr);
  } catch (error) {
    console.error('Page render failed', error);
    toast('页面渲染失败，请尝试重新打开文件。', 'error');
    return;
  }
  const blocks = await blocksPromise;
  if (token !== state.renderToken) return;

  state.currentBlocks = blocks;
  renderBlockOverlays();
  updateFileUi();
  updateChips();
  updateStatus();
  updateZoomUi();
  dom.pageCaption.textContent = `第 ${state.activeIndex + 1} 页`;
  dom.pageSizeCaption.textContent = pageLabelSize(page.width, page.height);
  updateInspector();
  updatePageCrumb();
  markActiveThumbnail();

  if (!preserveScroll) {
    dom.canvasScroll.scrollTop = 0;
  }
}

function updatePageCrumb() {
  if (!state.docOpen) return;
  dom.pageCrumb.textContent = `第 ${state.activeIndex + 1} 页${getPage()?.kind === 'replacement' ? ' · 替换' : ''}`;
}

function renderBlockOverlays() {
  const page = getPage();
  if (!page) return;
  dom.blockLayer.innerHTML = '';
  const editedMap = new Map(page.edits.map((block) => [block.id, block]));
  const detected = state.currentBlocks.filter((block) => !editedMap.has(block.id));
  const blocks = [...detected, ...page.edits];

  // The original text area stays erased even when the editable box is moved or
  // resized. Otherwise the untouched PDF glyphs would peek out at the old spot.
  for (const block of page.edits) {
    if (!block.sourceRect) continue;
    const patch = document.createElement('div');
    patch.className = 'source-patch';
    const rect = block.sourceRect;
    patch.style.left = `${(rect.x - 1.5) * state.zoom}px`;
    patch.style.top = `${(rect.y - 1.5) * state.zoom}px`;
    patch.style.width = `${(rect.width + 3) * state.zoom}px`;
    patch.style.height = `${(rect.height + 3) * state.zoom}px`;
    patch.style.background = block.patchColor || '#FFFFFF';
    dom.blockLayer.appendChild(patch);
  }

  for (const block of blocks) {
    const isEdited = editedMap.has(block.id);
    const element = createBlockElement(block, isEdited);
    dom.blockLayer.appendChild(element);
    if (isEdited) {
      const fit = layoutBlock(element, block, state.zoom, { editable: block.id === state.activeBlockId });
      element.classList.toggle('is-overflow', fit.status === 'overflow');
    }
  }
  if (state.activeBlockId) {
    const active = getActiveElement();
    if (active) {
      active.contentEditable = state.session?.moveMode ? 'false' : 'true';
      active.spellcheck = false;
      active.setAttribute('role', 'textbox');
      active.setAttribute('aria-multiline', 'true');
      active.classList.toggle('is-move-mode', Boolean(state.session?.moveMode));
      if (!state.session?.moveMode) requestAnimationFrame(() => focusEditorAtEnd(active));
      active.addEventListener('pointerdown', handleActiveBlockPointerDown);
    }
  }
  updateBlockTools();
  updateTransformReadout();
}

function createBlockElement(block, isEdited) {
  const element = document.createElement('div');
  element.className = 'pdf-block';
  element.dataset.blockId = block.id;
  element.style.left = `${block.x * state.zoom}px`;
  element.style.top = `${block.y * state.zoom}px`;
  element.style.width = `${block.width * state.zoom}px`;
  element.style.setProperty('--patch', block.patchColor || '#FFFFFF');
  element.style.setProperty('--patch-pad', `${Math.max(1.2, 2 * state.zoom)}px`);

  if (!isEdited) {
    element.classList.add('is-hit');
    element.style.left = `${(block.x - 2) * state.zoom}px`;
    element.style.top = `${(block.y - 2) * state.zoom}px`;
    element.style.width = `${(block.width + 4) * state.zoom}px`;
    element.style.height = `${(block.height + 4) * state.zoom}px`;
    element.setAttribute('aria-label', `编辑文字：${block.text.slice(0, 40)}`);
    element.addEventListener('click', (event) => {
      event.stopPropagation();
      if (state.mode === 'text') {
        addTextAt(event.clientX, event.clientY);
        return;
      }
      startEdit(block);
    });
    return element;
  }

  element.classList.add('is-edited');
  if (block.id === state.activeBlockId) element.classList.add('is-active');
  element.textContent = block.text || '';
  element.dataset.placeholder = '输入文字…';
  element.addEventListener('click', (event) => {
    event.stopPropagation();
    if (state.mode === 'text') {
      addTextAt(event.clientX, event.clientY);
      return;
    }
    if (state.session?.blockId !== block.id) startEdit(block);
  });
  if (block.id === state.activeBlockId) {
    element.contentEditable = 'true';
    element.spellcheck = false;
    element.setAttribute('role', 'textbox');
    element.setAttribute('aria-multiline', 'true');
    element.addEventListener('input', handleEditorInput);
    element.addEventListener('paste', handleEditorPaste);
  }
  return element;
}

function focusEditorAtEnd(element) {
  if (!element || !element.isContentEditable) return;
  element.focus({ preventScroll: true });
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function formatPt(value, decimals = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return number.toFixed(decimals).replace(/\.0+$/, '');
}

function updateBlockTools() {
  const block = getSessionBlock();
  const element = getActiveElement();
  if (!state.session || !block || !element) {
    dom.blockTools.hidden = true;
    return;
  }
  const zoom = state.zoom;
  const height = parseFloat(element.style.height) || (block.fit?.boxHeight || block.height) * zoom;
  dom.blockTools.hidden = false;
  dom.blockTools.style.left = `${block.x * zoom}px`;
  dom.blockTools.style.top = `${block.y * zoom}px`;
  dom.blockTools.style.width = `${block.width * zoom}px`;
  dom.blockTools.style.height = `${height}px`;
  dom.blockSizeBadge.textContent = `${formatPt(block.width, 0)} × ${formatPt(height / zoom, 0)} pt`;
  dom.btnMoveMode.classList.toggle('is-active', Boolean(state.session.moveMode));
  const label = dom.btnMoveMode.querySelector('span');
  if (label) label.textContent = state.session.moveMode ? '正在移动' : '移动模式';
}

function updateTransformReadout() {
  const block = getSessionBlock();
  if (!block) {
    dom.blockXValue.textContent = '—';
    dom.blockYValue.textContent = '—';
    dom.blockWValue.textContent = '—';
    dom.blockHValue.textContent = '—';
    return;
  }
  dom.blockXValue.textContent = formatPt(block.x);
  dom.blockYValue.textContent = formatPt(block.y);
  dom.blockWValue.textContent = formatPt(block.width);
  dom.blockHValue.textContent = formatPt(block.fit?.boxHeight || block.height);
}

function clearGuides() {
  dom.guideLayer.hidden = true;
  dom.guideV.hidden = true;
  dom.guideH.hidden = true;
}

function showGuide(axis, value) {
  const pos = value * state.zoom;
  dom.guideLayer.hidden = false;
  if (axis === 'v') {
    dom.guideV.hidden = false;
    dom.guideV.style.left = `${pos}px`;
  } else {
    dom.guideH.hidden = false;
    dom.guideH.style.top = `${pos}px`;
  }
}

function getSnapTargets(block) {
  const page = getPage();
  const xs = new Set([0, page.width / 2, page.width]);
  const ys = new Set([0, page.height / 2, page.height]);
  const blocks = [...state.currentBlocks, ...page.edits];
  for (const other of blocks) {
    if (other.id === block.id) continue;
    xs.add(other.x);
    xs.add(other.x + other.width / 2);
    xs.add(other.x + other.width);
    ys.add(other.y);
    ys.add(other.y + other.height / 2);
    ys.add(other.y + other.height);
  }
  return { xs: [...xs], ys: [...ys] };
}

function findClosestSnap(values, targets, threshold) {
  let best = null;
  for (const value of values) {
    for (const target of targets) {
      const distance = Math.abs(target - value);
      if (distance <= threshold && (!best || distance < best.distance)) {
        best = { target, distance, delta: target - value, value };
      }
    }
  }
  return best;
}

function handleActiveBlockPointerDown(event) {
  if (!state.session || event.button !== 0) return;
  if (state.session.moveMode || event.altKey) {
    beginTransform(event, 'move', 'move');
  }
}

function beginTransform(event, type, direction) {
  const block = getSessionBlock();
  const element = getActiveElement();
  const page = getPage();
  if (!block || !element || !page || state.busy) return;
  event.preventDefault();
  event.stopPropagation();
  clearGuides();
  state.transform = {
    type,
    direction,
    blockId: block.id,
    startX: event.clientX,
    startY: event.clientY,
    origin: {
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.fit?.boxHeight || block.height,
    },
    pageWidth: page.width,
    pageHeight: page.height,
    moved: false,
  };
  document.body.classList.add('is-transforming');
  state.suppressClickUntil = Number.POSITIVE_INFINITY;
  window.addEventListener('pointermove', applyTransform);
  window.addEventListener('pointerup', endTransform, { once: true });
  window.addEventListener('pointercancel', endTransform, { once: true });
}

function applyTransform(event) {
  const transform = state.transform;
  if (!transform) return;
  const block = getSessionBlock();
  const element = getActiveElement();
  if (!block || !element) return;
  const zoom = state.zoom;
  const dx = (event.clientX - transform.startX) / zoom;
  const dy = (event.clientY - transform.startY) / zoom;
  if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) transform.moved = true;

  const origin = transform.origin;
  let x = origin.x;
  let y = origin.y;
  let width = origin.width;
  let height = origin.height;
  let heightChanged = false;

  if (transform.type === 'move') {
    x = origin.x + dx;
    y = origin.y + dy;
    const ctx = getSnapTargets(block);
    const sx = findClosestSnap([x, x + width / 2, x + width], ctx.xs, 6 / zoom);
    const sy = findClosestSnap([y, y + height / 2, y + height], ctx.ys, 6 / zoom);
    clearGuides();
    if (sx) {
      showGuide('v', sx.target);
      if (state.snapEnabled && !event.shiftKey) x += sx.delta;
    }
    if (sy) {
      showGuide('h', sy.target);
      if (state.snapEnabled && !event.shiftKey) y += sy.delta;
    }
    x = clamp(x, 0, Math.max(0, transform.pageWidth - width));
    y = clamp(y, 0, Math.max(0, transform.pageHeight - height));
    block.x = x;
    block.y = y;
    element.style.left = `${x * zoom}px`;
    element.style.top = `${y * zoom}px`;
  } else {
    const dir = transform.direction;
    if (dir.includes('e')) width = origin.width + dx;
    if (dir.includes('w')) {
      width = origin.width - dx;
      x = origin.x + dx;
    }
    if (dir.includes('s')) {
      height = origin.height + dy;
      heightChanged = true;
    }
    if (dir.includes('n')) {
      height = origin.height - dy;
      y = origin.y + dy;
      heightChanged = true;
    }

    const minWidth = 28;
    const minHeight = 6;
    if (width < minWidth) {
      if (dir.includes('w')) x = origin.x + origin.width - minWidth;
      width = minWidth;
    }
    if (height < minHeight) {
      if (dir.includes('n')) y = origin.y + origin.height - minHeight;
      height = minHeight;
    }

    const ctx = getSnapTargets(block);
    const xCandidates = [];
    if (dir.includes('w')) xCandidates.push({ edge: 'left', value: x });
    if (dir.includes('e')) xCandidates.push({ edge: 'right', value: x + width });
    const yCandidates = [];
    if (dir.includes('n')) yCandidates.push({ edge: 'top', value: y });
    if (dir.includes('s')) yCandidates.push({ edge: 'bottom', value: y + height });
    const sx = findClosestSnap(xCandidates.map((item) => item.value), ctx.xs, 6 / zoom);
    const sy = findClosestSnap(yCandidates.map((item) => item.value), ctx.ys, 6 / zoom);
    clearGuides();
    if (sx) {
      showGuide('v', sx.target);
      if (state.snapEnabled && !event.shiftKey) {
        if (dir.includes('w')) {
          x += sx.delta;
          width -= sx.delta;
        } else {
          width += sx.delta;
        }
      }
    }
    if (sy) {
      showGuide('h', sy.target);
      if (state.snapEnabled && !event.shiftKey) {
        if (dir.includes('n')) {
          y += sy.delta;
          height -= sy.delta;
        } else {
          height += sy.delta;
        }
      }
    }

    x = clamp(x, 0, Math.max(0, transform.pageWidth - width));
    width = clamp(width, minWidth, transform.pageWidth - x);
    y = clamp(y, 0, Math.max(0, transform.pageHeight - height));
    height = clamp(height, minHeight, transform.pageHeight - y);

    block.x = x;
    block.y = y;
    block.width = width;
    if (heightChanged) {
      block.height = height;
      block.maxHeight = height;
    }
    element.style.left = `${x * zoom}px`;
    element.style.top = `${y * zoom}px`;
    element.style.width = `${width * zoom}px`;
    const fit = layoutBlock(element, block, zoom, { editable: !state.session?.moveMode });
    element.classList.toggle('is-overflow', fit.status === 'overflow');
    updateFitMetrics(block);
  }

  state.session.dirty = true;
  updateBlockTools();
  updateTransformReadout();
  updateChips();
  updateStatus();
}

function endTransform() {
  if (!state.transform) return;
  window.removeEventListener('pointermove', applyTransform);
  state.transform = null;
  state.suppressClickUntil = performance.now() + 280;
  clearGuides();
  document.body.classList.remove('is-transforming');
  updateBlockTools();
  updateTransformReadout();
  updateStatus();
}

function setMoveMode(next) {
  if (!state.session) return;
  const moveMode = typeof next === 'boolean' ? next : !state.session.moveMode;
  state.session.moveMode = moveMode;
  const element = getActiveElement();
  if (element) {
    element.classList.toggle('is-move-mode', moveMode);
    element.contentEditable = moveMode ? 'false' : 'true';
    if (moveMode) {
      element.blur();
      window.getSelection()?.removeAllRanges();
    } else {
      focusEditorAtEnd(element);
    }
  }
  updateBlockTools();
  updateStatus();
}

function moveBlockBy(dx, dy) {
  const block = getSessionBlock();
  const element = getActiveElement();
  const page = getPage();
  if (!block || !element || !page) return;
  block.x = clamp(block.x + dx, 0, Math.max(0, page.width - block.width));
  block.y = clamp(block.y + dy, 0, Math.max(0, page.height - (block.fit?.boxHeight || block.height)));
  element.style.left = `${block.x * state.zoom}px`;
  element.style.top = `${block.y * state.zoom}px`;
  state.session.dirty = true;
  updateBlockTools();
  updateTransformReadout();
  updateStatus();
  updateChips();
}

function handleEditorInput(event) {
  const block = getSessionBlock();
  if (!block) return;
  const element = event.currentTarget;
  const text = element.innerText.replace(/\u00a0/g, ' ').replace(/\n$/, '');
  block.text = text;
  if (state.session) state.session.dirty = true;
  scheduleActiveLayout();
}

function handleEditorPaste(event) {
  event.preventDefault();
  const text = (event.clipboardData || window.clipboardData)?.getData('text/plain') || '';
  document.execCommand('insertText', false, text.replace(/\r/g, ''));
}

let liveFrame = 0;
function scheduleActiveLayout() {
  if (liveFrame) cancelAnimationFrame(liveFrame);
  liveFrame = requestAnimationFrame(() => {
    liveFrame = 0;
    const block = getSessionBlock();
    const element = getActiveElement();
    if (!block || !element) return;
    const fit = layoutBlock(element, block, state.zoom, { editable: true });
    element.classList.toggle('is-overflow', fit.status === 'overflow');
    updateFitMetrics(block);
    updateBlockTools();
    updateTransformReadout();
    updateWordButtons(block);
    updateChips();
  });
}

function snapshotPages() {
  return structuredClone(state.pages);
}

function pushHistory(pages = snapshotPages(), activeIndex = state.activeIndex) {
  state.history.past.push({ pages, activeIndex });
  if (state.history.past.length > MAX_HISTORY) state.history.past.shift();
  state.history.future = [];
  updateHistoryButtons();
}

function startEdit(sourceBlock) {
  if (!state.docOpen) return;
  if (state.session?.blockId === sourceBlock.id) return;
  if (state.session) commitSession({ rerender: false });

  const page = getPage();
  if (!page) return;
  const beforePages = snapshotPages();
  let block = page.edits.find((item) => item.id === sourceBlock.id);
  let created = false;
  if (!block) {
    block = structuredClone(sourceBlock);
    block.fit = null;
    page.edits.push(block);
    created = true;
  }
  setMode('select');
  beginSession(block, beforePages, created);
}

function beginSession(block, beforePages, created) {
  state.activeBlockId = block.id;
  state.session = {
    blockId: block.id,
    pageIndex: state.activeIndex,
    beforePages,
    originalBlock: structuredClone(block),
    created,
    dirty: false,
    moveMode: false,
  };
  renderBlockOverlays();
  updateInspector();
  requestAnimationFrame(() => {
    const active = getActiveElement();
    if (active) focusEditorAtEnd(active);
  });
  dom.inspector.scrollTop = 0;
}

function addTextAt(clientX, clientY) {
  if (!state.docOpen) return;
  const page = getPage();
  if (!page) return;
  if (Number(page.rotation) % 360 !== 0) {
    setMode('select');
    toast('旋转视图下暂不支持文字编辑，请先将页面转回正向。', 'error');
    return;
  }
  if (state.session) commitSession({ rerender: false });

  const rect = dom.stage.getBoundingClientRect();
  let x = (clientX - rect.left) / state.zoom;
  let y = (clientY - rect.top) / state.zoom;
  x = clamp(x, 20, page.width - 80);
  y = clamp(y, 18, page.height - 36);

  // Clicking on existing copy should edit it instead of stacking a second text
  // box on top of the original paragraph.
  const occupied = [...state.currentBlocks, ...page.edits].find((block) => (
    x >= block.x && x <= block.x + block.width &&
    y >= block.y && y <= block.y + block.height
  ));
  if (occupied) {
    setMode('select');
    const existing = page.edits.find((block) => block.id === occupied.id) || occupied;
    startEdit(existing);
    return;
  }

  const style = nearestBlockStyle(state.currentBlocks, x, y);
  const width = clamp(Math.min(360, page.width - x - 30), 70, 520);
  const lineHeight = clamp(style.lineHeight || 1.4, 1, 1.8);
  const patchColor = sampleStageColor(clientX, clientY);
  const beforePages = snapshotPages();

  const block = {
    id: `new-${++state.blockSeq}`,
    text: '',
    x,
    y,
    width,
    height: style.fontSize * lineHeight,
    maxHeight: Math.max(style.fontSize * lineHeight, page.height - y - 24),
    kind: 'new',
    sourceRect: null,
    style: {
      ...style,
      underline: false,
      strike: false,
      align: style.align === 'justify' ? 'left' : style.align,
    },
    fontMeta: {
      fontName: 'Context style',
      fontFace: style.fontFace || 'Sans Serif',
      family: style.family || 'sans',
      familyLabel: style.fontFace || 'Sans Serif',
      weight: style.weight,
      weightName: weightLabelFor(style.weight),
      weightSource: 'context',
      italic: style.italic,
      genericName: false,
    },
    appearance: null,
    patchColor,
    confidence: 1,
    autoFit: true,
    fit: null,
    detectedStyle: structuredClone({ ...style, underline: false, strike: false }),
  };
  page.edits.push(block);
  setMode('select');
  beginSession(block, beforePages, true);
}

function sampleStageColor(clientX, clientY) {
  try {
    const canvas = dom.pageCanvas;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((clientY - rect.top) * (canvas.height / rect.height));
    const data = canvas.getContext('2d').getImageData(x, y, 1, 1).data;
    return `#${[data[0], data[1], data[2]].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
  } catch {
    return '#FFFFFF';
  }
}

function commitSession({ saveHistory = true, rerender = true } = {}) {
  const session = state.session;
  if (!session) return;
  const page = state.pages[session.pageIndex];
  const block = page?.edits.find((item) => item.id === session.blockId);
  let removed = false;
  if (page && block) {
    block.text = String(block.text || '').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trimEnd();
    const empty = !block.text.trim();
    const isNew = block.kind === 'new';
    // An untouched detected block should fall back to the original PDF text.
    // An empty brand-new block simply disappears. Deleting all text inside an
    // existing edit is different: the empty patch intentionally erases it.
    if ((!session.dirty && session.created) || (empty && isNew)) {
      page.edits = page.edits.filter((item) => item.id !== block.id);
      removed = true;
    }
  }
  const changed = Boolean(session.dirty && !removed);

  if (saveHistory && changed) {
    state.history.past.push({ pages: session.beforePages, activeIndex: session.pageIndex });
    if (state.history.past.length > MAX_HISTORY) state.history.past.shift();
    state.history.future = [];
    state.dirty = true;
    state.exported = false;
  }

  state.session = null;
  state.activeBlockId = null;
  dom.blockTools.hidden = true;
  clearGuides();
  updateHistoryButtons();
  if (rerender) {
    renderBlockOverlays();
    updateInspector();
    updateChips();
    updateStatus();
    updateFileUi();
    updateThumbBadge(page);
  } else {
    updateThumbBadge(page);
  }
}

function cancelSession() {
  const session = state.session;
  if (!session) return;
  const page = state.pages[session.pageIndex];
  const beforePage = session.beforePages.find((item) => item.id === page?.id);
  if (page && beforePage) {
    page.edits = structuredClone(beforePage.edits);
  }
  state.session = null;
  state.activeBlockId = null;
  dom.blockTools.hidden = true;
  clearGuides();
  renderBlockOverlays();
  updateInspector();
  updateChips();
  updateStatus();
  updateFileUi();
}

function undo() {
  if (!state.docOpen || !state.history.past.length) return;
  if (state.session) cancelSession();
  const current = { pages: snapshotPages(), activeIndex: state.activeIndex };
  const entry = state.history.past.pop();
  state.history.future.push(current);
  state.pages = entry.pages;
  state.activeIndex = clamp(entry.activeIndex, 0, state.pages.length - 1);
  state.blockCache.clear();
  state.dirty = true;
  state.exported = false;
  rebuildThumbnails();
  renderActivePage();
  updateHistoryButtons();
  updateFileUi();
  toast('已撤销上一步');
}

function redo() {
  if (!state.docOpen || !state.history.future.length) return;
  if (state.session) cancelSession();
  const current = { pages: snapshotPages(), activeIndex: state.activeIndex };
  const entry = state.history.future.pop();
  state.history.past.push(current);
  state.pages = entry.pages;
  state.activeIndex = clamp(entry.activeIndex, 0, state.pages.length - 1);
  state.blockCache.clear();
  state.dirty = true;
  state.exported = false;
  rebuildThumbnails();
  renderActivePage();
  updateHistoryButtons();
  updateFileUi();
  toast('已重做');
}

async function gotoPage(index, { fit = false, scroll = true, align = 'top' } = {}) {
  if (!state.docOpen) return;
  if (index < 0 || index >= state.pages.length) return;
  if (state.session) commitSession({ rerender: false });
  state.activeIndex = index;
  state.activeBlockId = null;
  if (fit || state.fitMode === 'page') {
    state.zoom = calculateFitZoom();
    updateZoomUi();
  }
  await renderActivePage({ preserveScroll: !scroll });
  markActiveThumbnail();
  if (scroll) {
    dom.canvasScroll.scrollTop = align === 'bottom'
      ? dom.canvasScroll.scrollHeight
      : 0;
  }
}

function markActiveThumbnail() {
  const items = dom.thumbList.querySelectorAll('.thumb-item');
  items.forEach((item, index) => {
    const active = index === state.activeIndex;
    item.classList.toggle('is-active', active);
    if (active) item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

function makeThumbMeta(page) {
  const badges = [];
  if (page.kind === 'replacement') badges.push('<span class="thumb-badge is-replaced">替换</span>');
  if (page.kind === 'blank') badges.push('<span class="thumb-badge">空白</span>');
  if (page.edits.length) badges.push('<span class="thumb-badge is-edit">已编辑</span>');
  return badges.join('');
}

function rebuildThumbnails() {
  state.thumbObserver?.disconnect();
  if (!state.docOpen || !state.pages.length) {
    dom.thumbList.innerHTML = `
      <div class="rail-empty">
        <div class="rail-empty-lines"><span></span><span></span><span></span></div>
        <p>打开 PDF 后<br>页面会出现在这里</p>
      </div>`;
    return;
  }

  const maxW = 104;
  const maxH = 134;
  dom.thumbList.innerHTML = state.pages.map((page, index) => {
    const scale = Math.min(maxW / page.width, maxH / page.height);
    const width = Math.round(page.width * scale);
    const height = Math.round(page.height * scale);
    return `
      <button class="thumb-item${index === state.activeIndex ? ' is-active' : ''}" data-index="${index}" type="button" aria-label="第 ${index + 1} 页">
        <span class="thumb-active-line"></span>
        <span class="thumb-frame">
          <span class="thumb-paper is-skeleton" data-page-id="${page.id}" data-thumb-scale="${scale}" style="width:${width}px;height:${height}px"></span>
        </span>
        <span class="thumb-meta">
          <span class="thumb-num">${pad2(index + 1)}</span>
          <span class="thumb-badges">${makeThumbMeta(page)}</span>
        </span>
      </button>`;
  }).join('');

  const papers = [...dom.thumbList.querySelectorAll('.thumb-paper')];
  if ('IntersectionObserver' in window) {
    state.thumbObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const paper = entry.target;
          state.thumbObserver.unobserve(paper);
          enqueueThumb(paper);
        }
      }
    }, { root: dom.thumbList, rootMargin: '220px 0px' });
    papers.forEach((paper) => state.thumbObserver.observe(paper));
  } else {
    papers.forEach((paper) => enqueueThumb(paper));
  }

  const activePaper = papers[state.activeIndex];
  if (activePaper) {
    state.thumbObserver?.unobserve(activePaper);
    enqueueThumb(activePaper, true);
  }
}

function enqueueThumb(paper) {
  if (!paper || paper.dataset.rendered === '1' || paper.dataset.queued === '1') return;
  paper.dataset.queued = '1';
  state.thumbQueue = state.thumbQueue.then(() => renderThumbPaper(paper)).catch((error) => {
    console.error('Thumbnail failed', error);
  });
}

async function renderThumbPaper(paper) {
  if (!paper.isConnected) return;
  const index = [...dom.thumbList.querySelectorAll('.thumb-paper')].indexOf(paper);
  const page = state.pages[index];
  if (!page) return;
  const scale = Number(paper.dataset.thumbScale) || 0.15;
  const canvas = document.createElement('canvas');
  try {
    await renderPage(page, getSource(page), canvas, scale, 1);
    if (!paper.isConnected) return;
    paper.classList.remove('is-skeleton');
    paper.innerHTML = '';
    paper.appendChild(canvas);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'contain';
    paper.dataset.rendered = '1';
  } catch (error) {
    console.error('Thumbnail failed', error);
  }
}

function updateThumbBadge(page) {
  if (!page) return;
  const index = state.pages.findIndex((item) => item.id === page.id);
  const item = dom.thumbList.querySelector(`.thumb-item[data-index="${index}"]`);
  if (!item) return;
  const badges = item.querySelector('.thumb-badges');
  if (badges) badges.innerHTML = makeThumbMeta(page);
}

function resetToWelcome() {
  setDocUi(false);
  state.docOpen = false;
  state.pages = [];
  state.currentBlocks = [];
  state.activeIndex = 0;
  state.history = { past: [], future: [] };
  state.blockCache.clear();
  dom.thumbList.innerHTML = `
    <div class="rail-empty">
      <div class="rail-empty-lines"><span></span><span></span><span></span></div>
      <p>打开 PDF 后<br>页面会出现在这里</p>
    </div>`;
  dom.pageCount.textContent = '0';
  updateHistoryButtons();
}

async function openDocument(bytes, name) {
  if (state.busy) return;
  if (state.docOpen && state.dirty) {
    const proceed = window.confirm('当前文档还有未导出的修改，打开新文件会丢失这些修改。继续吗？');
    if (!proceed) return;
  }

  showBusy('正在打开 PDF', '读取页面与字体信息…', 8);
  let pdfDoc = null;
  try {
    pdfDoc = await openPdf(bytes);
    const pages = [];
    for (let i = 0; i < pdfDoc.numPages; i += 1) {
      const proxy = await pdfDoc.getPage(i + 1);
      const viewport = proxy.getViewport({ scale: 1 });
      pages.push({
        id: `page-${++state.pageSeq}`,
        kind: 'original',
        sourceId: 'original',
        sourcePageIndex: i,
        width: viewport.width,
        height: viewport.height,
        rotation: 0,
        edits: [],
      });
      updateBusy(10 + (i / pdfDoc.numPages) * 55, `读取第 ${i + 1} / ${pdfDoc.numPages} 页`);
    }

    if (state.originalPdfDoc) closeDocument(state.originalPdfDoc);
    for (const [id, source] of Object.entries(state.sourceDocs)) {
      if (id !== 'original' && source?.pdfDoc) closeDocument(source.pdfDoc);
    }
    const raw = bytesCopy(bytes);
    let fontCatalog = [];
    updateBusy(70, '读取字体表与字重…');
    try {
      fontCatalog = await readPdfFontCatalog(raw);
    } catch (error) {
      console.warn('Font catalog unavailable', error);
    }
    state.fileName = name || 'document.pdf';
    state.originalBytes = raw;
    state.originalPdfDoc = pdfDoc;
    state.sourceDocs = {
      original: {
        id: 'original',
        kind: 'original',
        pdfDoc,
        bytes: raw,
        name: state.fileName,
        fontCatalog,
      },
    };
    state.pages = pages;
    state.activeIndex = 0;
    state.activeBlockId = null;
    state.session = null;
    state.history = { past: [], future: [] };
    state.blockCache.clear();
    state.dirty = false;
    state.exported = false;
    state.blockSeq = 0;
    state.fitMode = 'page';

    setDocUi(true);
    dom.fileName.title = state.fileName;
    rebuildThumbnails();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    state.zoom = calculateFitZoom();
    updateZoomUi();
    await renderActivePage({ preserveScroll: false });
    updateBusy(100, '完成');
    toast(`已打开 · ${state.pages.length} 页`);
  } catch (error) {
    console.error('Open failed', error);
    if (pdfDoc) closeDocument(pdfDoc);
    toast(`无法打开这个 PDF：${error?.message || '文件格式不支持'}`, 'error');
    if (!state.docOpen) resetToWelcome();
  } finally {
    hideBusy();
    updateFileUi();
  }
}

async function loadSample() {
  try {
    const response = await fetch('./sample.pdf', { cache: 'no-store' });
    if (!response.ok) throw new Error('示例文件不存在');
    const bytes = await response.arrayBuffer();
    await openDocument(bytes, 'Folio 示例 · 山野之间.pdf');
  } catch (error) {
    console.error(error);
    toast('示例文档尚未生成，请直接打开自己的 PDF。', 'error');
  }
}

function handleFileInput(file) {
  if (!file) return;
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
    toast('请选择 PDF 文件。', 'error');
    return;
  }
  file.arrayBuffer().then((bytes) => openDocument(bytes, file.name));
}

function requestOpenAnother() {
  if (!state.docOpen || state.busy) return;
  if (state.session?.dirty) {
    const proceed = window.confirm('当前文本块还有未应用的修改，打开新 PDF 会丢失这些修改。继续吗？');
    if (!proceed) return;
  }
  dom.fileInput.value = '';
  dom.fileInput.click();
}

function deleteCurrentPage() {
  if (!state.docOpen) return;
  if (state.pages.length <= 1) {
    toast('至少需要保留一页。', 'error');
    return;
  }
  if (!window.confirm(`确定删除第 ${state.activeIndex + 1} 页吗？`)) return;
  if (state.session) commitSession({ rerender: false });
  pushHistory();
  const [removed] = state.pages.splice(state.activeIndex, 1);
  state.blockCache.delete(removed.id);
  state.activeIndex = clamp(state.activeIndex, 0, state.pages.length - 1);
  state.activeBlockId = null;
  state.session = null;
  state.dirty = true;
  state.exported = false;
  rebuildThumbnails();
  renderActivePage();
  toast('页面已删除');
}

function insertBlankPage() {
  if (!state.docOpen) return;
  const current = getPage();
  if (!current) return;
  if (state.session) commitSession({ rerender: false });
  pushHistory();
  const page = {
    id: `page-${++state.pageSeq}`,
    kind: 'blank',
    sourceId: null,
    sourcePageIndex: 0,
    width: current.width,
    height: current.height,
    rotation: 0,
    edits: [],
  };
  state.pages.splice(state.activeIndex + 1, 0, page);
  state.activeIndex += 1;
  state.activeBlockId = null;
  state.session = null;
  state.dirty = true;
  state.exported = false;
  rebuildThumbnails();
  renderActivePage();
  toast('已插入空白页');
}

function rotateCurrentPage(delta) {
  if (!state.docOpen || state.busy) return;
  if (state.session) commitSession({ rerender: false });
  const page = getPage();
  if (!page) return;
  if (page.edits.length) {
    toast('当前页已有文字修改。请先完成并导出，或在撤销修改后再旋转。', 'error');
    return;
  }
  pushHistory();
  page.rotation = ((Number(page.rotation) || 0) + delta + 360) % 360;
  [page.width, page.height] = [page.height, page.width];
  state.blockCache.delete(page.id);
  state.currentBlocks = [];
  state.activeBlockId = null;
  state.session = null;
  state.dirty = true;
  state.exported = false;
  state.fitMode = 'page';
  state.zoom = calculateFitZoom();
  updateZoomUi();
  rebuildThumbnails();
  renderActivePage();
  updateFileUi();
  updateHistoryButtons();
  toast(`页面已${delta < 0 ? '左旋' : '右旋'} 90° · 转回正向即可继续编辑文字`);
}

function openReplaceModal() {
  if (!state.docOpen) return;
  if (state.session) commitSession({ rerender: true });
  dom.replacePageNum.textContent = pad2(state.activeIndex + 1);
  dom.replaceModal.hidden = false;
  resetReplacementCandidate(true);
  dom.replaceDrop.hidden = false;
  dom.replaceSource.hidden = true;
  dom.btnConfirmReplace.disabled = true;
  dom.keepPageSize.checked = true;
}

function closeReplaceModal() {
  dom.replaceModal.hidden = true;
  resetReplacementCandidate(true);
}

function updateOcrPageLabel() {
  if (!dom.ocrPageLabel) return;
  const page = getPage();
  const ready = state.docOpen && page;
  dom.ocrCurrentPage.disabled = !ready || state.busy || state.ocrBusy;
  dom.ocrPageLabel.textContent = ready
    ? `第 ${state.activeIndex + 1} 页 · ${Math.round(page.width)} × ${Math.round(page.height)} pt`
    : '请先打开 PDF';
}

function setOcrBusy(busy, message = '') {
  state.ocrBusy = busy;
  dom.ocrProgress.hidden = !busy;
  if (busy) {
    dom.ocrBarFill.style.width = '0%';
    dom.ocrProgressText.textContent = message || '准备中…';
    dom.btnOcrCopy.disabled = true;
    dom.btnOcrNewPage.disabled = true;
    dom.btnOcrApply.disabled = true;
  }
  dom.btnOcr.disabled = !state.docOpen || busy;
  dom.btnOcrPage.disabled = !state.docOpen || busy;
  dom.ocrCurrentPage.disabled = !state.docOpen || busy;
  updateToolbarState();
}

function setOcrProgress(message) {
  const status = String(message?.status || '准备中');
  const labels = {
    'loading tesseract core': '加载 OCR 核心',
    'loading language traineddata': '加载中文 / 英文语言包',
    'initializing api': '初始化识别引擎',
    'recognizing text': '识别文字',
  };
  const label = labels[status] || status;
  const percent = Math.round((Number(message?.progress) || 0) * 100);
  dom.ocrBarFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  dom.ocrProgressText.textContent = `${label} ${percent}%`;
  dom.ocrStatus.textContent = label;
}

function openOcrModal({ autoPage = false } = {}) {
  dom.ocrModal.hidden = false;
  state.ocrRunId += 1;
  state.ocrResultText = '';
  state.ocrPageResult = null;
  dom.ocrText.value = '';
  dom.ocrMeta.textContent = '尚未识别';
  dom.ocrCharCount.textContent = '';
  dom.ocrStatus.textContent = state.docOpen ? '选择页面或图片开始识别' : '选择一张本地图片开始识别';
  dom.ocrProgress.hidden = true;
  dom.ocrBarFill.style.width = '0%';
  dom.btnOcrCopy.disabled = true;
  dom.btnOcrNewPage.disabled = true;
  dom.btnOcrApply.disabled = true;
  updateOcrPageLabel();
  if (autoPage && state.docOpen) {
    runOcrCurrentPage();
  }
}

function closeOcrModal() {
  if (state.ocrBusy) {
    toast('OCR 正在识别，请稍候。', 'error');
    return;
  }
  dom.ocrModal.hidden = true;
  state.ocrRunId += 1;
}

function finishOcr(result, sourceLabel, pageContext = null) {
  const text = String(result.text || '');
  state.ocrPageResult = pageContext && result.lines?.length
    ? { ...pageContext, lines: result.lines }
    : null;
  dom.ocrText.value = text;
  dom.ocrMeta.textContent = `${sourceLabel} · 置信度 ${result.confidence || 0}%`;
  dom.ocrCharCount.textContent = `${text.length} 字符`;
  dom.ocrStatus.textContent = state.ocrPageResult
    ? '识别完成，可转为可编辑页或生成文字页'
    : '识别完成，可复制或生成文字页';
  dom.btnOcrCopy.disabled = !text.trim();
  dom.btnOcrNewPage.disabled = !state.docOpen || !text.trim();
  dom.btnOcrApply.disabled = !state.ocrPageResult;
  state.ocrResultText = text;
}

function ocrFailed(error) {
  console.error('OCR failed', error);
  dom.ocrStatus.textContent = '识别失败';
  dom.ocrMeta.textContent = error?.message || 'OCR 失败';
  dom.btnOcrCopy.disabled = true;
  dom.btnOcrNewPage.disabled = true;
  dom.btnOcrApply.disabled = true;
  state.ocrPageResult = null;
  toast(error?.message || 'OCR 识别失败，请换一张更清晰的图片。', 'error');
}

async function runOcrCurrentPage() {
  if (!state.docOpen || state.ocrBusy) return;
  const page = getPage();
  if (!page) return;
  if (state.session) commitSession({ rerender: false });
  const runId = ++state.ocrRunId;
  setOcrBusy(true, '正在渲染页面…');
  dom.ocrStatus.textContent = `正在准备第 ${state.activeIndex + 1} 页…`;
  try {
    const scale = Math.min(2, 3000 / Math.max(page.width, page.height));
    const canvas = await renderPageToCanvas(page, getSource(page), scale, 1);
    if (runId !== state.ocrRunId) return;
    setOcrProgress({ status: 'recognizing text', progress: 0 });
    const result = await recognizeOcr(canvas, {
      onProgress: (message) => {
        if (runId === state.ocrRunId) setOcrProgress(message);
      },
    });
    if (runId !== state.ocrRunId) return;
    finishOcr(result, `第 ${state.activeIndex + 1} 页`, {
      pageId: page.id,
      pageIndex: state.activeIndex,
      scale,
      pageWidth: page.width,
      pageHeight: page.height,
    });
  } catch (error) {
    if (runId === state.ocrRunId) {
      await resetOcrWorker();
      ocrFailed(error);
    }
  } finally {
    if (runId === state.ocrRunId) setOcrBusy(false);
  }
}

async function imageFileToOcrCanvas(file) {
  const bitmap = await createImageBitmap(file);
  const maxSide = 3000;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas;
}

async function runOcrImage(file) {
  if (!file || state.ocrBusy) return;
  if (!/^image\//.test(file.type)) {
    toast('请选择 PNG、JPG、WebP 等图片文件。', 'error');
    return;
  }
  const runId = ++state.ocrRunId;
  setOcrBusy(true, '正在读取图片…');
  dom.ocrStatus.textContent = '正在读取图片…';
  try {
    const canvas = await imageFileToOcrCanvas(file);
    if (runId !== state.ocrRunId) return;
    const result = await recognizeOcr(canvas, {
      onProgress: (message) => {
        if (runId === state.ocrRunId) setOcrProgress(message);
      },
    });
    if (runId !== state.ocrRunId) return;
    finishOcr(result, file.name || '本地图片');
  } catch (error) {
    if (runId === state.ocrRunId) {
      await resetOcrWorker();
      ocrFailed(error);
    }
  } finally {
    if (runId === state.ocrRunId) setOcrBusy(false);
  }
}

async function copyOcrText() {
  const text = dom.ocrText.value.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    toast('OCR 文字已复制。');
  } catch {
    dom.ocrText.focus();
    dom.ocrText.select();
    document.execCommand('copy');
    toast('OCR 文字已复制。');
  }
}

function samplePageColor(page, x, y) {
  try {
    const canvas = dom.pageCanvas;
    const px = clamp(Math.floor((x / page.width) * canvas.width), 0, canvas.width - 1);
    const py = clamp(Math.floor((y / page.height) * canvas.height), 0, canvas.height - 1);
    const data = canvas.getContext('2d').getImageData(px, py, 1, 1).data;
    const color = `#${[data[0], data[1], data[2]].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    const luminance = (0.299 * data[0] + 0.587 * data[1] + 0.114 * data[2]) / 255;
    return { color, luminance };
  } catch {
    return { color: '#FFFFFF', luminance: 1 };
  }
}

function sampleInkColor(page, x, y, width, height, fallback) {
  try {
    const canvas = dom.pageCanvas;
    const sx = clamp(Math.floor((x / page.width) * canvas.width), 0, canvas.width - 1);
    const sy = clamp(Math.floor((y / page.height) * canvas.height), 0, canvas.height - 1);
    const sw = clamp(Math.ceil((width / page.width) * canvas.width), 1, canvas.width - sx);
    const sh = clamp(Math.ceil((height / page.height) * canvas.height), 1, canvas.height - sy);
    const data = canvas.getContext('2d').getImageData(sx, sy, sw, sh).data;
    let best = null;
    let bestLum = 1;
    const step = Math.max(1, Math.floor(Math.sqrt((sw * sh) / 600)));
    for (let py = 0; py < sh; py += step) {
      for (let px = 0; px < sw; px += step) {
        const i = (py * sw + px) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (lum < bestLum) {
          bestLum = lum;
          best = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
        }
      }
    }
    return bestLum < 0.82 && best ? best : fallback;
  } catch {
    return fallback;
  }
}

function buildOcrLineBlocks(data, page) {
  const blocks = [];
  const scale = data.scale || 1;
  for (const line of data.lines) {
    const bbox = line.bbox;
    if (!bbox || !line.text) continue;
    if (line.confidence && line.confidence < 18) continue;
    const x = clamp(bbox.x0 / scale, 0, page.width - 4);
    const y = clamp(bbox.y0 / scale, 0, page.height - 4);
    const rawWidth = (bbox.x1 - bbox.x0) / scale;
    const rawHeight = (bbox.y1 - bbox.y0) / scale;
    if (rawWidth < 2 || rawHeight < 2) continue;
    const fontSize = clamp(rawHeight * 0.82, 5, 96);
    const width = clamp(rawWidth * 1.06 + 4, 12, page.width - x - 2);
    const height = Math.max(rawHeight, fontSize * 1.15);
    const center = (x + rawWidth / 2) / page.width;
    const rightEdge = (x + rawWidth) / page.width;
    const align = center > 0.43 && center < 0.57 && rawWidth < page.width * 0.76
      ? 'center'
      : rightEdge > 0.86 && x > page.width * 0.42 ? 'right' : 'left';
    const bgX = clamp(x + rawWidth + 5, 2, page.width - 2);
    const background = samplePageColor(page, bgX, y + rawHeight / 2);
    const fallbackColor = background.luminance < 0.48 ? '#F7F3E9' : '#1B2420';
    const color = sampleInkColor(page, x, y, rawWidth, rawHeight, fallbackColor);
    const hasCjk = /[\u3400-\u9fff\uf900-\ufaff]/.test(line.text);
    const style = {
      family: 'sans',
      fontChoice: 'auto',
      fontFace: hasCjk ? 'SimHei' : 'Arial',
      fontSize,
      weight: 400,
      weightName: 'Regular',
      italic: false,
      color,
      lineHeight: 1,
      letterSpacing: 0,
      underline: false,
      strike: false,
      align,
    };
    blocks.push({
      id: `ocr-line-${++state.blockSeq}`,
      text: line.text,
      x,
      y,
      width,
      height,
      maxHeight: height,
      kind: 'new',
      sourceRect: null,
      style,
      fontMeta: {
        fontName: 'OCR text',
        fontFace: style.fontFace,
        family: 'sans',
        familyLabel: style.fontFace,
        weight: 400,
        weightName: 'Regular',
        weightSource: 'ocr',
        italic: false,
        genericName: false,
      },
      appearance: null,
      patchColor: background.color,
      confidence: 1,
      autoFit: false,
      fit: null,
      ocr: true,
      detectedStyle: structuredClone(style),
    });
  }
  return blocks;
}

async function applyOcrEditable() {
  const data = state.ocrPageResult;
  if (!data || !data.lines?.length) {
    toast('当前结果没有按行位置信息，请使用「生成文字页」。', 'error');
    return;
  }
  if (!state.docOpen) {
    toast('请先打开 PDF。', 'error');
    return;
  }
  const page = getPage();
  if (!page || page.id !== data.pageId || state.activeIndex !== data.pageIndex) {
    toast('页面已切换，请重新识别当前页。', 'error');
    return;
  }
  if (Number(page.rotation) % 360 !== 0) {
    toast('旋转页面暂不能转换，请先转回正向。', 'error');
    return;
  }
  if (state.session) commitSession({ rerender: false });
  if (page.edits.length > 0) {
    const proceed = window.confirm('当前页已有文字修改，转为可编辑会继续叠加 OCR 文本块。继续吗？');
    if (!proceed) return;
  }
  const blocks = buildOcrLineBlocks(data, page);
  if (!blocks.length) {
    toast('没有可转换的文字行，请使用「生成文字页」。', 'error');
    return;
  }
  const beforePages = snapshotPages();
  page.edits.push(...blocks);
  state.dirty = true;
  state.exported = false;
  state.session = null;
  state.activeBlockId = null;
  pushHistory(beforePages, state.activeIndex);
  dom.ocrModal.hidden = true;
  state.ocrRunId += 1;
  renderBlockOverlays();
  updateInspector();
  updateFileUi();
  updateChips();
  updateStatus();
  toast(`已将 ${blocks.length} 行识别文字转成可编辑文本，点击任意文字即可修改。`);
}

async function insertOcrTextPage() {
  const text = dom.ocrText.value.trim();
  if (!text) {
    toast('没有可生成的 OCR 文字。', 'error');
    return;
  }
  if (!state.docOpen) {
    toast('请先打开 PDF，再生成文字页。', 'error');
    return;
  }
  if (state.busy) return;
  if (state.session) commitSession({ rerender: false });
  const reference = getPage();
  const beforePages = snapshotPages();
  const oldIndex = state.activeIndex;
  const pageWidth = reference?.width || 595.28;
  const pageHeight = reference?.height || 841.89;
  const fontSize = 16;
  const lineHeight = 1.65;
  const x = 64;
  const y = 88;
  const width = Math.max(240, pageWidth - x * 2);
  const style = {
    ...nearestBlockStyle([], x, y),
    fontFace: 'SimHei',
    family: 'sans',
    fontChoice: 'auto',
    fontSize,
    weight: 400,
    weightName: 'Regular',
    italic: false,
    color: '#1B2420',
    lineHeight,
    letterSpacing: 0,
    underline: false,
    strike: false,
    align: 'left',
  };
  const block = {
    id: `ocr-page-${++state.blockSeq}`,
    text,
    x,
    y,
    width,
    height: fontSize * lineHeight,
    maxHeight: pageHeight - y - 64,
    kind: 'new',
    sourceRect: null,
    style,
    fontMeta: {
      fontName: 'OCR text',
      fontFace: 'SimHei',
      family: 'sans',
      familyLabel: 'SimHei',
      weight: 400,
      weightName: 'Regular',
      weightSource: 'ocr',
      italic: false,
      genericName: false,
    },
    appearance: null,
    patchColor: '#FFFFFF',
    confidence: 1,
    autoFit: true,
    fit: null,
    ocr: true,
    detectedStyle: structuredClone(style),
  };
  const newPage = {
    id: `page-${++state.pageSeq}`,
    kind: 'blank',
    sourceId: 'blank',
    sourcePageIndex: 0,
    width: pageWidth,
    height: pageHeight,
    rotation: 0,
    edits: [block],
  };
  state.pages.splice(oldIndex + 1, 0, newPage);
  state.activeIndex = oldIndex + 1;
  state.activeBlockId = null;
  state.session = null;
  state.currentBlocks = [];
  state.dirty = true;
  state.exported = false;
  pushHistory(beforePages, oldIndex);
  rebuildThumbnails();
  dom.ocrModal.hidden = true;
  state.ocrRunId += 1;
  await renderActivePage({ preserveScroll: false });
  updateFileUi();
  updateInspector();
  updateChips();
  updateStatus();
  toast(`已生成第 ${state.activeIndex + 1} 页文字页，点击文字可继续编辑。`);
}

function resetReplacementCandidate(destroy = false) {
  if (destroy && state.replacement?.pdfDoc) {
    closeDocument(state.replacement.pdfDoc);
  }
  state.replacement = null;
  state.replacementSelected = 0;
  dom.replacePages.innerHTML = '';
  dom.replaceSourceName.textContent = '—';
  dom.btnConfirmReplace.disabled = true;
}

async function loadReplacementFile(file) {
  if (!file) return;
  if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
    toast('请选择 PDF 文件。', 'error');
    return;
  }
  showBusy('正在读取替换页', '解析 PDF 页面…', 12);
  let pdfDoc = null;
  try {
    const bytes = await file.arrayBuffer();
    pdfDoc = await openPdf(bytes);
    const raw = bytesCopy(bytes);
    updateBusy(42, '读取来源页字体…');
    let fontCatalog = [];
    try {
      fontCatalog = await readPdfFontCatalog(raw);
    } catch (error) {
      console.warn('Replacement font catalog unavailable', error);
    }
    const previous = state.replacement;
    state.replacement = {
      name: file.name,
      bytes: raw,
      pdfDoc,
      fontCatalog,
      numPages: pdfDoc.numPages,
    };
    if (previous?.pdfDoc) closeDocument(previous.pdfDoc);
    state.replacementSelected = 0;
    dom.replaceDrop.hidden = true;
    dom.replaceSource.hidden = false;
    dom.replaceSourceName.textContent = `${file.name} · ${pdfDoc.numPages} 页`;
    await renderReplacementPages();
    dom.btnConfirmReplace.disabled = false;
    updateBusy(100, '完成');
  } catch (error) {
    console.error('Replacement load failed', error);
    if (pdfDoc) closeDocument(pdfDoc);
    toast(`无法读取替换文件：${error?.message || '格式不支持'}`, 'error');
  } finally {
    hideBusy();
  }
}

async function renderReplacementPages() {
  const candidate = state.replacement;
  if (!candidate) return;
  dom.replacePages.innerHTML = '';
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < candidate.numPages; i += 1) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `replace-page-card${i === state.replacementSelected ? ' is-selected' : ''}`;
    card.dataset.index = String(i);
    card.innerHTML = `
      <span class="replace-page-frame"><canvas></canvas></span>
      <span class="replace-page-label">
        <span>PAGE ${pad2(i + 1)}</span>
        <span class="replace-check"><svg class="icon"><use href="#i-check"/></svg></span>
      </span>`;
    card.addEventListener('click', () => {
      state.replacementSelected = i;
      dom.replacePages.querySelectorAll('.replace-page-card').forEach((node) => {
        node.classList.toggle('is-selected', Number(node.dataset.index) === i);
      });
      dom.btnConfirmReplace.disabled = false;
    });
    fragment.appendChild(card);
  }
  dom.replacePages.appendChild(fragment);

  const cards = [...dom.replacePages.querySelectorAll('.replace-page-card')];
  for (const card of cards) {
    if (dom.replaceModal.hidden || state.replacement !== candidate) return;
    await new Promise((resolve) => setTimeout(resolve, 0));
    if (dom.replaceModal.hidden || state.replacement !== candidate) return;
    const index = Number(card.dataset.index);
    const canvas = card.querySelector('canvas');
    try {
      const proxy = await candidate.pdfDoc.getPage(index + 1);
      const viewport = proxy.getViewport({ scale: 1 });
      const scale = Math.min(94 / viewport.width, 118 / viewport.height);
      const ctxScale = scale;
      canvas.width = Math.round(viewport.width * ctxScale);
      canvas.height = Math.round(viewport.height * ctxScale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await proxy.render({
        canvasContext: ctx,
        viewport: proxy.getViewport({ scale: ctxScale }),
        background: 'rgba(255,255,255,0)',
      }).promise;
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
    } catch (error) {
      console.error('Replacement thumbnail failed', error);
    }
  }
}

async function confirmReplacePage() {
  const candidate = state.replacement;
  const page = getPage();
  if (!candidate || !page) return;
  if (page.edits.length) {
    const proceed = window.confirm('替换页面会清除当前页的文本修改，继续吗？');
    if (!proceed) return;
  }
  if (state.session) commitSession({ rerender: false });

  let width = page.width;
  let height = page.height;
  if (!dom.keepPageSize.checked) {
    const proxy = await candidate.pdfDoc.getPage(state.replacementSelected + 1);
    const viewport = proxy.getViewport({ scale: 1 });
    width = viewport.width;
    height = viewport.height;
  }

  pushHistory();
  const id = `repl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  state.sourceDocs[id] = {
    id,
    kind: 'replacement',
    pdfDoc: candidate.pdfDoc,
    bytes: candidate.bytes,
    name: candidate.name,
    fontCatalog: candidate.fontCatalog || [],
  };
  page.kind = 'replacement';
  page.sourceId = id;
  page.sourcePageIndex = state.replacementSelected;
  page.width = width;
  page.height = height;
  page.rotation = 0;
  page.edits = [];
  state.blockCache.delete(page.id);
  state.currentBlocks = [];
  state.activeBlockId = null;
  state.session = null;
  state.dirty = true;
  state.exported = false;

  // Transfer ownership of the parsed replacement document to the page model.
  state.replacement = null;
  dom.replaceModal.hidden = true;
  resetReplacementCandidate(false);
  state.zoom = state.fitMode === 'page' ? calculateFitZoom() : state.zoom;
  updateZoomUi();
  rebuildThumbnails();
  await renderActivePage();
  updateFileUi();
  updateHistoryButtons();
  toast(`已替换第 ${state.activeIndex + 1} 页`);
}

function handleZoomButton(direction) {
  if (!state.docOpen) return;
  state.fitMode = 'custom';
  const steps = [0.18, 0.25, 0.33, 0.4, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2, 2.25, 2.5, 3];
  const current = state.zoom;
  let next = current;
  if (direction > 0) {
    next = steps.find((step) => step > current + 0.001) || MAX_ZOOM;
  } else {
    next = [...steps].reverse().find((step) => step < current - 0.001) || MIN_ZOOM;
  }
  setZoom(next);
}

function handlePageWheel(event) {
  if (!state.docOpen || state.busy || state.session || !dom.replaceModal.hidden) return;
  if (event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (Math.abs(event.deltaY) < 5) return;

  const scroller = dom.canvasScroll;
  const noScroll = scroller.scrollHeight <= scroller.clientHeight + 36;
  const atTop = noScroll || scroller.scrollTop <= 2;
  const atBottom = noScroll || scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 36;
  const now = performance.now();
  if (now < state.wheelLockUntil) {
    event.preventDefault();
    return;
  }

  if (event.deltaY > 0 && atBottom && state.activeIndex < state.pages.length - 1) {
    event.preventDefault();
    state.wheelLockUntil = now + 480;
    gotoPage(state.activeIndex + 1, { align: 'top' });
  } else if (event.deltaY < 0 && atTop && state.activeIndex > 0) {
    event.preventDefault();
    state.wheelLockUntil = now + 480;
    gotoPage(state.activeIndex - 1, { align: 'bottom' });
  }
}

function exportCurrentPdf() {
  if (!state.docOpen || state.busy) return;
  if (state.session) commitSession({ rerender: true });

  showBusy('正在导出 PDF', '准备页面…', 3);
  exportPdf({
    pages: state.pages,
    sources: state.sourceDocs,
    originalBytes: state.originalBytes,
    fileName: state.fileName,
    onProgress: (done, total, page) => {
      const pct = total ? 4 + (done / total) * 92 : 50;
      if (page) {
        updateBusy(pct, `正在处理第 ${done + 1} / ${total} 页${page.edits.length ? '（栅格化文字层）' : ''}`);
      } else {
        updateBusy(98, '生成 PDF 文件…');
      }
    },
  }).then((bytes) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName(state.fileName)}-folio.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    state.dirty = false;
    state.exported = true;
    updateFileUi();
    hideBusy();
    toast('PDF 已导出 · 编辑过的页面以高分辨率保留视觉版式');
  }).catch((error) => {
    console.error('Export failed', error);
    hideBusy();
    toast(`导出失败：${error?.message || '未知错误'}`, 'error');
  });
}

function renderMiniPage(page) {
  if (!state.docOpen) return;
  const token = ++state.miniToken;
  const scale = Math.min(0.23, 170 / page.width, 104 / page.height);
  const render = page.edits.length
    ? renderCompositePage(page, getSource(page), scale)
    : (async () => {
      const canvas = document.createElement('canvas');
      await renderPage(page, getSource(page), canvas, scale, 1);
      return canvas;
    })();
  render.then((canvas) => {
    if (token !== state.miniToken || !canvas) return;
    dom.miniCanvas.width = canvas.width;
    dom.miniCanvas.height = canvas.height;
    const ctx = dom.miniCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    dom.miniCanvas.style.width = `${Math.min(canvas.width, 170)}px`;
    dom.miniCanvas.style.height = 'auto';
  }).catch((error) => {
    console.error('Mini preview failed', error);
  });
}

function updateStyleFromControls() {
  if (state.suppressUi || !state.session) return;
  const block = getSessionBlock();
  if (!block) return;
  const style = block.style;

  style.fontChoice = dom.fontChoice.value;
  const size = Number(dom.fontSize.value);
  if (Number.isFinite(size)) style.fontSize = clamp(size, 4, 144);
  style.weight = clamp(Number(dom.fontWeight.value) || 400, 100, 900);
  style.weightName = weightLabelFor(style.weight);
  style.italic = dom.btnItalic.classList.contains('is-on');
  style.lineHeight = clamp(Number(dom.lineHeight.value) || 1.35, 0.85, 2.2);
  style.letterSpacing = clamp(Number(dom.letterSpacing.value) || 0, -1.5, 4);
  const color = normalizeHex(dom.colorHex.value) || normalizeHex(dom.textColor.value) || style.color;
  style.color = color;
  block.autoFit = dom.autoFitToggle.checked;
  if (style.fontChoice !== 'auto') {
    style.family = style.fontChoice;
  } else {
    style.family = block.fontMeta?.family || style.family || 'sans';
  }

  dom.lineHeightValue.textContent = Number(style.lineHeight).toFixed(2);
  dom.letterSpacingValue.textContent = Number(style.letterSpacing).toFixed(1);
  dom.textColor.value = color.toLowerCase();
  dom.colorHex.value = color;
  dom.colorPreview.style.background = color;
  dom.fontFaceHint.textContent = style.fontChoice === 'auto'
    ? (block.fontMeta?.fontFace || '自动匹配')
    : style.fontChoice === 'sans' ? '无衬线' : style.fontChoice === 'serif' ? '衬线' : '等宽';
  updateSpecimen(block);
  updateWordButtons(block);

  state.session.dirty = true;
  const element = getActiveElement();
  if (element) {
    const fit = layoutBlock(element, block, state.zoom, { editable: true });
    element.classList.toggle('is-overflow', fit.status === 'overflow');
    updateFitMetrics(block);
    updateBlockTools();
    updateTransformReadout();
  }
  updateChips();
}

function setActiveAlignment(align) {
  if (!state.session) return;
  const block = getSessionBlock();
  if (!block) return;
  block.style.align = align;
  for (const button of dom.alignSegment.querySelectorAll('button')) {
    button.classList.toggle('is-active', button.dataset.align === align);
  }
  state.session.dirty = true;
  const element = getActiveElement();
  if (element) {
    layoutBlock(element, block, state.zoom, { editable: true });
    updateFitMetrics(block);
    updateBlockTools();
    updateTransformReadout();
  }
}

function toggleItalic() {
  if (!state.session) return;
  const block = getSessionBlock();
  if (!block) return;
  block.style.italic = !block.style.italic;
  dom.btnItalic.classList.toggle('is-on', block.style.italic);
  state.session.dirty = true;
  refreshActiveFormatting(block);
  updateWordButtons(block);
  updateSpecimen(block);
}

function refreshActiveFormatting(block) {
  const element = getActiveElement();
  if (element) {
    const fit = layoutBlock(element, block, state.zoom, { editable: !state.session?.moveMode });
    element.classList.toggle('is-overflow', fit.status === 'overflow');
    updateFitMetrics(block);
    updateBlockTools();
    updateTransformReadout();
  }
  updateSpecimen(block);
  updateChips();
}

function updateWordButtons(block) {
  if (!block) return;
  const style = block.style;
  dom.btnBold.classList.toggle('is-on', Number(style.weight) >= 600);
  dom.btnItalic.classList.toggle('is-on', Boolean(style.italic));
  dom.btnUnderline.classList.toggle('is-on', Boolean(style.underline));
  dom.btnStrike.classList.toggle('is-on', Boolean(style.strike));
  const lines = String(block.text || '').split('\n').filter((line) => line.trim());
  const bullet = /^\s*[•·▪◦‣∙-]\s+/;
  const numbered = /^\s*\d+[.)]\s+/;
  dom.btnBulletList.classList.toggle('is-on', lines.length > 0 && lines.every((line) => bullet.test(line)));
  dom.btnNumberList.classList.toggle('is-on', lines.length > 0 && lines.every((line) => numbered.test(line)));
}

function toggleBold() {
  if (!state.session) return;
  const block = getSessionBlock();
  if (!block) return;
  block.style.weight = Number(block.style.weight) >= 600 ? 400 : 700;
  block.style.weightName = weightLabelFor(block.style.weight);
  ensureWeightOption(block.style.weight);
  dom.fontWeight.value = String(block.style.weight);
  state.session.dirty = true;
  updateWordButtons(block);
  refreshActiveFormatting(block);
}

function toggleUnderline() {
  if (!state.session) return;
  const block = getSessionBlock();
  if (!block) return;
  block.style.underline = !block.style.underline;
  state.session.dirty = true;
  updateWordButtons(block);
  refreshActiveFormatting(block);
}

function toggleStrike() {
  if (!state.session) return;
  const block = getSessionBlock();
  if (!block) return;
  block.style.strike = !block.style.strike;
  state.session.dirty = true;
  updateWordButtons(block);
  refreshActiveFormatting(block);
}

function adjustFontSize(delta) {
  if (!state.session) return;
  const block = getSessionBlock();
  if (!block) return;
  block.style.fontSize = clamp(Number(block.style.fontSize) + delta, 4, 144);
  dom.fontSize.value = block.style.fontSize.toFixed(1).replace(/\.0$/, '');
  state.session.dirty = true;
  refreshActiveFormatting(block);
}

function toggleList(kind) {
  if (!state.session) return;
  const block = getSessionBlock();
  const element = getActiveElement();
  if (!block || !element) return;
  const lines = String(block.text || '').split('\n');
  const nonEmpty = lines.filter((line) => line.trim());
  if (!nonEmpty.length) return;
  const bullet = /^\s*[•·▪◦‣∙-]\s+/;
  const numbered = /^\s*\d+[.)]\s+/;
  const relevant = kind === 'number' ? numbered : bullet;
  const active = nonEmpty.every((line) => relevant.test(line));
  let counter = 0;
  const next = lines.map((line) => {
    if (!line.trim()) return line;
    const clean = line.replace(/^\s*(?:[•·▪◦‣∙-]\s+|\d+[.)]\s+)/, '');
    if (active) return clean;
    if (kind === 'number') {
      counter += 1;
      return `${counter}. ${clean}`;
    }
    return `• ${clean}`;
  });
  block.text = next.join('\n');
  element.textContent = block.text;
  state.session.dirty = true;
  refreshActiveFormatting(block);
  updateWordButtons(block);
  focusEditorAtEnd(element);
}

function clearFormatting() {
  if (!state.session) return;
  const block = getSessionBlock();
  if (!block) return;
  const source = block.detectedStyle || state.session.originalBlock?.style;
  if (!source) return;
  block.text = String(block.text || '')
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[•·▪◦‣∙-]\s+|\d+[.)]\s+)/, ''))
    .join('\n');
  const element = getActiveElement();
  if (element) element.textContent = block.text;
  block.style = structuredClone(source);
  block.style.underline = Boolean(block.style.underline);
  block.style.strike = Boolean(block.style.strike);
  block.autoFit = true;
  dom.autoFitToggle.checked = true;
  state.session.dirty = true;
  populateBlockInspector(block);
  refreshActiveFormatting(block);
  if (element) focusEditorAtEnd(element);
}

function bindEvents() {
  dom.btnOpen.addEventListener('click', () => dom.fileInput.click());
  dom.btnOpenAnother.addEventListener('click', requestOpenAnother);
  dom.btnOpenDocPage.addEventListener('click', requestOpenAnother);
  dom.btnSample.addEventListener('click', loadSample);
  dom.dropzone.addEventListener('click', () => dom.fileInput.click());
  dom.fileInput.addEventListener('change', () => {
    const file = dom.fileInput.files?.[0];
    dom.fileInput.value = '';
    handleFileInput(file);
  });

  dom.toolSelect.addEventListener('click', () => setMode('select'));
  dom.toolText.addEventListener('click', () => setMode('text'));
  dom.toolReplace.addEventListener('click', openReplaceModal);

  dom.blockTools.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.resize-handle');
    if (handle) {
      beginTransform(event, 'resize', handle.dataset.handle || 'se');
      return;
    }
    if (event.target.closest('#moveGrip')) {
      beginTransform(event, 'move', 'move');
    }
  });
  dom.btnMoveMode.addEventListener('click', () => setMoveMode());
  dom.snapToggle.addEventListener('change', () => {
    state.snapEnabled = dom.snapToggle.checked;
    if (!state.snapEnabled) clearGuides();
  });

  dom.thumbList.addEventListener('click', (event) => {
    const item = event.target.closest('.thumb-item');
    if (!item) return;
    const index = Number(item.dataset.index);
    if (Number.isFinite(index)) gotoPage(index);
  });

  dom.btnAddBlank.addEventListener('click', insertBlankPage);
  dom.btnInsertBlank.addEventListener('click', insertBlankPage);
  dom.btnDeletePage.addEventListener('click', deleteCurrentPage);
  dom.btnReplacePage.addEventListener('click', openReplaceModal);

  dom.btnOcr.addEventListener('click', () => openOcrModal());
  dom.btnOcrPage.addEventListener('click', () => openOcrModal({ autoPage: true }));
  dom.btnCloseOcr.addEventListener('click', closeOcrModal);
  dom.ocrCurrentPage.addEventListener('click', runOcrCurrentPage);
  dom.ocrImageInput.addEventListener('change', () => {
    const file = dom.ocrImageInput.files?.[0];
    dom.ocrImageInput.value = '';
    if (file) runOcrImage(file);
  });
  dom.btnOcrCopy.addEventListener('click', copyOcrText);
  dom.btnOcrApply.addEventListener('click', applyOcrEditable);
  dom.btnOcrNewPage.addEventListener('click', () => {
    insertOcrTextPage().catch((error) => {
      console.error(error);
      toast('生成文字页失败，请重试。', 'error');
    });
  });
  dom.ocrText.addEventListener('input', () => {
    const text = dom.ocrText.value;
    dom.ocrCharCount.textContent = `${text.length} 字符`;
    dom.btnOcrCopy.disabled = !text.trim();
    dom.btnOcrNewPage.disabled = !state.docOpen || !text.trim();
    dom.btnOcrApply.disabled = !state.ocrPageResult;
  });
  dom.ocrModal.addEventListener('click', (event) => {
    if (event.target === dom.ocrModal) closeOcrModal();
  });

  dom.btnUndo.addEventListener('click', undo);
  dom.btnRedo.addEventListener('click', redo);
  dom.btnExport.addEventListener('click', exportCurrentPdf);

  dom.btnZoomOut.addEventListener('click', () => handleZoomButton(-1));
  dom.btnZoomIn.addEventListener('click', () => handleZoomButton(1));
  dom.zoomValue.addEventListener('click', () => fitPage());
  dom.btnFitPage.addEventListener('click', () => fitPage());
  dom.btnRotateLeft.addEventListener('click', () => rotateCurrentPage(-90));
  dom.btnRotateRight.addEventListener('click', () => rotateCurrentPage(90));

  dom.stage.addEventListener('click', (event) => {
    if (!state.docOpen) return;
    if (performance.now() < state.suppressClickUntil) {
      state.suppressClickUntil = 0;
      event.stopPropagation();
      return;
    }
    if (event.target.closest('.pdf-block') || event.target.closest('.block-tools') || event.target.closest('.guide-layer')) return;
    if (state.mode === 'text') {
      addTextAt(event.clientX, event.clientY);
      return;
    }
    if (state.session) {
      commitSession({ rerender: true });
      return;
    }
  });

  dom.btnApplyBlock.addEventListener('click', () => commitSession({ rerender: true }));
  dom.btnCancelBlock.addEventListener('click', cancelSession);
  dom.btnDeselect.addEventListener('click', () => commitSession({ rerender: true }));
  dom.btnItalic.addEventListener('click', toggleItalic);
  dom.btnBold.addEventListener('click', toggleBold);
  dom.btnUnderline.addEventListener('click', toggleUnderline);
  dom.btnStrike.addEventListener('click', toggleStrike);
  dom.btnBulletList.addEventListener('click', () => toggleList('bullet'));
  dom.btnNumberList.addEventListener('click', () => toggleList('number'));
  dom.btnFontMinus.addEventListener('click', () => adjustFontSize(-1));
  dom.btnFontPlus.addEventListener('click', () => adjustFontSize(1));
  dom.btnClearFormat.addEventListener('click', clearFormatting);
  dom.alignSegment.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-align]');
    if (button) setActiveAlignment(button.dataset.align);
  });

  for (const input of [dom.fontChoice, dom.fontSize, dom.fontWeight, dom.textColor, dom.lineHeight, dom.letterSpacing, dom.autoFitToggle]) {
    input.addEventListener('input', updateStyleFromControls);
    input.addEventListener('change', updateStyleFromControls);
  }
  dom.colorHex.addEventListener('input', () => {
    if (normalizeHex(dom.colorHex.value)) updateStyleFromControls();
  });
  dom.colorHex.addEventListener('blur', () => {
    const normalized = normalizeHex(dom.colorHex.value);
    if (normalized) dom.colorHex.value = normalized;
    else if (state.session) dom.colorHex.value = getSessionBlock()?.style.color || '#1B2420';
  });

  dom.btnChooseReplacement.addEventListener('click', (event) => {
    event.stopPropagation();
    dom.replaceInput.click();
  });
  dom.replaceDrop.addEventListener('click', () => dom.replaceInput.click());
  dom.btnChangeReplacement.addEventListener('click', () => dom.replaceInput.click());
  dom.replaceInput.addEventListener('change', () => {
    const file = dom.replaceInput.files?.[0];
    dom.replaceInput.value = '';
    loadReplacementFile(file);
  });
  dom.btnCloseReplace.addEventListener('click', closeReplaceModal);
  dom.btnCancelReplace.addEventListener('click', closeReplaceModal);
  dom.replaceModal.addEventListener('click', (event) => {
    if (event.target === dom.replaceModal) closeReplaceModal();
  });
  dom.btnConfirmReplace.addEventListener('click', confirmReplacePage);

  dom.replaceDrop.addEventListener('dragover', (event) => {
    event.preventDefault();
    dom.replaceDrop.classList.add('is-over');
  });
  dom.replaceDrop.addEventListener('dragleave', () => dom.replaceDrop.classList.remove('is-over'));
  dom.replaceDrop.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    dom.replaceDrop.classList.remove('is-over');
    const file = [...(event.dataTransfer?.files || [])].find(isPdfFile);
    if (file) loadReplacementFile(file);
  });

  let dragDepth = 0;
  window.addEventListener('dragenter', (event) => {
    if (![...(event.dataTransfer?.types || [])].includes('Files')) return;
    if (!dom.replaceModal.hidden) return;
    dragDepth += 1;
    dom.dropOverlay.hidden = false;
  });
  window.addEventListener('dragover', (event) => {
    if (![...(event.dataTransfer?.types || [])].includes('Files')) return;
    event.preventDefault();
    if (!dom.replaceModal.hidden) return;
    event.dataTransfer.dropEffect = 'copy';
    dom.dropOverlay.hidden = false;
  });
  window.addEventListener('dragleave', (event) => {
    if (!dom.replaceModal.hidden) return;
    if (event.relatedTarget == null || event.clientX <= 0 || event.clientY <= 0) {
      dragDepth = 0;
      dom.dropOverlay.hidden = true;
      return;
    }
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) dom.dropOverlay.hidden = true;
  });
  window.addEventListener('drop', (event) => {
    if (!dom.replaceModal.hidden) return;
    event.preventDefault();
    dragDepth = 0;
    dom.dropOverlay.hidden = true;
    const file = [...(event.dataTransfer?.files || [])].find(isPdfFile);
    if (file) handleFileInput(file);
    else toast('请拖入一个 PDF 文件。', 'error');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (!dom.ocrModal.hidden) {
        closeOcrModal();
        return;
      }
      if (!dom.replaceModal.hidden) {
        closeReplaceModal();
        return;
      }
      if (state.session?.moveMode) {
        setMoveMode(false);
        return;
      }
      if (state.session) {
        cancelSession();
        return;
      }
      if (state.mode === 'text') setMode('select');
      return;
    }

    const arrow = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key);
    if (arrow && state.session && (state.session.moveMode || event.altKey) && dom.replaceModal.hidden && dom.ocrModal.hidden) {
      if (event.target.closest?.('input, select, textarea') && !event.altKey) return;
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      if (event.key === 'ArrowLeft') moveBlockBy(-step, 0);
      else if (event.key === 'ArrowRight') moveBlockBy(step, 0);
      else if (event.key === 'ArrowUp') moveBlockBy(0, -step);
      else if (event.key === 'ArrowDown') moveBlockBy(0, step);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (state.docOpen) exportCurrentPdf();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && (event.key === '=' || event.key === '+')) {
      event.preventDefault();
      if (state.docOpen) handleZoomButton(1);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === '-') {
      event.preventDefault();
      if (state.docOpen) handleZoomButton(-1);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === '0') {
      event.preventDefault();
      if (state.docOpen) fitPage();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'o') {
      event.preventDefault();
      if (dom.ocrModal.hidden && dom.replaceModal.hidden) {
        if (state.docOpen) requestOpenAnother();
        else dom.fileInput.click();
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && state.session) {
      event.preventDefault();
      commitSession({ rerender: true });
      return;
    }
    if ((event.ctrlKey || event.metaKey) && state.session && ['b', 'i', 'u'].includes(event.key.toLowerCase())) {
      event.preventDefault();
      if (event.key.toLowerCase() === 'b') toggleBold();
      else if (event.key.toLowerCase() === 'i') toggleItalic();
      else toggleUnderline();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && !isTypingTarget(event.target)) {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y' && !isTypingTarget(event.target)) {
      event.preventDefault();
      redo();
      return;
    }
    if (event.altKey && event.key.toLowerCase() === 'm' && state.session && dom.replaceModal.hidden) {
      event.preventDefault();
      setMoveMode();
      return;
    }
    if (isTypingTarget(event.target)) return;
    if (event.key === '[') {
      rotateCurrentPage(-90);
      return;
    }
    if (event.key === ']') {
      rotateCurrentPage(90);
      return;
    }
    if (event.key.toLowerCase() === 'm' && state.session) {
      setMoveMode();
      return;
    }
    if (event.key.toLowerCase() === 'v') setMode('select');
    if (event.key.toLowerCase() === 't') setMode('text');
    if (event.key.toLowerCase() === 'r' && state.docOpen) openReplaceModal();
  });

  dom.canvasScroll.addEventListener('wheel', (event) => {
    if (!event.ctrlKey || !state.docOpen) return;
    event.preventDefault();
    state.fitMode = 'custom';
    setZoom(state.zoom + (event.deltaY > 0 ? -0.08 : 0.08));
  }, { passive: false });

  dom.canvasScroll.addEventListener('wheel', handlePageWheel, { passive: false });

  const ro = new ResizeObserver(debounce(() => {
    if (!state.docOpen || state.fitMode === 'custom' || state.busy || state.session) return;
    const next = calculateFitZoom();
    if (Math.abs(next - state.zoom) > 0.008) {
      state.zoom = next;
      updateZoomUi();
      renderActivePage({ preserveScroll: true });
    }
  }, 180));
  ro.observe(dom.canvasScroll);

  if (!/Electron\//i.test(navigator.userAgent)) {
    window.addEventListener('beforeunload', (event) => {
      if (state.dirty && state.docOpen) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
  }
}

function isPdfFile(file) {
  return Boolean(file) && (/\.pdf$/i.test(file.name) || file.type === 'application/pdf');
}

function debounce(fn, wait) {
  let timer = 0;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function boot() {
  updateFileUi();
  updateZoomUi();
  updateHistoryButtons();
  bindEvents();
  const params = new URLSearchParams(window.location.search);
  if (params.get('sample') === '1') {
    loadSample();
  }
}

boot();

// A small read-only diagnostics handle; useful for local testing and support.
window.__folio = {
  get state() { return state; },
  getPage,
  getSource,
  analyze: (page) => analyzePage(page, getSource(page), 2),
};

