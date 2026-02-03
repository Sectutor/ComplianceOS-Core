/**
 * Enhanced LLM Service with Multi-Provider Support
 * Supports OpenAI, Anthropic, Google Gemini, and OpenAI-compatible APIs
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { getDb } from '../../db';
import { decrypt } from '../crypto';
import { LLMProvider, llmProviders, aiUsageMetrics, llmRouterRules } from '../../schema';
import { desc, eq, and } from 'drizzle-orm';
import { logger } from '../logger';

export interface CompletionRequest {
    systemPrompt?: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean; // Enable JSON output mode
    schema?: z.ZodSchema; // Zod schema for structured output validation
    feature?: string; // Feature definition for routing (e.g. 'risk_analysis')
}

export interface CompletionResponse {
    text: string;
    provider: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

export interface UsageMetadata {
    clientId?: number;
    userId?: number;
    endpoint: string;
}

export class LLMService {
    /**
     * Get the highest priority enabled provider
     */
    /**
     * Get the configured provider for a feature, or fallback to highest priority
     */
    private async getProviders(feature?: string): Promise<LLMProvider[]> {
        const db = await getDb();
        if (!db) return [];

        let providers: LLMProvider[] = [];

        // 1. Try to find a specific rule for this feature
        if (feature) {
            const rule = await db.select({
                provider: llmProviders
            })
                .from(llmRouterRules)
                .innerJoin(llmProviders, eq(llmRouterRules.providerId, llmProviders.id))
                .where(and(
                    eq(llmRouterRules.feature, feature),
                    eq(llmProviders.isEnabled, true)
                ))
                .limit(1);

            if (rule.length > 0) {
                providers.push(rule[0].provider);
            }
        }

        // 2. Fallback to highest priority enabled provider
        const allProviders = await db.select()
            .from(llmProviders)
            .where(eq(llmProviders.isEnabled, true))
            .orderBy(desc(llmProviders.priority));

        // Add remaining providers (avoid duplicates)
        for (const p of allProviders) {
            if (!providers.find(existing => existing.id === p.id)) {
                providers.push(p);
            }
        }

        return providers;
    }

    /**
     * Track AI usage metrics
     */
    private async trackUsage(
        provider: LLMProvider,
        usage: CompletionResponse['usage'],
        metadata: UsageMetadata,
        latencyMs: number,
        success: boolean,
        errorMessage?: string
    ): Promise<void> {
        const db = await getDb();
        if (!db || !usage) return;

        try {
            // Calculate estimated cost (simplified pricing)
            const costPerMToken = this.getCostPerMToken(provider.provider, provider.model);
            const estimatedCostCents = Math.ceil(
                (usage.totalTokens / 1000000) * costPerMToken * 100
            );

            await db.insert(aiUsageMetrics).values({
                clientId: metadata.clientId,
                userId: metadata.userId,
                endpoint: metadata.endpoint,
                provider: provider.provider,
                model: provider.model,
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.totalTokens,
                estimatedCostCents,
                latencyMs,
                success,
                errorMessage,
                requestMetadata: metadata as any,
            });
        } catch (error) {
            logger.error('Failed to track AI usage:', error);
        }
    }

    /**
     * Get cost per million tokens (simplified pricing)
     */
    private getCostPerMToken(provider: string, model: string): number {
        const pricing: Record<string, number> = {
            'gpt-4': 30,
            'gpt-4-turbo': 10,
            'gpt-3.5-turbo': 0.5,
            'claude-3-opus': 15,
            'claude-3-sonnet': 3,
            'claude-3-haiku': 0.25,
            'gemini-pro': 0.5,
            'gemini-1.5-pro': 3.5,
        };

        const key = model.toLowerCase();
        for (const [modelPrefix, cost] of Object.entries(pricing)) {
            if (key.includes(modelPrefix)) return cost;
        }

        return 1; // Default fallback
    }

    /**
     * Create OpenAI client (supports OpenAI and compatible APIs)
     */
    private getOpenAIClient(provider: LLMProvider): OpenAI {
        const apiKey = decrypt(provider.apiKey);
        const config: any = { apiKey };

        if (provider.baseUrl) {
            config.baseURL = provider.baseUrl;
        }

        return new OpenAI(config);
    }

    /**
     * Create Anthropic client
     */
    private getAnthropicClient(provider: LLMProvider): Anthropic {
        const apiKey = decrypt(provider.apiKey);
        return new Anthropic({ apiKey });
    }

    /**
     * Create Google Gemini client
     */
    private getGeminiClient(provider: LLMProvider): GoogleGenerativeAI {
        const apiKey = decrypt(provider.apiKey);
        return new GoogleGenerativeAI(apiKey);
    }

    /**
     * Generate text completion with multi-provider support
     */
    async generate(
        request: CompletionRequest,
        metadata: UsageMetadata = { endpoint: 'generate' }
    ): Promise<CompletionResponse> {
        const providers = await this.getProviders(request.feature);

        if (providers.length === 0) {
            throw new Error("No enabled LLM provider found. Please configure one in Settings.");
        }

        const startTime = Date.now();
        let lastError: Error | undefined;

        for (const provider of providers) {
            try {
                let response: CompletionResponse;

                switch (provider.provider) {
                    case 'anthropic':
                        response = await this.generateAnthropic(provider, request);
                        break;
                    case 'gemini':
                        response = await this.generateGemini(provider, request);
                        break;
                    case 'openai':
                    case 'deepseek':
                    case 'openrouter':
                    case 'custom':
                    default:
                        response = await this.generateOpenAI(provider, request);
                        break;
                }

                // Validate structured output if schema provided
                if (request.schema && request.jsonMode) {
                    try {
                        const parsed = JSON.parse(response.text);
                        request.schema.parse(parsed);
                    } catch (error: any) {
                        logger.warn(`Structured output validation failed (${provider.name}):`, error.message);
                        // Continue anyway failure here is not provider failure
                    }
                }

                const latencyMs = Date.now() - startTime;
                await this.trackUsage(provider, response.usage, metadata, latencyMs, true);

                return response;

            } catch (error: any) {
                const latencyMs = Date.now() - startTime;
                await this.trackUsage(
                    provider,
                    { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                    metadata,
                    latencyMs,
                    false,
                    error.message
                );

                console.warn(`[LLM] Provider ${provider.name} failed:`, error.message);
                lastError = error;
                // Continue to next provider
            }
        }

        // If we get here, all providers failed
        logger.error("All LLM providers failed:", lastError);
        throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
    }

    /**
     * Generate using OpenAI or compatible API
     */
    private async generateOpenAI(
        provider: LLMProvider,
        request: CompletionRequest
    ): Promise<CompletionResponse> {
        const client = this.getOpenAIClient(provider);

        const messages: any[] = [
            { role: 'system', content: request.systemPrompt || 'You are a helpful compliance assistant.' },
            { role: 'user', content: request.userPrompt }
        ];

        const params: any = {
            model: provider.model,
            messages,
            temperature: request.temperature ?? 0.7,
        };

        if (request.maxTokens) params.max_tokens = request.maxTokens;
        if (request.jsonMode) params.response_format = { type: 'json_object' };

        const completion = await client.chat.completions.create(params);

        return {
            text: completion.choices[0]?.message?.content || '',
            provider: provider.provider,
            model: provider.model,
            usage: {
                promptTokens: completion.usage?.prompt_tokens || 0,
                completionTokens: completion.usage?.completion_tokens || 0,
                totalTokens: completion.usage?.total_tokens || 0,
            }
        };
    }

    /**
     * Generate using Anthropic Claude
     */
    private async generateAnthropic(
        provider: LLMProvider,
        request: CompletionRequest
    ): Promise<CompletionResponse> {
        const client = this.getAnthropicClient(provider);

        const params: any = {
            model: provider.model,
            max_tokens: request.maxTokens || 4096,
            temperature: request.temperature ?? 0.7,
            messages: [
                { role: 'user', content: request.userPrompt }
            ],
        };

        if (request.systemPrompt) {
            params.system = request.systemPrompt;
        }

        const completion = await client.messages.create(params);

        const text = completion.content
            .filter(block => block.type === 'text')
            .map((block: any) => block.text)
            .join('\n');

        return {
            text,
            provider: provider.provider,
            model: provider.model,
            usage: {
                promptTokens: completion.usage.input_tokens,
                completionTokens: completion.usage.output_tokens,
                totalTokens: completion.usage.input_tokens + completion.usage.output_tokens,
            }
        };
    }

    /**
     * Generate using Google Gemini
     */
    private async generateGemini(
        provider: LLMProvider,
        request: CompletionRequest
    ): Promise<CompletionResponse> {
        const client = this.getGeminiClient(provider);
        const model = client.getGenerativeModel({ model: provider.model });

        const prompt = request.systemPrompt
            ? `${request.systemPrompt}\n\n${request.userPrompt}`
            : request.userPrompt;

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: request.temperature ?? 0.7,
                maxOutputTokens: request.maxTokens || 2048,
            },
        });

        const response = result.response;
        const text = response.text();

        // Gemini doesn't provide detailed token usage in all cases
        const estimatedTokens = Math.ceil(text.length / 4);

        return {
            text,
            provider: provider.provider,
            model: provider.model,
            usage: {
                promptTokens: Math.ceil(prompt.length / 4),
                completionTokens: estimatedTokens,
                totalTokens: Math.ceil(prompt.length / 4) + estimatedTokens,
            }
        };
    }

    /**
     * Generate text completion with streaming
     */
    async *generateStream(
        request: CompletionRequest,
        metadata: UsageMetadata = { endpoint: 'generateStream' }
    ): AsyncGenerator<string, void, unknown> {
        const providers = await this.getProviders(request.feature);

        if (providers.length === 0) {
            throw new Error("No enabled LLM provider found. Please configure one in Settings.");
        }

        const startTime = Date.now();
        let lastError: Error | undefined;

        for (const provider of providers) {
            try {
                switch (provider.provider) {
                    case 'anthropic':
                        yield* this.streamAnthropic(provider, request);
                        break;
                    case 'gemini':
                        yield* this.streamGemini(provider, request);
                        break;
                    case 'openai':
                    case 'deepseek':
                    case 'openrouter':
                    case 'custom':
                    default:
                        yield* this.streamOpenAI(provider, request);
                        break;
                }

                const latencyMs = Date.now() - startTime;
                await this.trackUsage(
                    provider,
                    { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                    metadata,
                    latencyMs,
                    true
                );
                return;

            } catch (error: any) {
                const latencyMs = Date.now() - startTime;
                await this.trackUsage(
                    provider,
                    { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                    metadata,
                    latencyMs,
                    false,
                    error.message
                );

                console.warn(`[LLM-Stream] Provider ${provider.name} failed:`, error.message);
                lastError = error;
                // Try next provider
            }
        }

        logger.error("All LLM streaming providers failed:", lastError);
        throw new Error(`All LLM streaming providers failed. Last error: ${lastError?.message}`);
    }

    /**
     * Stream using OpenAI or compatible API
     */
    private async *streamOpenAI(
        provider: LLMProvider,
        request: CompletionRequest
    ): AsyncGenerator<string, void, unknown> {
        const client = this.getOpenAIClient(provider);

        const stream = await client.chat.completions.create({
            model: provider.model,
            messages: [
                { role: 'system', content: request.systemPrompt || 'You are a helpful compliance assistant.' },
                { role: 'user', content: request.userPrompt }
            ],
            temperature: request.temperature ?? 0.7,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield content;
            }
        }
    }

    /**
     * Stream using Anthropic Claude
     */
    private async *streamAnthropic(
        provider: LLMProvider,
        request: CompletionRequest
    ): AsyncGenerator<string, void, unknown> {
        const client = this.getAnthropicClient(provider);

        const params: any = {
            model: provider.model,
            max_tokens: request.maxTokens || 4096,
            temperature: request.temperature ?? 0.7,
            messages: [{ role: 'user', content: request.userPrompt }],
            stream: true,
        };

        if (request.systemPrompt) {
            params.system = request.systemPrompt;
        }

        const stream = await client.messages.create(params);

        for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                yield event.delta.text;
            }
        }
    }

    /**
     * Stream using Google Gemini
     */
    private async *streamGemini(
        provider: LLMProvider,
        request: CompletionRequest
    ): AsyncGenerator<string, void, unknown> {
        const client = this.getGeminiClient(provider);
        const model = client.getGenerativeModel({ model: provider.model });

        const prompt = request.systemPrompt
            ? `${request.systemPrompt}\n\n${request.userPrompt}`
            : request.userPrompt;

        const result = await model.generateContentStream({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: request.temperature ?? 0.7,
                maxOutputTokens: request.maxTokens || 2048,
            },
        });

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                yield text;
            }
        }
    }

    /**
     * Generate embeddings for a given text
     */
    async getEmbeddings(text: string): Promise<number[]> {
        // Find a provider that supports embeddings
        // Priority: OpenAI -> First available provider with supportsEmbeddings=true
        const db = await getDb();

        let provider: LLMProvider | undefined;

        // Try to get explicit OpenAI provider first (preferred for embeddings usually)
        const openAIProvider = await db.select().from(llmProviders)
            .where(and(eq(llmProviders.provider, 'openai'), eq(llmProviders.isEnabled, true)))
            .limit(1);

        if (openAIProvider.length > 0) {
            provider = openAIProvider[0];
        } else {
            // Fallback to any provider supporting embeddings
            const embeddedProviders = await db.select().from(llmProviders)
                .where(and(eq(llmProviders.supportsEmbeddings, true), eq(llmProviders.isEnabled, true)))
                .orderBy(desc(llmProviders.priority))
                .limit(1);

            if (embeddedProviders.length > 0) {
                provider = embeddedProviders[0];
            }
        }

        if (!provider) {
            throw new Error("No embedding-capable LLM provider found. Please configure one in Settings.");
        }

        const startTime = Date.now();

        try {
            let embedding: number[] = [];

            if (provider.provider === 'openai' || provider.provider === 'azure-openai') {
                const client = this.getOpenAIClient(provider);
                const response = await client.embeddings.create({
                    model: 'text-embedding-3-small', // Default efficient model
                    input: text,
                    encoding_format: 'float',
                });
                embedding = response.data[0].embedding;
            } else if (provider.provider === 'gemini') {
                const client = this.getGeminiClient(provider);
                const model = client.getGenerativeModel({ model: 'text-embedding-004' });
                const result = await model.embedContent(text);
                embedding = result.embedding.values;
            } else {
                // Fallback/Custom (Not fully implemented for generic providers yet)
                throw new Error(`Provider ${provider.provider} embedding not yet supported`);
            }

            await this.trackUsage(
                provider,
                { promptTokens: Math.ceil(text.length / 4), completionTokens: 0, totalTokens: Math.ceil(text.length / 4) },
                { endpoint: 'getEmbeddings' },
                Date.now() - startTime,
                true
            );

            return embedding;

        } catch (error: any) {
            await this.trackUsage(
                provider,
                { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
                { endpoint: 'getEmbeddings' },
                Date.now() - startTime,
                false,
                error.message
            );
            logger.error("Embedding Generation Failed:", error);
            throw error;
        }
    }

    /**
     * Test a provider connection
     */
    async testConnection(provider: Partial<LLMProvider> & { apiKey: string }): Promise<boolean> {
        try {
            const testRequest: CompletionRequest = {
                userPrompt: 'Test',
                maxTokens: 5,
            };

            switch (provider.provider) {
                case 'anthropic': {
                    const client = new Anthropic({ apiKey: provider.apiKey });
                    await client.messages.create({
                        model: provider.model || 'claude-3-haiku-20240307',
                        max_tokens: 5,
                        messages: [{ role: 'user', content: 'Test' }],
                    });
                    break;
                }

                case 'gemini': {
                    const client = new GoogleGenerativeAI(provider.apiKey);
                    const model = client.getGenerativeModel({ model: provider.model || 'gemini-pro' });
                    await model.generateContent('Test');
                    break;
                }

                default: {
                    const config: any = { apiKey: provider.apiKey };
                    if (provider.baseUrl) config.baseURL = provider.baseUrl;

                    const client = new OpenAI(config);
                    await client.chat.completions.create({
                        model: provider.model || 'gpt-3.5-turbo',
                        messages: [{ role: 'user', content: 'Test' }],
                        max_tokens: 5,
                    });
                    break;
                }
            }

            return true;
        } catch (e) {
            logger.error("Test connection failed", e);
            return false;
        }
    }
}

export const llmService = new LLMService();
