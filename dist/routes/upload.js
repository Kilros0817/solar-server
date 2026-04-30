"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const stream_1 = require("stream");
const form_data_1 = __importDefault(require("form-data"));
const router = express_1.default.Router();
const pinJSONToIPFS = async (jsonData, name) => {
    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
    const pinata_api_key = process.env.PINATA_API_KEY;
    const pinata_secret_api_key = process.env.PINATA_SECRETE_API_KEY;
    if (!pinata_api_key || !pinata_secret_api_key) {
        console.error('Pinata API keys not configured');
        return { isSuccess: false, data: null };
    }
    const body = {
        pinataContent: jsonData,
        pinataMetadata: { name },
    };
    try {
        const res = await axios_1.default.post(url, body, {
            headers: {
                'Content-Type': 'application/json',
                pinata_api_key,
                pinata_secret_api_key,
            },
        });
        return {
            isSuccess: true,
            data: res.data.IpfsHash,
        };
    }
    catch (error) {
        console.error('Pinata upload error:', error);
        return {
            isSuccess: false,
            data: null,
        };
    }
};
router.post('/contract', async (req, res) => {
    try {
        const { contract } = req.body;
        if (!contract || typeof contract !== 'object') {
            res.status(400).json({ error: 'contract object is required' });
            return;
        }
        const name = `${Date.now()}-contract`;
        const result = await pinJSONToIPFS(contract, name);
        if (!result.isSuccess) {
            res.status(500).json({ error: 'Failed to upload contract' });
            return;
        }
        res.status(200).json({ cid: result.data });
    }
    catch (error) {
        console.error('POST /upload/contract error:', error);
        res.status(500).json({ error: 'Failed to upload contract' });
    }
});
router.post('/sections', async (req, res) => {
    try {
        const { sections } = req.body;
        if (!Array.isArray(sections) || sections.length === 0) {
            res.status(400).json({ error: 'sections array is required and must not be empty' });
            return;
        }
        const timestamp = Date.now();
        const results = await Promise.all(sections.map((section, i) => pinJSONToIPFS(section, `${timestamp}-section-${i}`)));
        const failed = results.some((r) => !r.isSuccess);
        if (failed) {
            res.status(500).json({ error: 'Failed to upload sections' });
            return;
        }
        const sectionCids = sections.map((section, i) => ({
            divisionLeaderAddress: section.assignedDivisionLeaderAddress,
            cid: results[i].data,
        }));
        res.status(200).json({ sectionCids });
    }
    catch (error) {
        console.error('POST /upload/sections error:', error);
        res.status(500).json({ error: 'Failed to upload sections' });
    }
});
router.post('/clauses', async (req, res) => {
    try {
        const { clauses: clausePayloads } = req.body;
        if (!Array.isArray(clausePayloads) || clausePayloads.length === 0) {
            res.status(400).json({ error: 'clauses array is required and must not be empty' });
            return;
        }
        const timestamp = Date.now();
        const results = await Promise.all(clausePayloads.map((payload, i) => pinJSONToIPFS(payload, `${timestamp}-clause-${i}`)));
        const failed = results.some((r) => !r.isSuccess);
        if (failed) {
            res.status(500).json({ error: 'Failed to upload clause assignments' });
            return;
        }
        const clauseCids = results.map((r) => r.data);
        res.status(200).json({ clauseCids });
    }
    catch (error) {
        console.error('POST /upload/clauses error:', error);
        res.status(500).json({ error: 'Failed to upload clause assignments' });
    }
});
router.post('/signature', async (req, res) => {
    try {
        const imgDataUrl = (req.body?.imgUrl ?? req.body?.signature);
        if (!imgDataUrl || typeof imgDataUrl !== 'string' || !imgDataUrl.includes('base64,')) {
            res.status(400).json({ error: 'Image data URL required (e.g. { signature: "data:image/png;base64,..." })' });
            return;
        }
        const result = await pinImgToIPFS(imgDataUrl);
        if (result.isSuccess && result.data) {
            res.status(200).json({ cid: result.data });
            return;
        }
        res.status(500).json({ error: 'Failed to upload signature image to Pinata' });
    }
    catch (err) {
        console.error(err, '========= error in upload esign =========');
        res.status(500).json({ error: 'Failed to upload signature' });
    }
});
const pinImgToIPFS = async (imgDataUrl) => {
    const pinata_api_key = process.env.PINATA_API_KEY;
    const pinata_secret_api_key = process.env.PINATA_SECRETE_API_KEY;
    if (!pinata_api_key || !pinata_secret_api_key) {
        console.error('Pinata API keys not configured');
        return { isSuccess: false, data: null };
    }
    const base64Data = imgDataUrl.split('base64,')[1];
    if (!base64Data) {
        console.error('Invalid image data URL: missing base64 payload');
        return { isSuccess: false, data: null };
    }
    const bf = Buffer.from(base64Data, 'base64');
    const stream = stream_1.Readable.from(bf);
    const data = new form_data_1.default();
    data.append('file', stream, {
        filepath: `${Date.now()}.png`,
    });
    try {
        const res = await axios_1.default.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
            headers: {
                ...data.getHeaders(),
                pinata_api_key,
                pinata_secret_api_key,
            },
        });
        return {
            isSuccess: true,
            data: res.data.IpfsHash,
        };
    }
    catch (error) {
        console.error(error, 'Pinata pinFileToIPFS error');
        return {
            isSuccess: false,
            data: null,
        };
    }
};
exports.default = router;
