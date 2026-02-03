import { getDb } from '../../db';
import { clients, policyTemplates, Client } from '../../schema';
import { eq } from 'drizzle-orm';
// import { LLMService } from '../llm/service';

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
}

export class PolicyGenerator {
    // private llmService: LLMService;

    constructor() {
        // this.llmService = new LLMService();
    }

    /**
     * Generates a policy content string by substituting variables and optionally tailoring via LLM.
     */
    async generate(clientId: number, templateId: number, options: GenerationOptions = {}): Promise<string> {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        // 1. Fetch Client Data
        const client = await db.query.clients.findFirst({
            where: eq(clients.id, clientId),
        });

        if (!client) throw new Error(`Client with ID ${clientId} not found`);

        // Get language from options or client settings
        const language = options.language || client.policyLanguage || 'en';
        const languageName = LANGUAGE_NAMES[language] || 'English';

        // 2. Fetch Template Data
        const template = await db.query.policyTemplates.findFirst({
            where: eq(policyTemplates.id, templateId),
        });

        if (!template) throw new Error(`Template with ID ${templateId} not found`);

        console.log("DEBUG: PolicyGenerator template:", template.templateId, "language:", language);

        let content = "";

        // Check for monolithic content first
        if (template.content && template.content.trim().length > 0) {
            content = template.content;
        }
        // Fallback to modular sections
        else if (template.sections && Array.isArray(template.sections) && template.sections.length > 0) {
            const sections = template.sections as any[];
            content = sections
                .filter(s => s && (s.defaultEnabled !== false))
                .map(s => {
                    if (typeof s === 'string') return s;
                    const title = s.title || "Untitled Section";
                    const body = s.content || s.text || "";
                    return `## ${title}\n\n${body}`;
                })
                .join("\n\n");
        }

        // 3. Smart Variable Substitution
        content = this.substituteVariables(content, client);

        // 4. Industry Tailoring (LLM) with language support
        if ((options.tailorToIndustry || options.customInstruction) && template.sections) {
            // AI Tailoring removed for Core split
            // content = await this.tailorContentWithLLM(content, client, template.name, options.customInstruction, language);
        }

        return content;
    }

    private substituteVariables(content: string, client: Client): string {
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
        const languageName = LANGUAGE_NAMES[language] || 'English';

        // Create skeleton
        let content = sections.map(s => `## ${s}\n\n[Content to be generated]`).join("\n\n");
        content = `# ${policyName}\n\n${content}`;

        // Use LLM to fill it with language support
        // Use LLM to fill it with language support - Removed for Core split
        return content;

        /*
        const prompt = `...`;

        try {
            const response = await this.llmService.generate({ ... });
            return response.text;
        } catch (e) {
            console.error("LLM Generation failed", e);
            return content; // Return skeleton if failed
        }
        */
    }

    async suggestSections(policyName: string, industry?: string): Promise<string[]> {
        return ["Introduction", "Scope", "Policy Statement", "Roles and Responsibilities", "Compliance"];
        /*
        const prompt = `Suggest 5-8 common policy section titles for a "${policyName}" policy in the ${industry || 'General'} industry. Return only a JSON array of strings.`;
        try {
            const response = await this.llmService.generate({ ... });
            const sections = JSON.parse(response.text);
            return Array.isArray(sections) ? sections : [];
        } catch (e) {
            console.error("Suggest sections failed:", e);
            return ["Introduction", "Scope", "Policy Statement", "Roles and Responsibilities", "Compliance"];
        }
        */
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
6. Return ONLY the updated policy text in Markdown format.

Original Policy:
${content}
        `;

        const systemPrompt = `You are a specialized compliance policy writer. You MUST write all content in ${languageName}.`;

        return { userPrompt, systemPrompt };
    }

    private async tailorContentWithLLM(content: string, client: Client, policyName: string, customInstruction?: string, language: string = 'en'): Promise<string> {
        return content;
        /*
        const languageName = LANGUAGE_NAMES[language] || 'English';

        try {
            const prompt = `...`;

            const response = await this.llmService.generate({ ... });

            return response.text;
        } catch (error) {
            console.error("LLM Tailoring failed:", error);
            return content; // Fallback to untailored content
        }
        */
    }
}

export const policyGenerator = new PolicyGenerator();
