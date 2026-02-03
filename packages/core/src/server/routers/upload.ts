import { Router } from 'express';
import { storagePut } from '../../storage';
import { logger } from '../../lib/logger';

export const uploadRouter = Router();

uploadRouter.post('/', async (req, res) => {
    try {
        const { filename, data, contentType, folder = 'uploads' } = req.body;

        if (!filename || !data) {
            return res.status(400).json({ error: 'Missing filename or data' });
        }

        // Decode base64
        const buffer = Buffer.from(data, 'base64');

        // Sanitize filename and create path
        const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${folder}/${Date.now()}-${safeFilename}`;

        // Upload
        const result = await storagePut(key, buffer, contentType || 'application/octet-stream');

        res.json({
            success: true,
            url: result.url,
            key: result.key
        });
    } catch (error) {
        logger.error('Upload failed:', error);
        res.status(500).json({ error: 'Upload failed: ' + (error as Error).message });
    }
});
