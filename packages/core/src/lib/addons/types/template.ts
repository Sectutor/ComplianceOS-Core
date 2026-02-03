import { BaseAddon } from '../base';
import type { AddonContext, AddonConfiguration } from '../types';
import type { AddonHookResult, AddonInitializationResult } from '../types';

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'date' | 'checkbox' | 'richtext';
  required?: boolean;
  default?: unknown;
  options?: { label: string; value: string }[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    message?: string;
  };
  description?: string;
}

export interface TemplateSection {
  id: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  order: number;
}

export interface TemplateOutput {
  type: 'document' | 'spreadsheet' | 'presentation' | 'custom';
  format: 'pdf' | 'docx' | 'xlsx' | 'html' | 'markdown' | 'json';
  template: string;
}

export interface TemplateAddonManifest {
  type: 'template';
  templateType: 'policy' | 'procedure' | 'assessment' | 'report' | 'questionnaire' | 'plan' | 'custom';
  framework?: string[];
  sections: TemplateSection[];
  output: TemplateOutput;
  variables: Record<string, {
    name: string;
    description?: string;
    required?: boolean;
    source: 'static' | 'client' | 'user' | 'ai' | 'calculation';
    calculation?: string;
  }>;
}

export abstract class TemplateAddon extends BaseAddon {
  constructor(manifest: TemplateAddonManifest) {
    super(manifest);
  }

  abstract getTemplateId(): string;
  abstract getTemplateName(): string;
  abstract getTemplateType(): string;

  abstract render(
    context: AddonContext,
    variables: Record<string, unknown>,
    config?: AddonConfiguration
  ): Promise<AddonHookResult>;

  abstract preview(
    context: AddonContext,
    variables: Record<string, unknown>
  ): Promise<AddonHookResult>;

  getSections(): TemplateSection[] {
    return (this.manifestData as unknown as TemplateAddonManifest).sections;
  }

  getOutputFormat(): TemplateOutput {
    return (this.manifestData as unknown as TemplateAddonManifest).output;
  }

  getVariables(): Record<string, { name: string; description?: string; required?: boolean; source: string }> {
    return (this.manifestData as unknown as TemplateAddonManifest).variables;
  }

  async validateVariables(variables: Record<string, unknown>): Promise<AddonHookResult> {
    const templateManifest = this.manifestData as unknown as TemplateAddonManifest;
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const [key, variable] of Object.entries(templateManifest.variables)) {
      if (variable.required && !(key in variables) && variable.source !== 'ai') {
        missing.push(key);
      }
    }

    if (missing.length > 0) {
      return { 
        success: false, 
        message: `Missing required variables: ${missing.join(', ')}` 
      };
    }

    return { success: true };
  }

  async generateVariables(context: AddonContext): Promise<Record<string, unknown>> {
    const templateManifest = this.manifestData as unknown as TemplateAddonManifest;
    const variables: Record<string, unknown> = {};

    for (const [key, variable] of Object.entries(templateManifest.variables)) {
      if (variable.source === 'client' && context.clientId) {
        variables[key] = await this.fetchClientData(context.clientId, key);
      } else if (variable.source === 'user' && context.userId) {
        variables[key] = await this.fetchUserData(context.userId, key);
      }
    }

    return variables;
  }

  protected async fetchClientData(clientId: number, field: string): Promise<unknown> {
    return null;
  }

  protected async fetchUserData(userId: number, field: string): Promise<unknown> {
    return null;
  }

  abstract getSettingsSchema(): Record<string, unknown>;
  abstract renderSettings(): React.ReactNode;
}
