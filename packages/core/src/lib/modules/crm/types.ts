import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { AppRouter } from '@/routers';

import { z } from "zod";

export type CrmContact = {
    id: number;
    clientId: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    jobTitle: string | null;
    isPrimary: boolean | null;
    category: string | null;
    linkedInUrl: string | null;
    notes: string | null;
    updatedAt: Date | null;
    createdAt: Date | null;
};

export type CrmActivity = {
    id: number;
    clientId: number;
    userId: number;
    type: string; // 'email' | 'call' | 'meeting' | 'note' | 'task'
    subject: string | null;
    content: string | null;
    outcome: string | null;
    occurredAt: Date | null;
    createdAt: Date | null;
};
// Engagements (formerly Deals)
export const engagementSchema = z.object({
    id: z.number(),
    clientId: z.number(),
    title: z.string().min(1, "Title is required"),
    stage: z.enum(["planned", "gap_analysis", "remediation", "audit_prep", "audit_active", "certified", "maintenance"]),
    framework: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    targetDate: z.date().nullable().optional(),
    progress: z.number().min(0).max(100).default(0),
    owner: z.string().nullish(),
    controlsCount: z.number().default(0),
    mitigatedRisksCount: z.number().default(0),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type Engagement = z.infer<typeof engagementSchema>;

export const createEngagementSchema = z.object({
    title: z.string().min(1, "Title is required"),
    framework: z.string().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
    targetDate: z.string().optional().transform(str => str ? new Date(str) : null),
    amount: z.string().optional(), // Legacy compat just in case, but we ignore it
});

export type CreateEngagementInput = z.infer<typeof createEngagementSchema>;

// Stats
export interface CrmStats {
    complianceScore: number;
    openProjectsCount: number;
    risksMitigatedCount: number;
    totalContacts: number;
    totalActivities: number;
    recentActivitiesCount: number;
}

export interface ControlChecklistItem {
    controlId: number; // Database ID in client_controls
    controlCode: string; // e.g. "CC1.1"
    name: string;
    description: string | null;
    status: 'not_implemented' | 'in_progress' | 'implemented' | 'not_applicable';
    owner: string | null;
    evidenceCount: number;
}

export interface EngagementRisk {
    id: number;
    title: string;
    description: string | null;
    status: string | null;
    inherentRiskScore: number | null;
    owner: string | null;
}

export interface EngagementDetails extends Engagement {
    controls: ControlChecklistItem[];
    tasks: any[]; // Remediation Tasks
    activities: CrmActivity[];
    risks: EngagementRisk[];
}

export interface CreateTaskInput {
    clientId: number;
    title: string;
    description?: string;
    priority: "low" | "medium" | "high" | "critical";
    dueDate?: Date;
    status: "open" | "in_progress" | "resolved" | "closed";
    assigneeId?: number;
}

export type CreateContactInput = {
    clientId: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    isPrimary?: boolean;
    category?: string;
    linkedInUrl?: string;
    notes?: string;
};

export type CreateActivityInput = {
    clientId: number;
    type: 'email' | 'call' | 'meeting' | 'note' | 'task';
    subject?: string;
    content?: string;
    outcome?: string;
    occurredAt?: Date;
};

export const createContactSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    jobTitle: z.string().optional(),
    isPrimary: z.boolean().optional(),
    category: z.string().optional(),
    linkedInUrl: z.string().url().optional().or(z.literal('')),
    notes: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
    id: z.number(),
});

export const createActivitySchema = z.object({
    type: z.enum(['email', 'call', 'meeting', 'note', 'task']),
    subject: z.string().optional(),
    content: z.string().optional(),
    outcome: z.string().optional(),
    occurredAt: z.date().optional(), // Or string based on how it's passed? Date is fine if superjson used.
});

export type UpdateContactInput = z.infer<typeof updateContactSchema>;
