"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDFFromHTML = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const MARGIN = 50;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
function parseHTML(html) {
    const tokens = [];
    html = html.replace(/<head[\s\S]*?<\/head>/gi, '');
    html = html.replace(/\r\n|\r/g, '\n').replace(/\n{3,}/g, '\n\n');
    const blockRe = /<(h[1-3]|p|li|div|br\s*\/?)(?:[^>]*)>([\s\S]*?)<\/\1>|<br\s*\/?>/gi;
    let match;
    while ((match = blockRe.exec(html)) !== null) {
        const tag = (match[1] || 'br').toLowerCase().replace(/\s*\//, '');
        const inner = (match[2] || '').replace(/<[^>]+>/g, '').trim();
        if (tag === 'br') {
            tokens.push({ type: 'br', text: '' });
        }
        else if (tag === 'h1') {
            tokens.push({ type: 'h1', text: inner });
        }
        else if (tag === 'h2') {
            tokens.push({ type: 'h2', text: inner });
        }
        else if (tag === 'h3') {
            tokens.push({ type: 'h3', text: inner });
        }
        else if (tag === 'li') {
            tokens.push({ type: 'li', text: inner });
        }
        else if (tag === 'p' && inner) {
            tokens.push({ type: 'p', text: inner });
        }
        else if (tag === 'div' && inner) {
            for (const line of inner.split('\n').map(l => l.trim()).filter(Boolean)) {
                tokens.push({ type: 'p', text: line });
            }
        }
    }
    return tokens;
}
function renderTokens(doc, tokens) {
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
function addHeaderFooter(doc) {
    const totalPages = doc._pageBuffer?.length ?? 1;
    for (let i = 0; i < doc.bufferedPageRange().count; i++) {
        doc.switchToPage(i);
        doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#888888')
            .text('Solar DMS Analytics Report', MARGIN, 20, {
            width: CONTENT_WIDTH,
            align: 'center',
        });
        doc
            .font('Helvetica')
            .fontSize(8)
            .fillColor('#888888')
            .text(`Page ${i + 1} of ${totalPages} | Generated: ${new Date().toLocaleDateString()}`, MARGIN, doc.page.height - 30, { width: CONTENT_WIDTH, align: 'center' });
    }
}
const generatePDFFromHTML = async (htmlContent) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new pdfkit_1.default({
                size: 'A4',
                margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
                bufferPages: true,
                info: {
                    Title: 'Solar DMS Analytics Report',
                    Author: 'Solar DMS',
                },
            });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => {
                addHeaderFooter(doc);
                resolve(Buffer.concat(chunks));
            });
            doc.on('error', reject);
            const tokens = parseHTML(htmlContent);
            renderTokens(doc, tokens);
            doc.end();
        }
        catch (error) {
            reject(new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
    });
};
exports.generatePDFFromHTML = generatePDFFromHTML;
