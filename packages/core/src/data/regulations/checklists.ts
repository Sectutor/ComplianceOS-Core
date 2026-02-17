
export const privacyChecklists: Record<string, any[]> = {
    iso27701: [
        {
            id: "pims_governance",
            category: "1. PIMS Governance",
            questions: [
                { id: "pims_scope", text: "Has the PIMS scope been defined and aligned with the ISMS?" },
                { id: "pims_role", text: "Has the organization's role as PII controller and/or PII processor been determined?" },
                { id: "pims_lead", text: "Is there a designated lead for PIMS implementation and maintenance?" }
            ]
        },
        {
            id: "pii_controller",
            category: "2. Controller Obligations",
            questions: [
                { id: "pii_lawful_basis", text: "Are lawful bases for processing PII identified and documented?" },
                { id: "pii_privacy_notice", text: "Are privacy notices provided to PII principals at the time of collection?" },
                { id: "pii_consent", text: "Is a mechanism for obtaining and renewing PII principal consent in place?" }
            ]
        },
        {
            id: "pii_processor",
            category: "3. Processor Obligations",
            questions: [
                { id: "pii_instr_compliance", text: "Are processes in place to ensure PII is processed only on documented instructions?" },
                { id: "pii_subprocessor", text: "Are sub-processor agreements meeting privacy requirements?" }
            ]
        }
    ],
    gdpr: [
        {
            id: "gdpr_principles",
            category: "1. Principles (Art. 5)",
            questions: [
                { id: "gdpr_lawful_fair", text: "Lawfulness, fairness and transparency: processed lawfully, fairly and in a transparent manner?" },
                { id: "gdpr_purpose_limit", text: "Purpose limitation: collected for specified, explicit and legitimate purposes?" },
                { id: "gdpr_data_min", text: "Data minimization: adequate, relevant and limited to what is necessary?" },
                { id: "gdpr_accuracy", text: "Accuracy: accurate and, where necessary, kept up to date?" },
                { id: "gdpr_storage_limit", text: "Storage limitation: kept in a form which permits identification for no longer than is necessary?" },
                { id: "gdpr_integrity", text: "Integrity and confidentiality: processed in a manner that ensures appropriate security?" },
                { id: "gdpr_accountability", text: "Accountability: is the controller able to demonstrate compliance with the above?" }
            ]
        },
        {
            id: "gdpr_rights",
            category: "2. Data Subject Rights (Art. 12-23)",
            questions: [
                { id: "gdpr_right_info", text: "Right to be informed provided?" },
                { id: "gdpr_right_access", text: "Right of access procedures in place?" },
                { id: "gdpr_right_rectification", text: "Right to rectification procedures in place?" },
                { id: "gdpr_right_erasure", text: "Right to erasure ('right to be forgotten') procedures in place?" },
                { id: "gdpr_right_restrict", text: "Right to restriction of processing procedures in place?" },
                { id: "gdpr_right_portability", text: "Right to data portability procedures in place?" },
                { id: "gdpr_right_object", text: "Right to object procedures in place?" }
            ]
        }
    ],
    ccpa: [
        {
            id: "ccpa_rights",
            category: "1. Consumer Rights",
            questions: [
                { id: "ccpa_right_know", text: "System to handle 'Right to Know' requests (what PI is collected)?" },
                { id: "ccpa_right_delete", text: "System to handle 'Right to Delete' requests?" },
                { id: "ccpa_right_optout", text: "Mechanism for 'Do Not Sell or Share My Personal Information'?" },
                { id: "ccpa_gpc_support", text: "Does the system automatically recognize Global Privacy Control (GPC) signals?" }
            ]
        },
        {
            id: "ccpa_privacy_notice",
            category: "2. Transparency",
            questions: [
                { id: "ccpa_homepage_link", text: "Is there a conspicuous link on the homepage for opt-out?" },
                { id: "ccpa_sensitive_pi", text: "Disclosure of categories of Sensitive Personal Information (SPI)?" }
            ]
        }
    ],
    hipaa: [
        {
            id: "hipaa_admin",
            category: "1. Administrative Safeguards",
            questions: [
                { id: "hipaa_risk_analysis", text: "Have you conducted an accurate and thorough assessment of potential risks to ePHI?" },
                { id: "hipaa_baa", text: "Are Business Associate Agreements (BAAs) in place for all relevant vendors?" }
            ]
        },
        {
            id: "hipaa_technical",
            category: "2. Technical Safeguards",
            questions: [
                { id: "hipaa_access_ctrl", text: "Are access controls implemented to allow only authorized persons to access ePHI?" },
                { id: "hipaa_audit_ctrl", text: "Are mechanisms in place to record and examine activity in systems containing ePHI?" }
            ]
        }
    ],
    pipeda: [
        {
            id: "pipeda_principles",
            category: "1. Fair Information Principles",
            questions: [
                { id: "pipeda_accountability", text: "Has an individual been designated to be accountable for compliance?" },
                { id: "pipeda_identifying_purpose", text: "Are the purposes for which personal information is collected identified at or before collection?" },
                { id: "pipeda_consent", text: "Is the knowledge and consent of the individual required for the collection, use, or disclosure of personal information?" }
            ]
        }
    ],
    lgpd: [
        {
            id: "lgpd_foundations",
            category: "1. LGPD Principles",
            questions: [
                { id: "lgpd_purpose", text: "Processing must be done for legitimate, specific, explicit purposes." },
                { id: "lgpd_necessity", text: "Processing must be limited to the minimum necessary for the purpose." },
                { id: "lgpd_dpo", text: "Has a Data Protection Officer (Encarregado) been appointed?" }
            ]
        }
    ],
    coppa: [
        {
            id: "coppa_compliance",
            category: "1. Children's Privacy",
            questions: [
                { id: "coppa_verifiable_consent", text: "Do you obtain verifiable parental consent before collecting personal info from children under 13?" },
                { id: "coppa_notice", text: "Do you provide a clear and comprehensive online privacy policy describing your practices for children's UI?" }
            ]
        }
    ],
    glba: [
        {
            id: "glba_compliance",
            category: "1. Financial Privacy",
            questions: [
                { id: "glba_safeguards_rule", text: "Have you developed, implemented, and maintained a comprehensive information security program?" },
                { id: "glba_privacy_rule", text: "Do you provide customers with a clear and conspicuous notice of your privacy policies?" }
            ]
        }
    ],
    uk_gdpr: [
        {
            id: "uk_gdpr_transfers",
            category: "1. UK-Specific Transfers",
            questions: [
                { id: "uk_gdpr_idta", text: "Do you use the UK International Data Transfer Agreement (IDTA) for transfers out of the UK?" },
                { id: "uk_rep", text: "If based outside the UK, do you have a UK representative designated?" }
            ]
        }
    ],
    iso29100: [
        {
            id: "iso29100_framework",
            category: "1. Privacy Framework",
            questions: [
                { id: "iso29100_principles", text: "Have you implemented the 11 privacy principles of ISO/IEC 29100?" },
                { id: "iso29100_purpose", text: "Are PII processing purposes clearly defined and communicated?" }
            ]
        }
    ],
    vcdpa: [
        {
            id: "vcdpa_rights",
            category: "1. Consumer Rights",
            questions: [
                { id: "vcdpa_access", text: "Can consumers confirm if you are processing their personal data?" },
                { id: "vcdpa_optout", text: "Is there a mechanism to opt out of targeted advertising or sale of data?" }
            ]
        }
    ],
    cpa: [
        {
            id: "cpa_requirements",
            category: "1. Colorado-Specific Obligations",
            questions: [
                { id: "cpa_uoop", text: "Do you support Universal Opt-Out signals?" },
                { id: "cpa_dpia", text: "Have you performed Data Protection Assessments for high-risk activities?" }
            ]
        }
    ],
    ctdpa: [
        {
            id: "ctdpa_rights",
            category: "1. Connecticut Obligations",
            questions: [
                { id: "ctdpa_sensitive", text: "Do you obtain affirmative consent before processing sensitive data?" },
                { id: "ctdpa_contracts", text: "Are controller-processor contracts updated for CTDPA requirements?" }
            ]
        }
    ],
    ucpa: [
        {
            id: "ucpa_rights",
            category: "1. Utah Obligations",
            questions: [
                { id: "ucpa_notice", text: "Is the privacy notice clear about the categories of personal data processed?" },
                { id: "ucpa_sale", text: "Can consumers opt out of the sale of their personal data?" }
            ]
        }
    ],
    appi: [
        {
            id: "appi_japan",
            category: "1. Japan APPI",
            questions: [
                { id: "appi_purpose", text: "Are you specifying the purpose of use as much as possible?" },
                { id: "appi_third_party", text: "Do you obtain consent before provision to third parties (with exceptions)?" }
            ]
        }
    ],
    "australia-privacy": [
        {
            id: "australia_app",
            category: "1. Australian Privacy Principles",
            questions: [
                { id: "au_app_1", text: "Have you implemented APP 1 (Open and transparent management)?" },
                { id: "au_app_8", text: "Have you ensured cross-border disclosure compliance (APP 8)?" }
            ]
        }
    ],
    technical: [
        {
            id: "technical_standards",
            category: "1. Engineering Standards",
            questions: [
                { id: "tech_gpc", text: "Is the Global Privacy Control (GPC) signal implemented across all web properties?" },
                { id: "tech_tcf", text: "If using adtech, is IAB TCF v2.2 correctly implemented?" }
            ]
        }
    ]
};
