import express from 'express';
import { generateProfessionalDocx, generateProfessionalHtml } from '../../policyExportProfessional'; // Adjust path if needed
import * as db from '../../db'; // Use namespace import
import { clientPolicies, clients, policyTemplates } from '../../schema';
import { eq, and } from 'drizzle-orm';
import TurndownService from 'turndown';
import puppeteer from 'puppeteer';
import * as schema from '../../schema';

export const exportRouter = express.Router();

const turndownService = new TurndownService();

// Helper to fetch policy data
async function getPolicyData(policyId: number) {
    const d = await db.getDb(); // Get DB instance

    // Use query builder if available, or fallback to select if getDb returns basic instance
    // Assuming schema is passed to drizzle(), .query should be available.
    // If typescript errors, we might need to cast or use standard select().
    // Let's use d.query assuming it works, or fallback to db.getClientPolicies which exists in other files?

    // Actually, clients.ts uses db.getClientById(id). Let's see if there is db.getClientPolicyById?
    // checking db.ts for policy getters would be safer, but direct query is fine if d is typed.

    const policy = await d.query.clientPolicies.findFirst({
        where: eq(clientPolicies.id, policyId),
        with: {
            // client: true, // we will fetch client separately to be safe match existing pattern
        }
    });

    if (!policy) return null;

    // Fetch client
    const client = await d.query.clients.findFirst({
        where: eq(clients.id, policy.clientId)
    });

    if (!client) return null;

    // Fetch template
    let sections: string[] = [];
    if (policy.templateId) {
        const template = await d.query.policyTemplates.findFirst({
            where: eq(policyTemplates.id, policy.templateId)
        });
        if (template && template.sections) {
            sections = template.sections as string[];
        }
    }

    // Convert HTML to Markdown if needed
    let content = policy.content || "";
    if (content.trim().startsWith("<")) {
        content = turndownService.turndown(content);
    }

    // V14.5.1: Data Integrity Signature (AL 3)
    // Create a verification hash of the content to ensure integrity
    const cryptoNode = await import('crypto');
    const { getActiveKey } = await import('../../lib/secrets');
    const systemSecret = getActiveKey();
    const verificationHash = cryptoNode
        .createHmac('sha256', systemSecret)
        .update(`${policy.id}:${policy.updatedAt?.getTime()}:${content}`)
        .digest('hex');

    return {
        name: policy.name,
        content: content,
        sections: sections,
        version: policy.version || 1,
        clientName: client.name,
        status: policy.status || 'draft',
        createdAt: policy.createdAt || new Date(),
        updatedAt: policy.updatedAt || new Date(),
        templateId: policy.templateId?.toString(),
        logoUrl: client.logoUrl,
        contactName: client.contactName,
        contactTitle: client.contactTitle,
        contactEmail: client.contactEmail,
        contactPhone: client.contactPhone,
        address: client.address,
        clientId: client.id.toString(),
        verificationHash // AL 3 Integrity Control
    };
}

// DOCX Export
exportRouter.get('/policy/:id/professional-docx', async (req: any, res) => {
    try {
        if (!req.user) {
            return res.status(401).send('Authentication required');
        }

        const policyId = parseInt(req.params.id);
        const data = await getPolicyData(policyId);

        if (!data) {
            return res.status(404).send('Policy not found');
        }

        // Authorization check: User must have access to the client
        const d = await db.getDb();
        const membership = await d.query.userClients.findFirst({
            where: and(
                eq(schema.userClients.userId, req.user.id),
                eq(schema.userClients.clientId, parseInt(data.clientId))
            )
        });

        if (!membership && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).send('No access to this client workspace');
        }

        const buffer = await generateProfessionalDocx(data);

        res.setHeader('Content-Disposition', `attachment; filename="${data.name.replace(/[^a-z0-9]/gi, '_')}.docx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);
    } catch (error) {
        console.error("Export DOCX Error:", error);
        res.status(500).send('Error generating document');
    }
});

// HTML Preview (Professional)
exportRouter.get('/policy/:id/professional-html', async (req: any, res) => {
    try {
        if (!req.user) {
            return res.status(401).send('Authentication required');
        }

        const policyId = parseInt(req.params.id);
        const data = await getPolicyData(policyId);

        if (!data) {
            return res.status(404).send('Policy not found');
        }

        // Authorization check
        const d = await db.getDb();
        const membership = await d.query.userClients.findFirst({
            where: and(
                eq(schema.userClients.userId, req.user.id),
                eq(schema.userClients.clientId, parseInt(data.clientId))
            )
        });

        if (!membership && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).send('No access to this client workspace');
        }

        const html = generateProfessionalHtml(data);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (error) {
        console.error("Export HTML Error:", error);
        res.status(500).send('Error generating preview');
    }
});

// PDF Export (via Puppeteer)
exportRouter.get('/policy/:id/pdf', async (req: any, res) => {
    try {
        if (!req.user) {
            return res.status(401).send('Authentication required');
        }

        const policyId = parseInt(req.params.id);
        const data = await getPolicyData(policyId);

        if (!data) {
            return res.status(404).send('Policy not found');
        }

        // Authorization check
        const d = await db.getDb();
        const membership = await d.query.userClients.findFirst({
            where: and(
                eq(schema.userClients.userId, req.user.id),
                eq(schema.userClients.clientId, parseInt(data.clientId))
            )
        });

        if (!membership && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).send('No access to this client workspace');
        }

        const html = generateProfessionalHtml(data);

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Required for some environments
        });
        const page = await browser.newPage();

        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '1in',
                bottom: '1in',
                left: '1in',
                right: '1in'
            }
        });

        await browser.close();

        res.setHeader('Content-Disposition', `attachment; filename="${data.name.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Export PDF Error:", error);
        res.status(500).send('Error generating PDF');
    }
});
