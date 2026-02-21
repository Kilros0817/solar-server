"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
dotenv_1.default.config();
const rpc = process.env.RPC;
const TBSponsor = (0, accounts_1.privateKeyToAccount)(`0x${process.env.TBSponsor}`);
const TBSponsor1 = (0, accounts_1.privateKeyToAccount)(`0x${process.env.TBSponsor1}`);
const TBSponsorClient = (0, viem_1.createWalletClient)({
    account: TBSponsor,
    chain: chains_1.baseSepolia,
    transport: (0, viem_1.http)(process.env.RPC)
});
const TBSponsor1Client = (0, viem_1.createWalletClient)({
    account: TBSponsor1,
    chain: chains_1.baseSepolia,
    transport: (0, viem_1.http)(process.env.RPC)
});
const publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.baseSepolia,
    transport: (0, viem_1.http)(process.env.RPC)
});
const sponsorStatus = {
    TBSponsor: false,
    TBSponsor1: false
};
const router = express_1.default.Router();
router.post('/delegate', async (req, res) => {
    try {
        const authorization = req.body.authorization;
        const account = req.body.account;
        const hash = await TBSponsorClient.sendTransaction({
            to: account,
            data: '0x',
            authorizationList: [authorization],
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status === "success") {
            res.status(200).json({ isSuccess: true });
            return;
        }
        res.status(200).json({ isSuccess: false });
    }
    catch (error) {
        res.status(200).json({ isSuccess: false });
    }
});
router.post('/sponsor-tx', async (req, res) => {
    let selectedSponsor = null;
    let selectedClient = null;
    try {
        const address = req.body.address;
        const data = req.body.callData;
        if (!sponsorStatus.TBSponsor) {
            selectedSponsor = 'TBSponsor';
            selectedClient = TBSponsorClient;
            sponsorStatus.TBSponsor = true;
        }
        else {
            selectedSponsor = 'TBSponsor1';
            selectedClient = TBSponsor1Client;
        }
        const hash = await selectedClient.sendTransaction({
            to: address,
            data: data,
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (selectedSponsor === 'TBSponsor') {
            sponsorStatus.TBSponsor = false;
        }
        if (receipt.status === "success") {
            res.status(200).json({
                isSuccess: true,
                txHash: hash
            });
            return;
        }
        res.status(200).json({ isSuccess: false });
    }
    catch (error) {
        if (selectedSponsor === 'TBSponsor') {
            sponsorStatus.TBSponsor = false;
        }
        console.error('Sponsor transaction error:', error);
        res.status(200).json({ isSuccess: false });
    }
});
exports.default = router;
