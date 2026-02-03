/**
 * Policy Export Utilities - Server-side via API
 * Uses server-side generation for reliable document creation
 */

interface PolicyData {
    id: number;
    name: string;
}

/**
 * Export policy to DOCX format via server API
 */
export async function exportToDOCX(policy: PolicyData): Promise<void> {
    // Use direct navigation to let browser handle the download and filename from Content-Disposition
    const url = `/api/export/policy/${policy.id}/professional-docx?t=${Date.now()}`;
    window.location.assign(url);
}

/**
 * Export policy to PDF format via server API
 */
export async function exportToPDF(policy: PolicyData): Promise<void> {
    // Use direct navigation to let browser handle the download and filename from Content-Disposition
    const url = `/api/export/policy/${policy.id}/pdf?t=${Date.now()}`;
    window.location.assign(url);
}

/**
 * Preview policy as HTML in a new window
 */
export function previewAsHTML(policyId: number): void {
    window.open(`/api/export/policy/${policyId}/professional-html`, '_blank');
}
