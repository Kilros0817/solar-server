"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownToHTML = exports.generatePDFFromHTML = exports.getOrBuildReport = void 0;
var report_cache_1 = require("./cache/report-cache");
Object.defineProperty(exports, "getOrBuildReport", { enumerable: true, get: function () { return report_cache_1.getOrBuildReport; } });
var generator_1 = require("./pdf/generator");
Object.defineProperty(exports, "generatePDFFromHTML", { enumerable: true, get: function () { return generator_1.generatePDFFromHTML; } });
var markdown_1 = require("./pdf/markdown");
Object.defineProperty(exports, "markdownToHTML", { enumerable: true, get: function () { return markdown_1.markdownToHTML; } });
