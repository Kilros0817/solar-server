"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePDFFromHTML = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const generatePDFFromHTML = async (htmlContent) => {
    let browser;
    try {
        browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0',
        });
        const pdfUint8Array = await page.pdf({
            format: 'A4',
            margin: {
                top: '50px',
                right: '50px',
                bottom: '50px',
                left: '50px',
            },
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: '<div style="font-size: 10px; margin: 0 auto; text-align: center; width: 100%;">Solar DMS Analytics Report</div>',
            footerTemplate: '<div style="font-size: 8px; margin: 0 auto; text-align: center; width: 100%;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated: ' + new Date().toLocaleDateString() + '</div>',
        });
        return Buffer.from(pdfUint8Array);
    }
    catch (error) {
        console.error('Puppeteer PDF generation failed:', error);
        throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    finally {
        if (browser) {
            await browser.close();
        }
    }
};
exports.generatePDFFromHTML = generatePDFFromHTML;
