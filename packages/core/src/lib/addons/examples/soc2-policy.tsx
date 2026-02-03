import React from 'react';
import { TemplateAddon, type TemplateAddonManifest } from '../types/template';
import type { AddonConfiguration } from '../types';
import type { AddonHookResult } from '../types';

interface SOC2PolicyManifest extends TemplateAddonManifest {
  type: 'template';
  templateType: 'policy';
  framework: string[];
}

const soc2PolicyManifest: SOC2PolicyManifest = {
  id: 'soc2-policy-template',
  name: 'SOC 2 Policy Template',
  version: '1.0.0',
  description: 'Comprehensive SOC 2 compliance policy template covering all Trust Services Criteria',
  author: 'ComplianceOS Team',
  category: 'template',
  tags: ['soc2', 'policy', 'security', 'trust-services'],
  homepage: 'https://complianceos.com/templates/soc2',
  compatibility: {
    minVersion: '1.0.0',
  },
  permissions: ['read:policies', 'write:policies'],
  type: 'template',
  templateType: 'policy',
  framework: ['SOC2'],
  sections: [
    {
      id: 'security',
      name: 'Security Policy',
      description: 'Security policies covering access control, encryption, and threat management',
      order: 1,
      fields: [
        { id: 'passwordPolicy', name: 'Password Policy', type: 'richtext', required: true },
        { id: 'accessControl', name: 'Access Control Policy', type: 'richtext', required: true },
        { id: 'encryption', name: 'Encryption Policy', type: 'richtext', required: true },
      ],
    },
    {
      id: 'availability',
      name: 'Availability Policy',
      description: 'Policies for system availability and disaster recovery',
      order: 2,
      fields: [
        { id: 'backupPolicy', name: 'Backup Policy', type: 'richtext', required: true },
        { id: 'drPolicy', name: 'Disaster Recovery Policy', type: 'richtext', required: true },
        { id: 'incidentResponse', name: 'Incident Response Policy', type: 'richtext', required: true },
      ],
    },
    {
      id: 'confidentiality',
      name: 'Confidentiality Policy',
      description: 'Data classification and handling policies',
      order: 3,
      fields: [
        { id: 'dataClassification', name: 'Data Classification', type: 'richtext', required: true },
        { id: 'confidentialityAgreements', name: 'Confidentiality Agreements', type: 'richtext', required: true },
      ],
    },
    {
      id: 'privacy',
      name: 'Privacy Policy',
      description: 'Data privacy and protection policies',
      order: 4,
      fields: [
        { id: 'dataRetention', name: 'Data Retention Policy', type: 'richtext', required: true },
        { id: 'privacyNotice', name: 'Privacy Notice', type: 'richtext', required: true },
        { id: 'consentManagement', name: 'Consent Management', type: 'richtext', required: false },
      ],
    },
    {
      id: 'processing',
      name: 'Processing Integrity',
      description: 'Data processing accuracy and completeness policies',
      order: 5,
      fields: [
        { id: 'dataValidation', name: 'Data Validation Policy', type: 'richtext', required: true },
        { id: 'qualityAssurance', name: 'Quality Assurance Policy', type: 'richtext', required: true },
      ],
    },
  ],
  output: {
    type: 'document',
    format: 'docx',
    template: 'soc2-policy-template.docx',
  },
  variables: {
    organizationName: {
      name: 'Organization Name',
      required: true,
      source: 'client',
    },
    effectiveDate: {
      name: 'Effective Date',
      required: true,
      source: 'static',
    },
    reviewDate: {
      name: 'Review Date',
      required: true,
      source: 'calculation',
      calculation: 'effectiveDate + 365 days',
    },
    preparedBy: {
      name: 'Prepared By',
      required: true,
      source: 'user',
    },
    approvedBy: {
      name: 'Approved By',
      required: true,
      source: 'client',
    },
  },
};

export class SOC2PolicyTemplate extends TemplateAddon {
  constructor() {
    super(soc2PolicyManifest);
  }

  getTemplateId(): string {
    return 'soc2-policy';
  }

  getTemplateName(): string {
    return 'SOC 2 Policy Template';
  }

  getTemplateType(): string {
    return 'policy';
  }

  async render(
    context: AddonContext,
    variables: Record<string, unknown>,
    config?: AddonConfiguration
  ): Promise<AddonHookResult> {
    const validation = await this.validateVariables(variables);
    if (!validation.success) {
      return validation;
    }

    try {
      const sections = this.getSections();
      const renderedSections = await Promise.all(
        sections.map(async (section) => ({
          id: section.id,
          name: section.name,
          content: await this.renderSection(section, variables),
        }))
      );

      return {
        success: true,
        data: {
          template: this.id,
          sections: renderedSections,
          variables,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Rendering failed' };
    }
  }

  async preview(
    context: AddonContext,
    variables: Record<string, unknown>
  ): Promise<AddonHookResult> {
    const availableVariables = await this.generateVariables(context);
    const previewVariables = { ...availableVariables, ...variables };

    return {
      success: true,
      data: {
        template: this.id,
        templateName: this.name,
        description: this.manifestData.description,
        sections: this.getSections().map((s) => ({
          id: s.id,
          name: s.name,
          fieldCount: s.fields.length,
        })),
        requiredVariables: Object.entries(this.getVariables())
          .filter(([, v]) => v.required)
          .map(([key]) => key),
        availableVariables: Object.keys(previewVariables),
      },
    };
  }

  private async renderSection(
    section: { id: string; fields: Array<{ id: string; name: string; type: string }> },
    variables: Record<string, unknown>
  ): Promise<Record<string, string>> {
    const renderedFields: Record<string, string> = {};

    for (const field of section.fields) {
      const fieldValue = variables[field.id];
      if (typeof fieldValue === 'string') {
        renderedFields[field.id] = fieldValue;
      } else {
        renderedFields[field.id] = '';
      }
    }

    return renderedFields;
  }

  getSettingsSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        defaultSections: {
          type: 'array',
          title: 'Default Sections',
          items: { type: 'string' },
          default: ['security', 'availability', 'confidentiality', 'privacy', 'processing'],
        },
        includeSignature: {
          type: 'boolean',
          title: 'Include Signature Page',
          default: true,
        },
        versionControl: {
          type: 'boolean',
          title: 'Enable Version Control',
          default: true,
        },
      },
    };
  }

  renderSettings(): React.ReactNode {
    const config = this.getConfig();
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Default Sections</label>
          <select
            name="defaultSections"
            multiple
            defaultValue={(config.defaultSections as string[]) || ['security', 'availability', 'confidentiality', 'privacy', 'processing']}
            className="flex h-32 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="security">Security Policy</option>
            <option value="availability">Availability Policy</option>
            <option value="confidentiality">Confidentiality Policy</option>
            <option value="privacy">Privacy Policy</option>
            <option value="processing">Processing Integrity</option>
          </select>
          <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple sections</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="includeSignature"
              defaultChecked={config.includeSignature !== false}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Include Signature Page</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="versionControl"
              defaultChecked={config.versionControl !== false}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Enable Version Control</span>
          </div>
        </div>
      </div>
    );
  }
}

export const soc2PolicyTemplate = new SOC2PolicyTemplate();
