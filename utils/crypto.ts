import crypto from 'crypto';

export interface KeyPair {
    key: string;
    iv: string;
}

export const getRandomKey = (): KeyPair => {
    const key = crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16).toString('hex');

    return { key, iv };
};

export const encrypt = (keyStr: string, ivStr: string, content: string): string => {
    const key = Buffer.from(keyStr, 'hex');
    const iv = Buffer.from(ivStr, 'hex');

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encryptedContent = cipher.update(content, 'utf8', 'base64');
    encryptedContent += cipher.final('base64');
    
    return encryptedContent;
};

export const decrypt = (keyStr: string, ivStr: string, encryptedContent: string): string => {
    const key = Buffer.from(keyStr, 'hex');
    const iv = Buffer.from(ivStr, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decryptedContent = decipher.update(encryptedContent, 'base64', 'utf8');
    decryptedContent += decipher.final('utf8');

    return decryptedContent;
}; 