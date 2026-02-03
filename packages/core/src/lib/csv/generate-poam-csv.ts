
interface PoamItem {
    id: number;
    controlId: string | null;
    weaknessName: string;
    weaknessDescription: string | null;
    weaknessDetectorSource?: string | null;
    sourceIdentifier?: string | null;
    assetIdentifier?: string | null;
    pointOfContact: string | null;
    resourcesRequired: string | null;
    overallRemediationPlan?: string | null;
    originalDetectionDate?: Date | null;
    scheduledCompletionDate: Date | null;
    milestones?: any; // JSON
    milestoneChanges?: any; // JSON
    status: string | null;
    statusDate?: Date | null;
    vendorDependency?: string | null;
    lastVendorCheckinDate?: Date | null;
    productName?: string | null;
    originalRiskRating?: string | null;
    adjustedRiskRating?: string | null;
    riskAdjustment?: string | null;
    falsePositive?: boolean | null;
    operationalRequirement?: string | null;
    deviationRationale?: string | null;
    supportingDocuments?: any; // JSON
    comments?: string | null;
    autoApprove?: boolean | null;
    createdAt: Date;
}

interface Poam {
    id: number;
    title: string;
}

export function generatePoamCsv(poam: Poam, items: PoamItem[]): string {
    const headers = [
        "POAM ID",
        "Controls",
        "Weakness Name",
        "Weakness Description",
        "Weakness Detector Source",
        "Weakness Source Identifier",
        "Asset Identifier",
        "Point of Contact",
        "Resources Required",
        "Overall Remediation Plan",
        "Original Detection Date",
        "Scheduled Completion Date",
        "Planned Milestones",
        "Milestone Changes",
        "Status",
        "Status Date",
        "Vendor Dependency",
        "Last Vendor Check-in Date",
        "Product Name",
        "Original Risk Rating",
        "Adjusted Risk Rating",
        "Risk Adjustment",
        "False Positive",
        "Operational Requirement",
        "Deviation Rationale",
        "Supporting Documents",
        "Comments",
        "Auto Approve"
    ];

    const rows = items.map(item => {
        return [
            item.id.toString(),
            item.controlId || "",
            escapeCsv(item.weaknessName),
            escapeCsv(item.weaknessDescription || ""),
            escapeCsv(item.weaknessDetectorSource || ""),
            escapeCsv(item.sourceIdentifier || ""),
            escapeCsv(item.assetIdentifier || ""),
            escapeCsv(item.pointOfContact || ""),
            escapeCsv(item.resourcesRequired || ""),
            escapeCsv(item.overallRemediationPlan || ""),
            item.originalDetectionDate ? new Date(item.originalDetectionDate).toISOString().split('T')[0] : "",
            item.scheduledCompletionDate ? new Date(item.scheduledCompletionDate).toISOString().split('T')[0] : "",
            escapeCsv(JSON.stringify(item.milestones || [])),
            escapeCsv(JSON.stringify(item.milestoneChanges || [])),
            item.status || "Open",
            item.statusDate ? new Date(item.statusDate).toISOString().split('T')[0] : "",
            escapeCsv(item.vendorDependency || ""),
            item.lastVendorCheckinDate ? new Date(item.lastVendorCheckinDate).toISOString().split('T')[0] : "",
            escapeCsv(item.productName || ""),
            item.originalRiskRating || "",
            item.adjustedRiskRating || "",
            escapeCsv(item.riskAdjustment || ""),
            item.falsePositive ? "Yes" : "No",
            escapeCsv(item.operationalRequirement || ""),
            escapeCsv(item.deviationRationale || ""),
            escapeCsv(JSON.stringify(item.supportingDocuments || [])),
            escapeCsv(item.comments || ""),
            item.autoApprove ? "Yes" : "No"
        ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
}

function escapeCsv(str: string): string {
    if (!str) return "";
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}
