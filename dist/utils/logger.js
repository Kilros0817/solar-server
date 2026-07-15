"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInfo = logInfo;
exports.logError = logError;
exports.logWarn = logWarn;
function logInfo(message, ...args) {
    console.log(`[INFO] ${message}`, ...args);
}
function logError(message, ...args) {
    console.error(`[ERROR] ${message}`, ...args);
}
function logWarn(message, ...args) {
    console.warn(`[WARN] ${message}`, ...args);
}
