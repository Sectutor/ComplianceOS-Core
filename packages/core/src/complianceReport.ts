import PDFDocument from 'pdfkit';
import * as db from './db';

interface ReportData {
  client: {
    id: number;
    name: string;
    industry: string | null;
    targetComplianceScore: number | null;
  };
  complianceScore: {
    overall: number;
    controlsImplemented: number;
    totalControls: number;
    policiesApproved: number;
    totalPolicies: number;
    evidenceVerified: number;
    totalEvidence: number;
  };
  coverage: {
    totalControls: number;
    mappedControls: number;
    unmappedControls: number;
    coveragePercentage: number;
    policyCoverage: {
      policyName: string;
      controlCount: number;
    }[];
    unmappedControlsList: {
      controlId: string;
      name: string;
    }[];
  };
  controlsByStatus: {
    implemented: number;
    inProgress: number;
    notImplemented: number;
    notApplicable: number;
  };
  policiesByStatus: {
    approved: number;
    review: number;
    draft: number;
    archived: number;
  };
  evidenceByStatus: {
    verified: number;
    pending: number;
    expired: number;
  };
  generatedAt: Date;
}

export async function generateComplianceReadinessReport(clientId: number): Promise<Buffer> {
  // Gather all report data
  const client = await db.getClientById(clientId);
  if (!client) {
    throw new Error('Client not found');
  }

  const complianceScore = await db.getClientComplianceScore(clientId);
  const coverage = await db.getPolicyCoverageAnalysis(clientId);
  const clientControls = await db.getClientControls(clientId);
  const clientPolicies = await db.getClientPolicies(clientId);
  const clientEvidence = await db.getEvidence(clientId);

  // Calculate status breakdowns
  const controlsByStatus = {
    implemented: clientControls.filter(c => c.clientControl.status === 'implemented').length,
    inProgress: clientControls.filter(c => c.clientControl.status === 'in_progress').length,
    notImplemented: clientControls.filter(c => c.clientControl.status === 'not_implemented').length,
    notApplicable: clientControls.filter(c => c.clientControl.status === 'not_applicable').length,
  };

  const policiesByStatus = {
    approved: clientPolicies.filter(p => p.clientPolicy.status === 'approved').length,
    review: clientPolicies.filter(p => p.clientPolicy.status === 'review').length,
    draft: clientPolicies.filter(p => p.clientPolicy.status === 'draft').length,
    archived: clientPolicies.filter(p => p.clientPolicy.status === 'archived').length,
  };

  const evidenceByStatus = {
    verified: clientEvidence.filter(e => e.evidence.status === 'verified').length,
    pending: clientEvidence.filter(e => e.evidence.status === 'pending').length,
    expired: clientEvidence.filter(e => e.evidence.status === 'expired').length,
  };

  const reportData: ReportData = {
    client: {
      id: client.id,
      name: client.name,
      industry: client.industry,
      targetComplianceScore: client.targetComplianceScore,
    },
    complianceScore: {
      overall: complianceScore?.complianceScore || 0,
      controlsImplemented: complianceScore?.implementedControls || 0,
      totalControls: complianceScore?.totalControls || 0,
      policiesApproved: complianceScore?.policyStatus.approved || 0,
      totalPolicies: complianceScore?.policyStatus.total || 0,
      evidenceVerified: complianceScore?.evidenceStatus.verified || 0,
      totalEvidence: complianceScore?.evidenceStatus.total || 0,
    },
    coverage: {
      totalControls: coverage.totalControls,
      mappedControls: coverage.mappedControls,
      unmappedControls: coverage.unmappedControls,
      coveragePercentage: coverage.coveragePercentage,
      policyCoverage: coverage.policyCoverage.map(p => ({
        policyName: p.policyName,
        controlCount: p.controlCount,
      })),
      unmappedControlsList: coverage.unmappedControlsList.map(c => ({
        controlId: c.controlId,
        name: c.name,
      })),
    },
    controlsByStatus,
    policiesByStatus,
    evidenceByStatus,
    generatedAt: new Date(),
  };

  return generatePDF(reportData);
}

function generatePDF(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: `Compliance Readiness Report - ${data.client.name}`,
        Author: 'Compliance OS',
        Subject: 'Compliance Readiness Assessment',
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Colors
    const primaryColor = '#0066cc';
    const successColor = '#22c55e';
    const warningColor = '#f59e0b';
    const dangerColor = '#ef4444';
    const grayColor = '#6b7280';

    // Header
    doc.fontSize(24).fillColor(primaryColor).text('Compliance Readiness Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor(grayColor).text(data.client.name, { align: 'center' });
    if (data.client.industry) {
      doc.fontSize(10).text(data.client.industry, { align: 'center' });
    }
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated: ${data.generatedAt.toLocaleDateString()} at ${data.generatedAt.toLocaleTimeString()}`, { align: 'center' });

    doc.moveDown(2);

    // Executive Summary
    doc.fontSize(16).fillColor(primaryColor).text('Executive Summary');
    doc.moveDown(0.5);

    // Overall Score Box
    const scoreColor = data.complianceScore.overall >= 80 ? successColor :
      data.complianceScore.overall >= 50 ? warningColor : dangerColor;

    doc.rect(50, doc.y, 495, 80).fillAndStroke('#f8fafc', '#e2e8f0');
    const boxY = doc.y + 15;

    doc.fontSize(36).fillColor(scoreColor).text(`${data.complianceScore.overall}%`, 70, boxY);
    doc.fontSize(12).fillColor(grayColor).text('Overall Compliance Score', 70, boxY + 45);

    if (data.client.targetComplianceScore) {
      doc.fontSize(14).fillColor(primaryColor).text(`Target: ${data.client.targetComplianceScore}%`, 200, boxY + 10);
      const gap = data.client.targetComplianceScore - data.complianceScore.overall;
      if (gap > 0) {
        doc.fontSize(10).fillColor(warningColor).text(`${gap}% gap to target`, 200, boxY + 30);
      } else {
        doc.fontSize(10).fillColor(successColor).text('Target achieved!', 200, boxY + 30);
      }
    }

    // Key Metrics
    doc.fontSize(10).fillColor('#1f2937');
    doc.text(`Controls: ${data.complianceScore.controlsImplemented}/${data.complianceScore.totalControls} implemented`, 350, boxY + 5);
    doc.text(`Policies: ${data.complianceScore.policiesApproved}/${data.complianceScore.totalPolicies} approved`, 350, boxY + 20);
    doc.text(`Evidence: ${data.complianceScore.evidenceVerified}/${data.complianceScore.totalEvidence} verified`, 350, boxY + 35);
    doc.text(`Mapping: ${data.coverage.coveragePercentage}% coverage`, 350, boxY + 50);

    doc.y = boxY + 80;
    doc.moveDown(2);

    // Control-Policy Mapping Coverage
    doc.fontSize(16).fillColor(primaryColor).text('Control-Policy Mapping Coverage');
    doc.moveDown(0.5);

    const coverageColor = data.coverage.coveragePercentage >= 80 ? successColor :
      data.coverage.coveragePercentage >= 50 ? warningColor : dangerColor;

    doc.fontSize(12).fillColor('#1f2937');
    doc.text(`Coverage: `, { continued: true });
    doc.fillColor(coverageColor).text(`${data.coverage.coveragePercentage}%`, { continued: true });
    doc.fillColor('#1f2937').text(` (${data.coverage.mappedControls} of ${data.coverage.totalControls} controls mapped to policies)`);
    doc.moveDown(0.5);

    // Progress bar
    const barWidth = 400;
    const barHeight = 15;
    const barX = 50;
    const barY = doc.y;

    doc.rect(barX, barY, barWidth, barHeight).fillAndStroke('#e5e7eb', '#d1d5db');
    doc.rect(barX, barY, barWidth * (data.coverage.coveragePercentage / 100), barHeight).fill(coverageColor);

    doc.y = barY + barHeight + 20;

    // Policy Coverage Table
    if (data.coverage.policyCoverage.length > 0) {
      doc.fontSize(12).fillColor('#1f2937').text('Policies and Their Control Coverage:');
      doc.moveDown(0.5);

      // Table header
      doc.fontSize(10).fillColor(grayColor);
      doc.text('Policy Name', 50, doc.y, { width: 350 });
      doc.text('Controls', 420, doc.y - 12);
      doc.moveDown(0.3);

      // Draw line
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#e5e7eb');
      doc.moveDown(0.3);

      doc.fillColor('#1f2937');
      for (const policy of data.coverage.policyCoverage.slice(0, 10)) {
        doc.text(policy.policyName.substring(0, 50), 50, doc.y, { width: 350 });
        doc.text(policy.controlCount.toString(), 420, doc.y - 12);
        doc.moveDown(0.5);
      }

      if (data.coverage.policyCoverage.length > 10) {
        doc.fontSize(9).fillColor(grayColor).text(`... and ${data.coverage.policyCoverage.length - 10} more policies`);
      }
    }

    doc.moveDown(1);

    // Gap Analysis - Unmapped Controls
    if (data.coverage.unmappedControls > 0) {
      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      doc.fontSize(16).fillColor(dangerColor).text('Gap Analysis: Unmapped Controls');
      doc.moveDown(0.5);

      doc.fontSize(11).fillColor('#1f2937');
      doc.text(`${data.coverage.unmappedControls} controls are not mapped to any policy. These represent compliance gaps that should be addressed.`);
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor(grayColor);
      for (const control of data.coverage.unmappedControlsList.slice(0, 15)) {
        doc.text(`• ${control.controlId} - ${control.name.substring(0, 60)}${control.name.length > 60 ? '...' : ''}`);
        doc.moveDown(0.3);
      }

      if (data.coverage.unmappedControlsList.length > 15) {
        doc.fontSize(9).fillColor(grayColor).text(`... and ${data.coverage.unmappedControlsList.length - 15} more unmapped controls`);
      }
    } else {
      doc.fontSize(12).fillColor(successColor).text('✓ All controls are mapped to policies');
    }

    doc.moveDown(1.5);

    // Check if we need a new page
    if (doc.y > 550) {
      doc.addPage();
    }

    // Controls Status Breakdown
    doc.fontSize(16).fillColor(primaryColor).text('Controls Status Breakdown');
    doc.moveDown(0.5);

    const totalControls = data.controlsByStatus.implemented + data.controlsByStatus.inProgress +
      data.controlsByStatus.notImplemented + data.controlsByStatus.notApplicable;

    doc.fontSize(11).fillColor('#1f2937');
    doc.text(`Implemented: `, { continued: true });
    doc.fillColor(successColor).text(`${data.controlsByStatus.implemented}`, { continued: true });
    doc.fillColor('#1f2937').text(` (${totalControls > 0 ? Math.round((data.controlsByStatus.implemented / totalControls) * 100) : 0}%)`);

    doc.text(`In Progress: `, { continued: true });
    doc.fillColor(warningColor).text(`${data.controlsByStatus.inProgress}`, { continued: true });
    doc.fillColor('#1f2937').text(` (${totalControls > 0 ? Math.round((data.controlsByStatus.inProgress / totalControls) * 100) : 0}%)`);

    doc.text(`Not Implemented: `, { continued: true });
    doc.fillColor(dangerColor).text(`${data.controlsByStatus.notImplemented}`, { continued: true });
    doc.fillColor('#1f2937').text(` (${totalControls > 0 ? Math.round((data.controlsByStatus.notImplemented / totalControls) * 100) : 0}%)`);

    doc.text(`Not Applicable: `, { continued: true });
    doc.fillColor(grayColor).text(`${data.controlsByStatus.notApplicable}`, { continued: true });
    doc.fillColor('#1f2937').text(` (${totalControls > 0 ? Math.round((data.controlsByStatus.notApplicable / totalControls) * 100) : 0}%)`);

    doc.moveDown(1.5);

    // Policies Status Breakdown
    doc.fontSize(16).fillColor(primaryColor).text('Policies Status Breakdown');
    doc.moveDown(0.5);

    const totalPolicies = data.policiesByStatus.approved + data.policiesByStatus.review +
      data.policiesByStatus.draft + data.policiesByStatus.archived;

    doc.fontSize(11).fillColor('#1f2937');
    doc.text(`Approved: `, { continued: true });
    doc.fillColor(successColor).text(`${data.policiesByStatus.approved}`, { continued: true });
    doc.fillColor('#1f2937').text(` (${totalPolicies > 0 ? Math.round((data.policiesByStatus.approved / totalPolicies) * 100) : 0}%)`);

    doc.text(`In Review: `, { continued: true });
    doc.fillColor(warningColor).text(`${data.policiesByStatus.review}`, { continued: true });
    doc.fillColor('#1f2937').text(` (${totalPolicies > 0 ? Math.round((data.policiesByStatus.review / totalPolicies) * 100) : 0}%)`);

    doc.text(`Draft: `, { continued: true });
    doc.fillColor(grayColor).text(`${data.policiesByStatus.draft}`, { continued: true });
    doc.fillColor('#1f2937').text(` (${totalPolicies > 0 ? Math.round((data.policiesByStatus.draft / totalPolicies) * 100) : 0}%)`);

    doc.text(`Archived: `, { continued: true });
    doc.fillColor(grayColor).text(`${data.policiesByStatus.archived}`);

    doc.moveDown(1.5);

    // Evidence Status Breakdown
    doc.fontSize(16).fillColor(primaryColor).text('Evidence Status Breakdown');
    doc.moveDown(0.5);

    const totalEvidence = data.evidenceByStatus.verified + data.evidenceByStatus.pending + data.evidenceByStatus.expired;

    doc.fontSize(11).fillColor('#1f2937');
    doc.text(`Verified: `, { continued: true });
    doc.fillColor(successColor).text(`${data.evidenceByStatus.verified}`, { continued: true });
    doc.fillColor('#1f2937').text(` (${totalEvidence > 0 ? Math.round((data.evidenceByStatus.verified / totalEvidence) * 100) : 0}%)`);

    doc.text(`Pending Review: `, { continued: true });
    doc.fillColor(warningColor).text(`${data.evidenceByStatus.pending}`, { continued: true });
    doc.fillColor('#1f2937').text(` (${totalEvidence > 0 ? Math.round((data.evidenceByStatus.pending / totalEvidence) * 100) : 0}%)`);

    doc.text(`Expired: `, { continued: true });
    doc.fillColor(dangerColor).text(`${data.evidenceByStatus.expired}`, { continued: true });
    doc.fillColor('#1f2937').text(` (${totalEvidence > 0 ? Math.round((data.evidenceByStatus.expired / totalEvidence) * 100) : 0}%)`);

    doc.moveDown(2);

    // Compliance Roadmap
    doc.fontSize(16).fillColor(primaryColor).text('Compliance Roadmap');
    doc.moveDown(0.5);

    doc.fontSize(11).fillColor('#1f2937');

    const recommendations: string[] = [];

    if (data.coverage.unmappedControls > 0) {
      recommendations.push(`Map ${data.coverage.unmappedControls} unmapped controls to appropriate policies to improve coverage.`);
    }

    if (data.controlsByStatus.notImplemented > 0) {
      recommendations.push(`Address ${data.controlsByStatus.notImplemented} not-implemented controls to improve compliance posture.`);
    }

    if (data.policiesByStatus.draft > 0) {
      recommendations.push(`Review and approve ${data.policiesByStatus.draft} draft policies.`);
    }

    if (data.evidenceByStatus.expired > 0) {
      recommendations.push(`Re-verify ${data.evidenceByStatus.expired} expired evidence items.`);
    }

    if (data.evidenceByStatus.pending > 0) {
      recommendations.push(`Review ${data.evidenceByStatus.pending} pending evidence items.`);
    }

    if (data.client.targetComplianceScore && data.complianceScore.overall < data.client.targetComplianceScore) {
      recommendations.push(`Focus on closing the ${data.client.targetComplianceScore - data.complianceScore.overall}% gap to reach target compliance score.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain current compliance posture and continue regular reviews.');
    }

    for (let i = 0; i < recommendations.length; i++) {
      doc.text(`${i + 1}. ${recommendations[i]}`);
      doc.moveDown(0.3);
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).fillColor(grayColor);
    doc.text('This report was generated by Compliance OS. For questions or support, contact your compliance administrator.', { align: 'center' });

    doc.end();
  });
}
