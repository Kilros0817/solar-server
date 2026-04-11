import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';

dotenv.config();

const TBSponsor = privateKeyToAccount(`0x${process.env.TBSponsor}`);
const TBSponsor1 = privateKeyToAccount(`0x${process.env.TBSponsor1}`);

const TBSponsorClient = createWalletClient({
    account: TBSponsor,
    chain: baseSepolia,
    transport: http(process.env.RPC)
});

const TBSponsor1Client = createWalletClient({
    account: TBSponsor1,
    chain: baseSepolia,
    transport: http(process.env.RPC)
});

const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.RPC)
});

const sponsorStatus = {
    TBSponsor: false,
    TBSponsor1: false
};

const router = express.Router();

router.post('/delegate', async (req: Request, res: Response): Promise<void> => {
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
            return
        }
        res.status(200).json({ isSuccess: false });

    } catch (error) {
        res.status(200).json({ isSuccess: false });
    }
});

router.post('/sponsor-tx', async (req: Request, res: Response): Promise<void> => {
    let selectedSponsor = null;
    let selectedClient = null;

    try {
        const address = req.body.address;
        const data = req.body.callData;

        if (!sponsorStatus.TBSponsor) {
            selectedSponsor = 'TBSponsor';
            selectedClient = TBSponsorClient;
            sponsorStatus.TBSponsor = true;
        } else {
            selectedSponsor = 'TBSponsor1';
            selectedClient = TBSponsor1Client;
        }

        const hash = await selectedClient.sendTransaction({
            to: address,
            data: data,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Release sponsor after transaction completion
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
    } catch (error) {
        if (selectedSponsor === 'TBSponsor') {
            sponsorStatus.TBSponsor = false;
        }
        console.error('Sponsor transaction error:', error);
        res.status(200).json({ isSuccess: false });
    }
});

export default router; 