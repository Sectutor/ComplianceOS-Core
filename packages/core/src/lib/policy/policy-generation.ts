import { getDb } from '../../db';
import { clients, policyTemplates, Client } from '../../schema';
import { eq } from 'drizzle-orm';
import { LLMService } from '../llm/service';

// Language names for prompts
const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian',
    pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', sv: 'Swedish', da: 'Danish',
    fi: 'Finnish', no: 'Norwegian', cs: 'Czech', hu: 'Hungarian', ro: 'Romanian',
    bg: 'Bulgarian', el: 'Greek', ja: 'Japanese', zh: 'Chinese', ko: 'Korean',
    ar: 'Arabic', he: 'Hebrew', tr: 'Turkish', ru: 'Russian', uk: 'Ukrainian',
};

interface GenerationOptions {
    tailorToIndustry?: boolean;
    customInstruction?: string;
    modelOverride?: string;
    providerOverride?: string;
    language?: string; // Language code (e.g., 'en', 'de', 'fr')
    answers?: Record<string, any>;
}

export class PolicyGenerator {
    private llmService: LLMService;
    // NOTE: This in-memory cache is per-instance. For multi-instance deployments (e.g., Kubernetes,
    // multiple PM2 processes, or serverless), each instance maintains its own cache which may lead to
    // inconsistent behavior. Consider using Redis or similar distributed cache for production environments
    // with multiple server instances.
    private clientCache = new Map<number, Client>();
    private templateCache = new Map<number, any>();
    private static readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
    private clientCacheTime = new Map<number, number>();
    private templateCacheTime = new Map<number, number>();

    constructor() {
        this.llmService = new LLMService();
    }

    /**
     * Clear caches - useful for long-running processes or testing
     */
    clearCaches(): void {
        this.clientCache.clear();
        this.templateCache.clear();
        this.clientCacheTime.clear();
        this.templateCacheTime.clear();
    }

    private getCachedClient(clientId: number): Client | undefined {
        const cached = this.clientCache.get(clientId);
        const cacheTime = this.clientCacheTime.get(clientId);
        if (cached && cacheTime && (Date.now() - cacheTime) < PolicyGenerator.CACHE_TTL_MS) {
            return cached;
        }
        return undefined;
    }

    private setCachedClient(clientId: number, client: Client): void {
        this.clientCache.set(clientId, client);
        this.clientCacheTime.set(clientId, Date.now());
    }

    private getCachedTemplate(templateId: number): any | undefined {
        const cached = this.templateCache.get(templateId);
        const cacheTime = this.templateCacheTime.get(templateId);
        if (cached && cacheTime && (Date.now() - cacheTime) < PolicyGenerator.CACHE_TTL_MS) {
            return cached;
        }
        return undefined;
    }

    private setCachedTemplate(templateId: number, template: any): void {
        this.templateCache.set(templateId, template);
        this.templateCacheTime.set(templateId, Date.now());
    }

    /**
     * Generates a policy content string by substituting variables and optionally tailoring via LLM.
     */
    async generate(clientId: number, templateId: number, options: GenerationOptions = {}): Promise<string> {
        const startTime = Date.now();
        const perfMetrics: Record<string, number> = {};

        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // 1. Fetch Client Data (with caching)
        const clientStart = Date.now();
        let client = this.getCachedClient(clientId);
        if (!client) {
            client = await db.query.clients.findFirst({
                where: eq(clients.id, clientId),
            });
            if (client) this.setCachedClient(clientId, client);
        }
        perfMetrics.dbClientFetch = Date.now() - clientStart;

        if (!client) throw new Error(`Client with ID ${clientId} not found`);

        // Get language from options or client settings
        const language = options.language || client.policyLanguage || 'en';
        const languageName = LANGUAGE_NAMES[language] || 'English';

        // 2. Fetch Template Data (with caching)
        const templateStart = Date.now();
        let template = this.getCachedTemplate(templateId);
        if (!template) {
            template = await db.query.policyTemplates.findFirst({
                where: eq(policyTemplates.id, templateId),
            });
            if (template) this.setCachedTemplate(templateId, template);
        }
        perfMetrics.dbTemplateFetch = Date.now() - templateStart;

        if (!template) throw new Error(`Template with ID ${templateId} not found`);

        console.log("[PolicyGen] Template:", template.templateId, "language:", language);

        let content = "";
        const answers = options.answers || {};

        // Helper to check conditions
        const checkCondition = (condition?: string) => {
            if (!condition) return true;
            try {
                // Simple evaluator for "key == value" or "key"
                const parts = condition.split(' ');
                if (parts.length === 1) return !!answers[parts[0]];
                if (parts.length === 3) {
                    const [key, op, val] = parts;
                    const answer = answers[key];
                    const target = val === 'true' ? true : val === 'false' ? false : val.replace(/['"]/g, '');
                    if (op === '==' || op === '===') return answer == target;
                    if (op === '!=' || op === '!==') return answer != target;
                }
                return true;
            } catch (e) {
                console.error("Condition evaluation failed:", condition, e);
                return true;
            }
        };

        // Check for monolithic content first
        const sectionStart = Date.now();
        if (template.content && template.content.trim().length > 0) {
            console.log(`[PolicyGen] Using monolithic template content (${template.content.length} chars)`);
            content = template.content;
        }
        // Fallback to modular sections
        else if (template.sections && Array.isArray(template.sections) && template.sections.length > 0) {
            const sections = template.sections as any[];
            content = sections
                .filter(s => {
                    if (!s) return false;
                    const isEnabled = s.defaultEnabled !== false;
                    const meetsCondition = checkCondition(s.condition);
                    return isEnabled && meetsCondition;
                })
                .map(s => {
                    if (typeof s === 'string') return s;
                    const title = s.title || "Untitled Section";
                    const body = s.content || s.text || "";
                    return `## ${title}\n\n${body}`;
                })
                .join("\n\n");
        }
        perfMetrics.sectionProcessing = Date.now() - sectionStart;

        // 3. Smart Variable Substitution
        const varSubStart = Date.now();
        content = this.substituteVariables(content, client, answers);
        perfMetrics.variableSubstitution = Date.now() - varSubStart;

        // 4. Industry Tailoring (LLM) with language support
        if ((options.tailorToIndustry || options.customInstruction)) {
            const llmStart = Date.now();
            console.log(`[PolicyGen] Starting LLM tailoring for policy: ${template.name}, language: ${language}`);
            content = await this.tailorContentWithLLM(content, client, template.name, options.customInstruction, language, answers);
            perfMetrics.llmTailoring = Date.now() - llmStart;
            console.log(`[PolicyGen] LLM tailoring finished in ${perfMetrics.llmTailoring}ms`);
        }

        perfMetrics.total = Date.now() - startTime;
        console.log('[PolicyGen] Performance metrics (ms):', perfMetrics);

        return content;
    }

    private substituteVariables(content: string, client: Client, answers: Record<string, any> = {}): string {
        let replaced = content;

        // Calculate dates
        const today = new Date();
        const effectiveDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const reviewDate = new Date(today);
        reviewDate.setFullYear(reviewDate.getFullYear() + 1);
        const reviewDateStr = reviewDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const replacements: Record<string, string | null | undefined> = {
            // Company/Client Name variations
            '{{CLIENT_NAME}}': client.name,
            '{{COMPANY_NAME}}': client.name,
            '\\[COMPANY NAME\\]': client.name,
            '\\[CLIENT NAME\\]': client.name,
            "Company's Name": client.name,
            "\\[Company Name\\]": client.name,
            "\\[Organization Name\\]": client.name,

            // Industry
            '{{INDUSTRY}}': client.industry || '[Industry]',
            '\\[INDUSTRY\\]': client.industry || '[Industry]',
            '\\[Industry\\]': client.industry || '[Industry]',

            // CISO / Approved By
            '{{CISO_NAME}}': client.cisoName || '[CISO Name]',
            '\\[CISO NAME\\]': client.cisoName || '[CISO Name]',
            '\\[CISO Name\\]': client.cisoName || '[CISO Name]',
            'Approved By: \\[CISO Name\\]': `Approved By: ${client.cisoName || '[CISO Name]'}`,

            // DPO
            '{{DPO_NAME}}': client.dpoName || '[DPO Name]',
            '\\[DPO NAME\\]': client.dpoName || '[DPO Name]',
            '\\[DPO Name\\]': client.dpoName || '[DPO Name]',

            // Location
            '{{HEADQUARTERS}}': client.headquarters || '[Headquarters Location]',
            '\\[HEADQUARTERS\\]': client.headquarters || '[Headquarters Location]',
            '\\[Headquarters\\]': client.headquarters || '[Headquarters Location]',
            '\\[Location\\]': client.headquarters || '[Location]',

            // Region
            '{{REGION}}': client.mainServiceRegion || client.region || '[Region]',
            '\\[REGION\\]': client.mainServiceRegion || client.region || '[Region]',
            '\\[Region\\]': client.mainServiceRegion || client.region || '[Region]',

            // Contact
            '{{CONTACT_EMAIL}}': client.primaryContactEmail || '[Contact Email]',
            '\\[CONTACT EMAIL\\]': client.primaryContactEmail || '[Contact Email]',
            '\\[Contact Email\\]': client.primaryContactEmail || '[Contact Email]',

            // Legal Entity
            '{{LEGAL_ENTITY_NAME}}': client.legalEntityName || client.name,
            '\\[Legal Entity Name\\]': client.legalEntityName || client.name,

            // Dates
            '{{EFFECTIVE_DATE}}': effectiveDate,
            '\\[Date\\]': effectiveDate,
            '\\[Effective Date\\]': effectiveDate,
            'Effective Date: \\[Date\\]': `Effective Date: ${effectiveDate}`,

            // Review Date (1 year from now)
            '{{REVIEW_DATE}}': reviewDateStr,
            '\\[Date \\+ 1 Year\\]': reviewDateStr,
            '\\[Review Date\\]': reviewDateStr,
            'Review Date: \\[Date \\+ 1 Year\\]': `Review Date: ${reviewDateStr}`,

            // Version
            '{{VERSION}}': '1.0',
            '\\[Version\\]': '1.0',
        };

        // Add tailoring answers to replacements
        for (const [key, value] of Object.entries(answers)) {
            replacements[`{{${key}}}`] = String(value);
            replacements[`\\[${key}\\]`] = String(value);
        }

        for (const [key, value] of Object.entries(replacements)) {
            // Global replace
            const regex = new RegExp(key, 'gi');
            replaced = replaced.replace(regex, value || `[Missing ${key.replace(/\\/g, '')}]`);
        }

        return replaced;
    }

    async generateFromSections(clientId: number, policyName: string, sections: string[], options: GenerationOptions = {}): Promise<string> {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const client = await db.query.clients.findFirst({
            where: eq(clients.id, clientId),
        });
        if (!client) throw new Error(`Client with ID ${clientId} not found`);

        // Get language from options or client settings
        const language = options.language || client.policyLanguage || 'en';

        // Create skeleton
        let content = sections.map(s => `## ${s}\n\n[Content to be generated]`).join("\n\n");
        content = `# ${policyName}\n\n${content}`;

        // Smart Variable Substitution
        content = this.substituteVariables(content, client, options.answers || {});

        // AI Generation from Skeleton
        if (options.tailorToIndustry || options.customInstruction) {
            content = await this.tailorContentWithLLM(content, client, policyName, "Generate detailed content for each section based on the header.", language, options.answers || {});
        }

        return content;
    }

    async suggestSections(policyName: string, industry?: string): Promise<string[]> {
        const prompt = `Suggest 5-8 common policy section titles for a "${policyName}" policy in the ${industry || 'General'} industry. Return only a JSON array of strings.`;
        try {
            const response = await this.llmService.generate({
                systemPrompt: "You are a helpful compliance assistant. Return only a JSON array of strings.",
                userPrompt: prompt,
                feature: 'policy_generation',
                maxTokens: 1000,
                temperature: 0.3
            }, { endpoint: 'suggest_sections' });
            const text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const sections = JSON.parse(text);
            return Array.isArray(sections) ? sections : ["Introduction", "Scope", "Policy Statement", "Roles and Responsibilities", "Compliance"];
        } catch (e) {
            console.error("Suggest sections failed:", e);
            return ["Introduction", "Scope", "Policy Statement", "Roles and Responsibilities", "Compliance"];
        }
    }

    async suggestTailoringQuestions(policyName: string, industry: string = 'General', existingQuestions: string[] = []): Promise<Array<{ question: string; type: string; options?: string[] }>> {
        const systemPrompt = `You are an expert compliance officer. Generate 3 distinct tailoring questions for a "${policyName}" policy in the ${industry} industry. Output a JSON array of objects with keys: "question" (string), "type" (one of: boolean, select, text), "options" (array of strings, only if type is select).`;

        const userPrompt = `
        Existing Questions (do not repeat these):
        ${existingQuestions.map(q => `- ${q}`).join('\n')}

        Task: Generate 3 critical questions that would help tailor this policy to a specific client context (e.g., asking about specific technologies, data types, or regulatory requirements).
        Focus on questions that change the content of the policy (e.g., "Do you use cloud storage?", "Do you process credit card data?").
        
        Example Output:
        [
            { "question": "Do you develop software in-house?", "type": "boolean" },
            { "question": "What is your primary cloud provider?", "type": "select", "options": ["AWS", "Azure", "GCP", "None"] }
        ]

        JSON Output ONLY.
        `;

        try {
            const response = await this.llmService.generate({
                systemPrompt,
                userPrompt,
                feature: 'policy_question_generation',
                maxTokens: 2000
            }, { endpoint: 'suggest_questions' });

            let text = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            // detailed parsing to handle potential markdown artifacts
            const start = text.indexOf('[');
            const end = text.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
                text = text.substring(start, end + 1);
            }
            if (!text) {
                console.warn("Suggest questions returned empty response");
                return [];
            }
            return JSON.parse(text);
        } catch (e) {
            console.error("Suggest questions failed:", e);
            return [];
        }
    }

    /**
     * Constructs the full LLM prompt for generating/tailoring a policy.
     * Useful for streaming responses.
     */
    async getGenerationPrompt(clientId: number, templateId?: number, sections?: string[], options: GenerationOptions = {}): Promise<{ userPrompt: string; systemPrompt: string }> {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const client = await db.query.clients.findFirst({
            where: eq(clients.id, clientId),
        });
        if (!client) throw new Error(`Client with ID ${clientId} not found`);

        const language = options.language || client.policyLanguage || 'en';
        const languageName = LANGUAGE_NAMES[language] || 'English';

        let baseContent = "";
        let policyName = "Policy";

        if (templateId) {
            const template = await db.query.policyTemplates.findFirst({
                where: eq(policyTemplates.id, templateId),
            });
            if (!template) throw new Error(`Template with ID ${templateId} not found`);
            policyName = template.name;

            if (template.content && template.content.trim().length > 0) {
                baseContent = template.content;
            } else if (template.sections && Array.isArray(template.sections)) {
                baseContent = (template.sections as any[])
                    .filter(s => s && (s.defaultEnabled !== false))
                    .map(s => {
                        if (typeof s === 'string') return s;
                        return `## ${s.title || "Untitled Section"}\n\n${s.content || s.text || ""}`;
                    })
                    .join("\n\n");
            }
        } else if (sections && sections.length > 0) {
            baseContent = sections.map(s => `## ${s}\n\n[Content for ${s}]`).join("\n\n");
        }

        const content = this.substituteVariables(baseContent, client);

        const userPrompt = `
You are an expert CISO and Compliance Officer specializing in the ${client.industry || 'general'} industry.
Please review and refine the following policy text for "${policyName}".
The goal is to make it specifically relevant to a ${client.size || 'mid-sized'} ${client.industry} company.

IMPORTANT: Write the ENTIRE refined policy in ${languageName}. All text must be in ${languageName}.

${options.customInstruction ? `USER INSTRUCTION: ${options.customInstruction}` : ''}

Directives:
1. Maintain the professional tone and structure.
2. Inject specific security concerns or regulatory references relevant to ${client.industry} (e.g., HIPAA for Health, PCI for Retail, SOC2/ISO for Tech).
3. Do not remove core requirements, only enhance them.
4. Write EVERYTHING in ${languageName} language.
${options.customInstruction ? '5. PRIORITIZE the USER INSTRUCTION provided above.' : ''}
6. Return ONLY the updated policy text in Markdown format. CRITICAL: Insert double newlines (\n\n) before every header and paragraph. Do not use code blocks.

            EXAMPLE OUTPUT (STRICTLY FOLLOW THIS SPACING):
            # Policy Title

            ## 1.0 Purpose

            This is the purpose statement.

            ## 2.0 Scope

            This is the scope statement.

Original Policy:
${content}
        `;

        const systemPrompt = `You are a specialized compliance policy writer. You MUST write all content in ${languageName}. Always use strict Markdown with double newlines between sections.`;

        return { userPrompt, systemPrompt };
    }

    async incorporateMissingSections(clientId: number, currentContent: string, missingSections: { id: string; title: string }[]): Promise<string> {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const client = await db.query.clients.findFirst({
            where: eq(clients.id, clientId),
        });
        if (!client) throw new Error(`Client with ID ${clientId} not found`);

        const language = client.policyLanguage || 'en';
        const languageName = LANGUAGE_NAMES[language] || 'English';

        const sectionsList = missingSections.map(s => `- ${s.title}`).join('\n');

        const systemPrompt = `You are a specialized compliance policy writer. You MUST write all content in ${languageName}.`;
        const userPrompt = `
You are an expert CISO and Compliance Officer assisting ${client.name}.
The following policy content is missing some recommended sections.
Your task is to:
1. INCORPORATE the missing sections into the existing content in their most logical and standard positions.
2. IMPROVE the overall policy by refining the language for clarity, professionalism, and industry standards (${client.industry || 'general'}).
3. ENSURE a cohesive flow between existing and new sections.

MISSING SECTIONS TO ADD:
${sectionsList}

EXISTING CONTENT:
${currentContent}

Directives:
1. Draft logical, professional content for each missing section.
2. Refine existing content to match the tone and quality of the new sections.
3. Use Markdown formatting (## for headers).
4. CRITICAL: Scan the ENTIRE document for placeholders like [Company Name], TBD, [Date], {{company_name}}, [Insert Role], etc., and replace them with specific details for "${client.name}" or other plausible values.
5. Write EVERYTHING in ${languageName}.
6. Return ONLY the complete, improved policy text in Markdown format.
`;

        try {
            const response = await this.llmService.generate({
                systemPrompt,
                userPrompt,
                feature: 'policy_generation',
                maxTokens: 6000
            }, { clientId, endpoint: 'incorporate_linter_sections' });

            return response.text;
        } catch (error) {
            console.error("Failed to incorporate missing sections:", error);
            // Append missing sections if AI fails as fallback
            let updatedContent = currentContent;
            for (const s of missingSections) {
                updatedContent += `\n\n## ${s.title}\n\n[Content to be drafted]`;
            }
            return updatedContent;
        }
    }

    private async tailorContentWithLLM(content: string, client: Client, policyName: string, customInstruction?: string, language: string = 'en', answers: Record<string, any> = {}): Promise<string> {
        const languageName = LANGUAGE_NAMES[language] || 'English';

        // Format answers for prompt
        const answerContext = Object.entries(answers)
            .map(([key, val]) => `- ${key}: ${val}`)
            .join('\n');

        try {
            const systemPrompt = `You are an expert Chief Information Security Officer (CISO) and Compliance Architect with 20+ years of experience.
You are writing a comprehensive, legally robust, and practical ${policyName} for a client.
Your output must be in ${languageName}.
Your output must be in Markdown format.
Do not strip out important sections.
EXPAND on the content to make it thorough.

CRITICAL FORMATTING RULE: Every sub-section must follow this exact structure:
1. A brief 1-3 sentence policy statement paragraph that declares the policy position.
2. Followed by bullet points (using "- " markdown syntax) listing the specific requirements, procedures, responsibilities, and implementation details.
Never write long dense paragraphs. Always break details into bullet points after the statement.`;

            const userPrompt = `
CLIENT PROFILE:
Name: ${client.name}
Industry: ${client.industry || 'Technology/General'}
Size: ${client.size || 'Mid-sized'}
Region: ${client.region || 'US/Global'}

TAILORING CONTEXT (User Responses):
${answerContext || 'No specific tailoring context provided.'}

TASK:
Generate a comprehensive, detailed, and industry-tailored "${policyName}".
Use the provided "Reference Content" as a starting point, but do not be limited by it.
You must EXPAND, DETAIL, and PROFESSIONALIZE the content.
The final policy should be ready for audit review (SOC2, ISO 27001, HIPAA compatible where relevant).

USER INSTRUCTION:
${customInstruction ? `> ${customInstruction}` : 'No specific custom instructions provided. Focus on industry best practices.'}

REQUIREMENTS:
1. **Structured Format**: Each sub-section MUST follow this pattern: Start with a brief, authoritative 1-3 sentence policy statement paragraph that declares the policy position. Then follow with bullet points (using "- " markdown syntax) that provide the specific requirements, procedures, responsibilities, and implementation details. This pattern must be consistent across ALL sections. Never write long dense paragraphs without bullet points.
2. **Detailed and Comprehensive**: Each bullet point should be specific and actionable. Include measurable criteria, responsible parties, timelines, and specific technical or procedural requirements where applicable.
3. **Industry Specific**: Since the client is in ${client.industry || 'General'}, include specific terminology, threats, regulatory requirements, and concerns relevant to this sector.
4. **Context Aware**: Use the "TAILORING CONTEXT" above to specifically include or exclude relevant clauses (e.g. if PII is processed, strictly enforce privacy controls).
5. **Structure**: Use clear Markdown headers (#, ##, ###). Insert double newlines before every header and paragraph. Do not produce a single block of text. Do not use code blocks.
6. **No Placeholders**: Do NOT leave any placeholders like [Date], [Company Name], etc. Use the Client Profile data to fill them in logically.
7. **Language**: Write strictly in ${languageName}.

EXAMPLE OUTPUT (STRICTLY FOLLOW THIS FORMAT):
# Policy Title

## 1.0 Purpose

This policy establishes the mandatory framework for managing and controlling access to information assets and operational environments.

- The primary objective is to protect the confidentiality, integrity, and availability (CIA triad) of all information assets.
- Access shall be granted strictly based on verified business need, the principle of least privilege, and robust accountability mechanisms.
- This policy applies to all employees, contractors, and third-party users who access company systems.

## 2.0 Scope

This policy applies to all information systems, applications, and data repositories owned or managed by the organization.

- All employees, contractors, temporary staff, and third-party service providers with access to company systems are subject to this policy.
- This includes on-premises systems, cloud-hosted environments, remote access solutions, and mobile devices.
- Exceptions to this policy must be formally documented and approved by the CISO.

REFERENCE CONTENT (Use as a base, but significantly improve, expand, and reformat using the statement + bullet points pattern shown above):
${content}
`;

            const response = await this.llmService.generate({
                systemPrompt,
                userPrompt,
                feature: 'policy_generation_comprehensive',
                temperature: 0.4,
                maxTokens: 4000  // Reduced from 8000 to prevent timeouts
            }, { clientId: client.id, endpoint: 'tailor_policy_comprehensive' });

            return response.text;
        } catch (error) {
            console.error("LLM Comprehensive Generation failed:", error);
            // Fallback to original content if AI fails
            return content;
        }
    }
}

export const policyGenerator = new PolicyGenerator();


