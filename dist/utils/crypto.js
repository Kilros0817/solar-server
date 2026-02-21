"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = exports.getRandomKey = void 0;
const crypto_1 = __importDefault(require("crypto"));
const getRandomKey = () => {
    const key = crypto_1.default.randomBytes(32).toString('hex');
    const iv = crypto_1.default.randomBytes(16).toString('hex');
    return { key, iv };
};
exports.getRandomKey = getRandomKey;
const encrypt = (keyStr, ivStr, content) => {
    const key = Buffer.from(keyStr, 'hex');
    const iv = Buffer.from(ivStr, 'hex');
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
    let encryptedContent = cipher.update(content, 'utf8', 'base64');
    encryptedContent += cipher.final('base64');
    return encryptedContent;
};
exports.encrypt = encrypt;
const decrypt = (keyStr, ivStr, encryptedContent) => {
    const key = Buffer.from(keyStr, 'hex');
    const iv = Buffer.from(ivStr, 'hex');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
    let decryptedContent = decipher.update(encryptedContent, 'base64', 'utf8');
    decryptedContent += decipher.final('utf8');
    return decryptedContent;
};
exports.decrypt = decrypt;
