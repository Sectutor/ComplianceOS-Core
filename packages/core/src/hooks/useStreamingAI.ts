import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface StreamingState {
    text: string;
    isLoading: boolean;
    error: string | null;
    isComplete: boolean;
}

interface StreamingOptions {
    systemPrompt?: string;
    userPrompt?: string;
    clientId?: number;
    templateId?: number;
    tailor?: boolean;
    instruction?: string;
    sections?: string[];
    language?: string;
    temperature?: number;
    onChunk?: (chunk: string) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: string) => void;
}

export function useStreamingAI() {
    const { session } = useAuth();
    const [state, setState] = useState<StreamingState>({
        text: '',
        isLoading: false,
        error: null,
        isComplete: false,
    });

    const generate = useCallback(async (options: StreamingOptions) => {
        console.log('[useStreamingAI] Generate called', {
            hasSession: !!session,
            options
        });
        setState({ text: '', isLoading: true, error: null, isComplete: false });

        try {
            const body: any = {
                temperature: options.temperature,
            };

            // Legacy support
            if (options.systemPrompt) body.systemPrompt = options.systemPrompt;
            if (options.userPrompt) body.userPrompt = options.userPrompt;

            // Structured policy fields
            if (options.clientId) body.clientId = options.clientId;
            if (options.templateId) body.templateId = options.templateId;
            if (options.tailor !== undefined) body.tailor = options.tailor;
            if (options.instruction) body.instruction = options.instruction;
            if (options.sections) body.sections = options.sections;
            if (options.language) body.language = options.language;

            const response = await fetch('/api/ai/generate-stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(body),
            });

            console.log('[useStreamingAI] Response received:', {
                status: response.status,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let fullText = '';
            let remainder = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = (remainder + chunk).split('\n');
                remainder = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;

                    try {
                        const jsonStr = trimmed.slice(6);
                        const data = JSON.parse(jsonStr);

                        if (data.error) {
                            setState(prev => ({ ...prev, isLoading: false, error: data.error }));
                            options.onError?.(data.error);
                            return;
                        }

                        if (data.done) {
                            setState(prev => ({ ...prev, isLoading: false, isComplete: true }));
                            options.onComplete?.(fullText);
                            return;
                        }

                        if (data.text) {
                            fullText += data.text;
                            setState(prev => ({ ...prev, text: fullText }));
                            options.onChunk?.(data.text);
                        }
                    } catch (e) {
                        console.warn('[AI Stream] Failed to parse line:', line, e);
                    }
                }
            }

            setState(prev => ({ ...prev, isLoading: false, isComplete: true }));
            options.onComplete?.(fullText);

        } catch (error: any) {
            const errorMessage = error.message || 'Streaming failed';
            setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
            options.onError?.(errorMessage);
        }
    }, []);

    const reset = useCallback(() => {
        setState({ text: '', isLoading: false, error: null, isComplete: false });
    }, []);

    return {
        ...state,
        generate,
        reset,
    };
}

/**
 * Non-hook version for use in callbacks
 */
export async function streamAIContent(
    options: StreamingOptions,
    onProgress: (text: string) => void,
    token?: string
): Promise<string> {
    const response = await fetch('/api/ai/generate-stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
            systemPrompt: options.systemPrompt,
            userPrompt: options.userPrompt,
            clientId: options.clientId,
            templateId: options.templateId,
            tailor: options.tailor,
            instruction: options.instruction,
            sections: options.sections,
            language: options.language,
            temperature: options.temperature,
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let remainder = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = (remainder + chunk).split('\n');
        remainder = lines.pop() || '';

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            try {
                const jsonStr = trimmed.slice(6);
                const data = JSON.parse(jsonStr);

                if (data.error) {
                    throw new Error(data.error);
                }

                if (data.done) {
                    return fullText;
                }

                if (data.text) {
                    fullText += data.text;
                    onProgress(fullText);
                }
            } catch (e: any) {
                if (e.message && !e.message.includes('JSON')) {
                    throw e;
                }
            }
        }
    }

    return fullText;
}
