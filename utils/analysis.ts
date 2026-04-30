// Main exports file - re-exports from modular structure
// This file is kept for backward compatibility
// Only exports what's actually used by external consumers

export {
  getOrBuildReport,
  generatePDFFromHTML,
  markdownToHTML
} from './analysis/index';