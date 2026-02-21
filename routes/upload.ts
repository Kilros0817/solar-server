import express, { Request, Response } from 'express';
import axios from 'axios';
import { Readable } from 'stream';
import FormData from 'form-data';

const router = express.Router();

interface PinataResponse {
  isSuccess: boolean;
  data: string | null;
}

const pinJSONToIPFS = async (jsonData: unknown, name: string): Promise<PinataResponse> => {
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
    const res = await axios.post(url, body, {
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
  } catch (error) {
    console.error('Pinata upload error:', error);
    return {
      isSuccess: false,
      data: null,
    };
  }
};

interface ContractPayload {
  contractTitle: string;
  client: string;
  description: string;
  price: string;
  category?: string;
  sections: Array<{
    sectionName: string;
    sectionContent: Array<{ clauseId: string; clauseContent: string }>;
  }>;
}

// POST /upload/contract - upload contract JSON to Pinata, return CID
router.post('/contract', async (req: Request, res: Response): Promise<void> => {
  try {
    const { contract } = req.body as { contract: ContractPayload };
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
  } catch (error) {
    console.error('POST /upload/contract error:', error);
    res.status(500).json({ error: 'Failed to upload contract' });
  }
});

interface SectionWithDivision {
  assignedDivisionLeaderAddress: string;
  [key: string]: unknown;
}

// POST /upload/sections - upload array of section JSONs to Pinata, return divisionLeaderAddress + CID pairs
router.post('/sections', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sections } = req.body as { sections: SectionWithDivision[] };
    if (!Array.isArray(sections) || sections.length === 0) {
      res.status(400).json({ error: 'sections array is required and must not be empty' });
      return;
    }

    const timestamp = Date.now();
    const results = await Promise.all(
      sections.map((section, i) => pinJSONToIPFS(section, `${timestamp}-section-${i}`))
    );
    const failed = results.some((r) => !r.isSuccess);

    if (failed) {
      res.status(500).json({ error: 'Failed to upload sections' });
      return;
    }

    const sectionCids = sections.map((section, i) => ({
      divisionLeaderAddress: section.assignedDivisionLeaderAddress,
      cid: results[i].data!,
    }));

    res.status(200).json({ sectionCids });
  } catch (error) {
    console.error('POST /upload/sections error:', error);
    res.status(500).json({ error: 'Failed to upload sections' });
  }
});

interface ClauseAssignmentPayload {
  clauseId: string;
  clauseContent: string;
  divisionMemberAddress: string;
  /** Omitted so same clause + member yields same CID and avoids double-assign issues */
  assignedDate?: string;
}

// POST /upload/clauses - upload clause assignment JSONs to Pinata, return CIDs in order
router.post('/clauses', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clauses: clausePayloads } = req.body as { clauses: ClauseAssignmentPayload[] };
    if (!Array.isArray(clausePayloads) || clausePayloads.length === 0) {
      res.status(400).json({ error: 'clauses array is required and must not be empty' });
      return;
    }

    const timestamp = Date.now();
    const results = await Promise.all(
      clausePayloads.map((payload, i) =>
        pinJSONToIPFS(payload, `${timestamp}-clause-${i}`)
      )
    );
    const failed = results.some((r) => !r.isSuccess);

    if (failed) {
      res.status(500).json({ error: 'Failed to upload clause assignments' });
      return;
    }

    const clauseCids = results.map((r) => r.data!);
    res.status(200).json({ clauseCids });
  } catch (error) {
    console.error('POST /upload/clauses error:', error);
    res.status(500).json({ error: 'Failed to upload clause assignments' });
  }
});

// POST /upload/signature - upload e-signature image (data URL) to Pinata via pinFileToIPFS, return CID
router.post('/signature', async (req: Request, res: Response): Promise<void> => {
  try {
    const imgDataUrl = (req.body?.imgUrl ?? req.body?.signature) as string | undefined;
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
  } catch (err) {
    console.error(err, '========= error in upload esign =========');
    res.status(500).json({ error: 'Failed to upload signature' });
  }
});

const pinImgToIPFS = async (imgDataUrl: string): Promise<PinataResponse> => {
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
  const stream = Readable.from(bf);
  const data = new FormData();
  data.append('file', stream, {
    filepath: `${Date.now()}.png`,
  });

  try {
    const res = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      data,
      {
        headers: {
          ...data.getHeaders(),
          pinata_api_key,
          pinata_secret_api_key,
        },
      }
    );
    return {
      isSuccess: true,
      data: res.data.IpfsHash,
    };
  } catch (error) {
    console.error(error, 'Pinata pinFileToIPFS error');
    return {
      isSuccess: false,
      data: null,
    };
  }
};

export default router;
