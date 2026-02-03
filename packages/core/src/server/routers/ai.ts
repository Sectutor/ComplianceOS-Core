
import { Router } from 'express';

export const aiRouter = Router();

aiRouter.post('/generate-stream', async (req: any, res: any) => {
    console.log('[AI Stream] Handler entered (Core - Stub)');
    return res.status(403).json({
        error: 'AI features are available in the Premium edition. Please upgrade to access this feature.'
    });
});
