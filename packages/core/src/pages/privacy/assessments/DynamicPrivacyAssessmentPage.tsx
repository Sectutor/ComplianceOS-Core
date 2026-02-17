
import React from "react";
import { useParams } from "wouter";
import PrivacyAssessment from "../PrivacyAssessment";
import { privacyChecklists } from "@/data/regulations/checklists";
import { getRegulation } from "@/data/regulations";

export default function DynamicPrivacyAssessmentPage({ type: propsType }: { type?: string }) {
    const params = useParams<{ type: string }>();
    const type = propsType || params.type;

    // Normalize type (e.g. "iso-27701" -> "iso27701")
    const checklistKey = type?.replace(/-/g, '');
    // Ensure privacyChecklists is imported and available. If not imported correctly in the original file, we might need to fix imports too, but assuming they are correct as per view_file.
    // The original file had: import { privacyChecklists } from "@/data/regulations/checklists";

    // Safety check for checklistKey
    const checklist = checklistKey ? (privacyChecklists[checklistKey] || []) : [];
    const regulation = getRegulation(type || "");

    if (!checklist || checklist.length === 0) {
        return <div className="p-8">Checklist for {type} not found.</div>;
    }

    return (
        <PrivacyAssessment
            title={`${regulation?.name || type?.toUpperCase()} Compliance Checklist`}
            type={type || "unknown"}
            checklist={checklist}
            mode="checklist"
        />
    );
}
