/**
 * Read the actual font resources used by each PDF page. PDF.js deliberately
 * exposes generic CSS families in its text layer; the embedded PDF font table
 * still contains the real BaseFont names and metrics, which we use to map each
 * PDF.js font slot back to a concrete local font family.
 */
export async function readPdfFontCatalog(bytes) {
  const { PDFDocument, PDFName, PDFArray } = window.PDFLib || {};
  if (!PDFDocument) return [];

  const doc = await PDFDocument.load(bytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  const pages = [];
  const count = doc.getPageCount();

  for (let index = 0; index < count; index += 1) {
    try {
      pages.push(readPageFonts(doc, doc.getPage(index), PDFName, PDFArray));
    } catch {
      pages.push([]);
    }
  }
  return pages;
}

function readPageFonts(doc, page, PDFName, PDFArray) {
  const name = (value) => {
    if (!value) return null;
    try {
      return value.decodeText?.() ?? String(value).replace(/^\//, '');
    } catch {
      return String(value).replace(/^\//, '');
    }
  };
  const number = (value) => {
    if (!value) return null;
    try {
      const result = value.asNumber?.();
      return Number.isFinite(result) ? result : null;
    } catch {
      return null;
    }
  };

  const resources = page.node.Resources?.();
  const fontDict = resources?.lookup?.(PDFName.of('Font'));
  if (!fontDict?.entries) return [];

  const fonts = [];
  for (const [key, value] of fontDict.entries()) {
    try {
      const font = doc.context.lookup(value);
      if (!font?.get) continue;
      const subtype = name(font.get(PDFName.of('Subtype'))) || 'Font';
      const baseFont = name(font.get(PDFName.of('BaseFont'))) || '';
      let descriptorRef = font.get(PDFName.of('FontDescriptor'));

      if (subtype === 'Type0') {
        const descendants = doc.context.lookup(font.get(PDFName.of('DescendantFonts')));
        if (descendants instanceof PDFArray && descendants.size() > 0) {
          const descendant = doc.context.lookup(descendants.get(0));
          descriptorRef = descendant?.get?.(PDFName.of('FontDescriptor')) || descriptorRef;
        }
      }

      const descriptor = doc.context.lookup(descriptorRef);
      const ascentRaw = number(descriptor?.get?.(PDFName.of('Ascent')));
      const descentRaw = number(descriptor?.get?.(PDFName.of('Descent')));
      const italicAngle = number(descriptor?.get?.(PDFName.of('ItalicAngle'))) || 0;
      const declaredWeight = number(descriptor?.get?.(PDFName.of('FontWeight')));
      const flags = number(descriptor?.get?.(PDFName.of('Flags'))) || 0;

      fonts.push({
        resourceKey: key.toString().replace(/^\//, ''),
        baseFont,
        subtype,
        ascent: ascentRaw == null ? null : ascentRaw / 1000,
        descent: descentRaw == null ? null : -Math.abs(descentRaw) / 1000,
        weight: declaredWeight,
        italicAngle,
        flags,
        hasEmbeddedFile: Boolean(
          descriptor?.get?.(PDFName.of('FontFile')) ||
          descriptor?.get?.(PDFName.of('FontFile2')) ||
          descriptor?.get?.(PDFName.of('FontFile3'))
        ),
      });
    } catch {
      // A malformed font entry should not kill the whole page catalog.
    }
  }
  return fonts;
}
