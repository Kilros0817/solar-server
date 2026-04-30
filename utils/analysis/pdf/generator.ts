import puppeteer from 'puppeteer';

/**
 * Helper function to convert HTML to PDF using Puppeteer
 */
export const generatePDFFromHTML = async (htmlContent: string): Promise<Buffer> => {
  let browser;
  try {
    // Launch browser with optimized settings for server environment
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    const page = await browser.newPage();
    
    // Set the HTML content
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
    });
    
    // Generate PDF
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
    
    // Convert Uint8Array to Buffer
    return Buffer.from(pdfUint8Array);
  } catch (error) {
    console.error('Puppeteer PDF generation failed:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};