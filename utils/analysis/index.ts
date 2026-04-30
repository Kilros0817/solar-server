// Main exports file for the analysis module
// Only exporting what's actually used by external consumers

// Export from cache (used by routes/analysis.ts)
export { getOrBuildReport } from './cache/report-cache';

// Export from PDF generator (used by routes/analysis.ts)
export { generatePDFFromHTML } from './pdf/generator';

// Export from PDF markdown (used by routes/analysis.ts)
export { markdownToHTML } from './pdf/markdown';

// Note: The following exports are kept for internal use within the analysis module
// but are not exported to keep the public API clean
// Internal modules can import directly from their respective files