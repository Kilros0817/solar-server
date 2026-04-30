/**
 * Helper function to convert markdown to HTML for PDF generation
 */
export const markdownToHTML = (markdownText: string): string => {
  // Simple markdown to HTML conversion
  let html = markdownText
    .replace(/^# (.*)$/gim, '<h1>$1</h1>')
    .replace(/^## (.*)$/gim, '<h2>$1</h2>')
    .replace(/^### (.*)$/gim, '<h3>$1</h3>')
    .replace(/^[*\-] (.*)$/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*)$/gim, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
  
  // Wrap lists
  if (html.includes('<li>')) {
    html = html.replace(/<li>/g, '<ul><li>').replace(/(<\/li>)(?!.*<li>)/, '$1</ul>');
  }
  
  // Create full HTML document with styling
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Solar DMS Analytics Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 25px; }
    h3 { color: #7f8c8d; }
    .header { text-align: center; margin-bottom: 30px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #95a5a6; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Solar DMS Analytics Report</h1>
    <p>Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  
  ${html}
  
  <div class="footer">
    <p>Solar DMS - Contract Management System</p>
    <p>Confidential - For Internal Use Only</p>
  </div>
</body>
</html>`;
};