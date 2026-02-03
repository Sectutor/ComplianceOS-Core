
export const gdprChecklist = [
    {
        id: "governance",
        category: "A. Governance & Accountability",
        description: "Art. 5(2), 24, 25",
        questions: [
            { id: "dpo_appoint", text: "Appointed a Data Protection Officer (DPO) if mandatory (public body, large-scale systematic monitoring, or large-scale special data processing). Document appointment, independence, contact published." },
            { id: "accountability_lead", text: "Designated an internal GDPR accountability lead / privacy champion (even if no DPO required)." },
            { id: "privacy_by_design", text: "Implemented data protection by design & by default (Art. 25). Privacy considerations in new projects/products from the start (evidence: privacy reviews in product roadmap)." },
            { id: "staff_training", text: "Conducted staff GDPR awareness training (initial + annual refreshers). Training logs, attendance records, test results." },
            { id: "policy_suite", text: "Created and maintain an internal GDPR policy suite (data protection policy, retention policy, breach response plan, etc.)." }
        ]
    },
    {
        id: "data_mapping",
        category: "B. Data Mapping & Records",
        description: "Art. 30 – Records of Processing Activities / ROPA",
        questions: [
            { id: "data_inventory", text: "Completed a full data inventory / mapping exercise. All personal data flows documented." },
            { id: "ropa_maintain", text: "Maintained up-to-date Records of Processing Activities (ROPA) including purposes, categories, recipients, transfers, retention, security." },
            { id: "ropa_review", text: "ROPA is version-controlled, reviewed at least annually or on material change." }
        ]
    },
    {
        id: "lawful_basis",
        category: "C. Lawful Basis, Transparency & Consent",
        description: "Art. 6, 7, 12–14",
        questions: [
            { id: "lawful_basis_doc", text: "Documented a lawful basis for every processing activity (consent, contract, legal obligation, vital interests, public task, legitimate interests)." },
            { id: "lia", text: "For legitimate interests: Completed and documented Legitimate Interests Assessment (LIA) / balancing test." },
            { id: "consent_mgmt", text: "For consent: Implemented granular, freely given, specific, informed, unambiguous consent (no pre-ticked boxes, easy withdrawal)." },
            { id: "privacy_notice", text: "Published a clear, accessible Privacy Notice / Policy (Art. 13/14 compliant). Updated version history, layered format if complex." },
            { id: "collection_info", text: "Implemented processes to provide information at collection (Art. 13) and for indirect collection (Art. 14)." }
        ]
    },
    {
        id: "rights_mgmt",
        category: "D. Data Subject Rights Management",
        description: "Art. 12, 15–22",
        questions: [
            { id: "dsar_process", text: "Established a Data Subject Access Request (DSAR / Rights Request) process. Handle access, rectification, erasure, restriction, portability, objection within 1 month." },
            { id: "dsar_logs", text: "Maintained logs of all DSARs received + responses (time taken, outcome)." },
            { id: "rights_tech_caps", text: "Built technical capabilities to fulfill rights (e.g., export data in structured format, delete from all backups/systems)." }
        ]
    },
    {
        id: "dpia",
        category: "E. Data Protection Impact Assessments (DPIA)",
        description: "Art. 35",
        questions: [
            { id: "dpia_screen", text: "Screened processing activities for DPIA necessity (high-risk: large-scale sensitive data, systematic monitoring, profiling with legal effects, etc.)." },
            { id: "dpia_conduct", text: "Conducted DPIAs for all required/high-risk activities. Document risks, mitigations, residual risk, approvals." },
            { id: "dpia_review", text: "Reviewed DPIAs on significant changes or at least every 3 years." }
        ]
    },
    {
        id: "security",
        category: "F. Security & Breach Response",
        description: "Art. 32, 33–34",
        questions: [
            { id: "security_measures", text: "Implemented appropriate technical & organisational security measures (Art. 32). Encryption, access controls, pseudonymisation, regular testing." },
            { id: "security_doc", text: "Documented your security measures (in ROPA or separate security statement)." },
            { id: "breach_plan", text: "Established a personal data breach response plan. Detection, escalation, assessment, 72-hour notification, communication." },
            { id: "breach_register", text: "Maintained a breach register (all incidents, even non-reportable)." }
        ]
    },
    {
        id: "processors",
        category: "G. Processor & Sub-processor Management",
        description: "Art. 28",
        questions: [
            { id: "dpa_signed", text: "(Controllers) Signed Data Processing Agreements (DPAs) with all processors. Mandatory Art. 28(3) clauses included." },
            { id: "sub_processor_list", text: "(Processors) Signed back-to-back DPAs with all sub-processors and maintained up-to-date inventory." },
            { id: "processor_auth", text: "Established sub-processor authorisation workflow (prior authorisation + advance notice + objection right)." }
        ]
    },
    {
        id: "transfers",
        category: "H. International Data Transfers",
        description: "Chapter V, Art. 44–50",
        questions: [
            { id: "transfer_map", text: "Mapped all international transfers outside EEA." },
            { id: "safeguards", text: "For non-adequate countries: Implemented appropriate safeguards (e.g., 2021 SCCs, EU-US Data Privacy Framework)." },
            { id: "tias", text: "Conducted & documented Transfer Impact Assessments (TIAs) for each Art. 46 transfer tool." },
            { id: "adequacy", text: "Documented reliance on adequacy decisions where applicable (e.g., UK, Japan, Canada)." }
        ]
    },
    {
        id: "monitoring",
        category: "I. Ongoing Monitoring & Review",
        description: "",
        questions: [
            { id: "periodic_reviews", text: "Set up periodic compliance reviews (at least annually). Internal audit or gap analysis." },
            { id: "change_mgmt", text: "Established change management process for GDPR-impacting changes (new vendors, new processing, law updates)." },
            { id: "audit_pack", text: "Prepared audit readiness package. Central folder with key docs (ROPA, DPAs, TIAs, DPIAs, training logs, breach register)." },
            { id: "reg_updates", text: "Monitored supervisory authority updates / EDPB guidelines." }
        ]
    }
];
