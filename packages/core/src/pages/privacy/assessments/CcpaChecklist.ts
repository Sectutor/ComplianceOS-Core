
export const ccpaChecklist = [
    {
        id: "notice",
        category: "Notice & Transparency",
        questions: [
            { id: "collection_notice", text: "Do you provide a 'Notice at Collection' for California residents?" },
            { id: "privacy_policy", text: "Does your privacy policy include all required CCPA/CPRA disclosures?" },
            { id: "financial_incentive", text: "If you offer financial incentives for data, do you provide proper notice and obtain opt-in?" }
        ]
    },
    {
        id: "rights",
        category: "Consumer Rights",
        questions: [
            { id: "know_delete", text: "Can you verify and fulfill requests to Know and Delete consumer data?" },
            { id: "correct", text: "Can you correct inaccurate personal information upon request (CPRA)?" },
            { id: "limit_use", text: "Do you allow consumers to limit the use of Sensitive Personal Information?" }
        ]
    },
    {
        id: "opt_out",
        category: "Do Not Sell/Share",
        questions: [
            { id: "dns_link", text: "Is there a clear 'Do Not Sell or Share My Personal Information' link on your homepage?" },
            { id: "gpc", text: "Do you honor Global Privacy Control (GPC) signals?" },
            { id: "selling", text: "Have you identified all data sharing activities that constitute 'selling' or 'sharing'?" }
        ]
    },
    {
        id: "governance",
        category: "Data Governance",
        questions: [
            { id: "retention", text: "Have you established data retention periods for each category of personal information?" },
            { id: "minimization", text: "Is data collection limited to what is reasonably necessary for the disclosed purpose?" },
            { id: "contracts", text: "Do contracts with service providers include required CCPA/CPRA language?" }
        ]
    }
];
