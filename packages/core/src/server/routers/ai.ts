import { Router } from 'express';
import { llmService } from '../../lib/llm/service';
import { policyGenerator } from '../../lib/policy/policy-generation';

export const aiRouter = Router();

// Replaced Stub with Real Implementation
aiRouter.post('/generate-stream', async (req: any, res: any) => {
    // console.log('[AI Stream] Request received', {
    //     hasUser: !!req.user,
    //     userId: req.user?.id,
    //     body: req.body
    // });

    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        let { systemPrompt, userPrompt, temperature, maxTokens, instruction, tailor, clientId, templateId } = req.body;

        // If templateId is provided but no userPrompt, generate from policy generator
        if (templateId && !userPrompt) {
            try {
                const prompt = await policyGenerator.getGenerationPrompt(
                    templateId,
                    instruction,
                    tailor,
                    clientId ? parseInt(clientId) : undefined
                );
                userPrompt = prompt.userPrompt;
                // If systemPrompt is not provided in body, use the one from generator
                if (!systemPrompt) systemPrompt = prompt.systemPrompt;
            } catch (err: any) {
                console.error('[AI Stream] Failed to generate prompt from template:', err);
                return res.status(500).json({ error: 'Failed to prepare prompt from template: ' + err.message });
            }
        }

        if (!userPrompt) {
            return res.status(400).json({ error: 'Missing userPrompt' });
        }

        // Apply customization logic: Append instruction to prompt if provided AND NOT already handled by getGenerationPrompt
        // policy-generation already handles instruction in getGenerationPrompt, so we only add it here if plain userPrompt was passed
        if (instruction && !templateId) {
            const instructionText = `\n\nIMPORTANT INSTRUCTION: ${instruction}`;
            if (systemPrompt) {
                systemPrompt += instructionText;
            } else {
                systemPrompt = `You are a helpful AI assistant. ${instructionText}`;
            }
        }

        // Send SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        // Flush headers immediately usually happens on first write, but explicitly setting headers helps.

        const stream = llmService.generateStream({
            systemPrompt,
            userPrompt,
            temperature,
            maxTokens
        }, {
            userId: req.user.id,
            clientId,
            endpoint: 'generate-stream'
        });

        for await (const chunk of stream) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();

    } catch (error: any) {
        console.error('[AI Stream] Error:', error);
        if (!res.headersSent) {
            return res.status(500).json({ error: error.message });
        } else {
            // Stream error
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }
});
