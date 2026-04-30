import PDFDocument from 'pdfkit';

// Page margins
const MARGIN = 50;
const PAGE_WIDTH = 595.28; // A4 width in points
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

/**
 * Parse raw HTML into a sequence of typed tokens for rendering.
 * Handles: h1, h2, h3, p, ul/li, ol/li, strong, br.
 */
function parseHTML(html: string): Array<{ type: string; text: string; level?: number }> {
  const tokens: Array<{ type: string; text: string; level?: number }> = [];

  // Strip <head> entirely
  html = html.replace(/<head[\s\S]*?<\/head>/gi, '');

  // Normalise whitespace
  html = html.replace(/\r\n|\r/g, '\n').replace(/\n{3,}/g, '\n\n');

  // Walk through block-level tags
  const blockRe = /<(h[1-3]|p|li|div|br\s*\/?)(?:[^>]*)>([\s\S]*?)<\/\1>|<br\s*\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(html)) !== null) {
    const tag = (match[1] || 'br').toLowerCase().replace(/\s*\//, '');
    const inner = (match[2] || '').replace(/<[^>]+>/g, '').trim(); // strip inline tags

    if (tag === 'br') {
      tokens.push({ type: 'br', text: '' });
    } else if (tag === 'h1') {
      tokens.push({ type: 'h1', text: inner });
    } else if (tag === 'h2') {
      tokens.push({ type: 'h2', text: inner });
    } else if (tag === 'h3') {
      tokens.push({ type: 'h3', text: inner });
    } else if (tag === 'li') {
      tokens.push({ type: 'li', text: inner });
    } else if (tag === 'p' && inner) {
      tokens.push({ type: 'p', text: inner });
    } else if (tag === 'div' && inner) {
      // Render div content as plain paragraphs (e.g. footer divs)
      for (const line of inner.split('\n').map(l => l.trim()).filter(Boolean)) {
        tokens.push({ type: 'p', text: line });
      }
    }
  }

  return tokens;
}

/**
 * Render parsed tokens into a PDFDocument.
 */
function renderTokens(
  doc: InstanceType<typeof PDFDocument>,
  tokens: Array<{ type: string; text: string }>,
): void {
  const primaryColor = '#2c3e50';
  const accentColor = '#2980b9';
  const bodyColor = '#333333';

  for (const token of tokens) {
    switch (token.type) {
      case 'h1':
        doc
          .moveDown(0.5)
          .font('Helvetica-Bold')
          .fontSize(20)
          .fillColor(primaryColor)
          .text(token.text, MARGIN, undefined, { width: CONTENT_WIDTH })
          .moveDown(0.3)
          .moveTo(MARGIN, doc.y)
          .lineTo(MARGIN + CONTENT_WIDTH, doc.y)
          .strokeColor(accentColor)
          .lineWidth(1.5)
          .stroke()
          .moveDown(0.4);
        break;

      case 'h2':
        doc
          .moveDown(0.6)
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor(primaryColor)
          .text(token.text, MARGIN, undefined, { width: CONTENT_WIDTH })
          .moveDown(0.3);
        break;

      case 'h3':
        doc
          .moveDown(0.4)
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('#555555')
          .text(token.text, MARGIN, undefined, { width: CONTENT_WIDTH })
          .moveDown(0.2);
        break;

      case 'p':
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(bodyColor)
          .text(token.text, MARGIN, undefined, { width: CONTENT_WIDTH, align: 'justify' })
          .moveDown(0.4);
        break;

      case 'li':
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(bodyColor)
          .text(`• ${token.text}`, MARGIN + 12, undefined, { width: CONTENT_WIDTH - 12 })
          .moveDown(0.2);
        break;

      case 'br':
        doc.moveDown(0.3);
        break;
    }
  }
}

/**
 * Add header and footer to every page.
 */
function addHeaderFooter(doc: InstanceType<typeof PDFDocument>): void {
  const totalPages = (doc as any)._pageBuffer?.length ?? 1;

  for (let i = 0; i < doc.bufferedPageRange().count; i++) {
    doc.switchToPage(i);

    // Header
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#888888')
      .text('Solar DMS Analytics Report', MARGIN, 20, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    // Footer
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#888888')
      .text(
        `Page ${i + 1} of ${totalPages} | Generated: ${new Date().toLocaleDateString()}`,
        MARGIN,
        doc.page.height - 30,
        { width: CONTENT_WIDTH, align: 'center' },
      );
  }
}

/**
 * Convert an HTML string to a PDF Buffer using PDFKit.
 * Works in serverless environments (no Chrome required).
 */
export const generatePDFFromHTML = async (htmlContent: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        bufferPages: true, // needed for header/footer on all pages
        info: {
          Title: 'Solar DMS Analytics Report',
          Author: 'Solar DMS',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        addHeaderFooter(doc);
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);

      const tokens = parseHTML(htmlContent);
      renderTokens(doc, tokens);

      doc.end();
    } catch (error) {
      reject(new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
};
