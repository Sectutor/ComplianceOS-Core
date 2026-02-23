import { Regulation } from "./types";

export const lgpd: Regulation = {
    id: "lgpd",
    name: "LGPD (Lei Geral de Proteção de Dados Pessoais)",
    description: "The Lei Geral de Proteção de Dados Pessoais (LGPD) is Brazil's comprehensive data protection law, closely mirroring the European Union's GDPR. Enacted to protect the fundamental rights of freedom and privacy and the free development of the personality of the natural person, the LGPD governs how personal data—whether digital or physical—is collected, processed, stored, and shared by organizations operating in Brazil or offering services to individuals located within Brazilian territory.",
    type: "Privacy",
    logo: "/frameworks/lgpd.svg",
    articles: [
        {
            id: "lgpd-art-6",
            numericId: "Art. 6",
            title: "Core Principles of Data Processing",
            description: "Article 6 establishes the fundamental principles that must govern all personal data processing activities. These principles act as the constitutional backbone of the LGPD and include Good Faith, Purpose (processing for legitimate, specific, and explicit purposes), Adequacy (compatibility of processing with the stated purposes), Necessity (limiting processing to the minimum necessary), Free Access (guaranteeing subjects easy and free consultation of their data), Quality (ensuring data is accurate, clear, and updated), Transparency (providing clear and easily accessible information), Security (using technical and administrative measures to protect data), Prevention (adopting measures to prevent damages), and Non-discrimination (forbidding processing for unlawful or abusive discriminatory purposes). Organizations must demonstrate accountability by adopting effective measures capable of proving their compliance with these principles.",
            mappedControls: {
                "NIST 800-53": ["PT-2", "PT-5", "SA-8", "PM-1"],
                "ISO 27001": ["A.18.1.4", "A.8.2.1"]
            }
        },
        {
            id: "lgpd-art-7-11",
            numericId: "Art. 7 & 11",
            title: "Lawful Bases for Initial Data Processing",
            description: "The LGPD definitively prohibits the processing of personal data without a valid, legally defined justification. Articles 7 and 11 outline the exhaustive list of lawful bases under which standard personal data and sensitive personal data can be processed, ensuring organizations do not collect or utilize information arbitrarily.",
            subArticles: [
                {
                    id: "lgpd-art-7",
                    title: "Standard Personal Data Bases (Art. 7)",
                    description: "For standard personal data, processing is only justified under one of ten specific hypotheses. The most common include: specific and unambiguous consent from the data subject; the necessity to fulfill a legal or regulatory obligation by the controller; necessity for the execution of a contract to which the data subject is a party; regular exercise of rights in judicial, administrative, or arbitral proceedings; the protection of life or physical safety; and the legitimate interests of the controller or a third party, provided the fundamental rights of the subject do not override those interests.",
                    mappedControls: { "NIST 800-53": ["PT-2", "PT-3"] }
                },
                {
                    id: "lgpd-art-11",
                    title: "Processing Sensitive Personal Data (Art. 11)",
                    description: "Sensitive data (such as racial origin, religious beliefs, political opinions, health, or biometric data) is subject to extreme restrictions. Processing is generally limited to instances where the data subject has given specific and distinct consent. Exceptions where consent is not required are narrow, primarily covering vital legal obligations, imminent threats to life, or specific health protection scenarios conducted by health professionals. Organizations must implement strict data segregation and elevated role-based access controls for this classification of data.",
                    mappedControls: { "NIST 800-53": ["AC-3", "SC-28"], "ISO 27001": ["A.8.2.3"] }
                }
            ]
        },
        {
            id: "lgpd-art-18",
            numericId: "Art. 18",
            title: "Data Subject Privacy Rights & Control mechanisms",
            description: "Article 18 operationalizes the rights of individuals over their personal information. It mandates that controllers must provide operational mechanisms for data subjects to exercise these rights easily, transparently, and securely. Organizations must engineer their backend systems, databases, and business processes to be capable of promptly querying, retrieving, modifying, exporting, or permanently purging personal data records across all integrated platforms and third-party vendor systems upon receiving a valid authenticated request.",
            mappedControls: {
                "NIST 800-53": ["AC-3", "IA-8", "PT-5"],
                "ISO 27001": ["A.9.1.1"]
            },
            subArticles: [
                {
                    id: "lgpd-art-18-inc-1-2",
                    title: "Confirmation and Total Access Rights",
                    description: "Data subjects possess the unquestionable right to ask a controller to confirm whether their data is being currently processed. If confirmed, they have the statutory right to access that data in a clear, complete, and intelligible format within 15 days of the request. This access report must detail the specific origin of the data, the ongoing criteria used for processing, and the exact purpose of that processing."
                },
                {
                    id: "lgpd-art-18-inc-3-4",
                    title: "Correction and Total Remediation Rights",
                    description: "Subjects can demand the correction of data records that are proven incomplete, inaccurate, or critically outdated. Furthermore, they can legally mandate the irreversible anonymization, administrative blocking, or total deletion of data that is deemed legally unnecessary, excessive for the stated purpose, or processed in non-compliance with the LGPD's foundational mandates."
                },
                {
                    id: "lgpd-art-18-inc-5-6",
                    title: "Data Portability and Consent Revocation",
                    description: "The LGPD guarantees the right to data portability, empowering users to request their data be transferred directly to another service or product provider in a structured, commonly used, and machine-readable interoperable format. Additionally, subjects hold the absolute, undeniable right to revoke previously granted voluntary consent at any given time through a facilitated, unburdened, and free procedure, immediately prompting the elimination of data exclusively processed under that revoked consent."
                }
            ]
        },
        {
            id: "lgpd-art-38",
            numericId: "Art. 38",
            title: "Data Protection Impact Assessment (DPIA / RIPD)",
            description: "To proactively identify, govern, and continuously mitigate risks to individual privacy, the Brazilian National Data Protection Authority (ANPD) may decree that the organizational controller formulate a formal Data Protection Impact Assessment (Relatório de Impacto à Proteção de Dados Pessoais - RIPD). This is particularly mandated and heavily scrutinized when processing activities present a tangibly high risk to civil liberties, such as the processing of sensitive biometric data, AI-driven profiling, or large-scale operations predicated on the abstract 'legitimate interest' legal basis. The RIPD must exhaustively detail the data lifecycle, the utilized cryptographic and access-control security precautions, and the risk mitigation mechanisms practically employed.",
            mappedControls: {
                "NIST 800-53": ["RA-3", "RA-9", "PL-8"],
                "ISO 27001": ["A.18.1.4", "A.12.6.1"]
            }
        },
        {
            id: "lgpd-art-41",
            numericId: "Art. 41",
            title: "Data Protection Officer (DPO / Encarregado)",
            description: "Article 41 legally binds the organizational controller to appoint a dedicated Data Protection Officer, officially known in Brazilian terminology as the 'Encarregado'. This specialized individual or corporate entity acts as the primary communication nexus and trusted liaison bridging the controller, the data subjects, and the federal ANPD regulatory body. The DPO's identity and direct communication parameters (e.g., dedicated email, secure portal) must be continuously, publicly, and prominently disclosed—typically on the organization's primary corporate privacy webpage—in a clear and objective manner. The DPO carries the legal locus of responsibility for fielding complaints, providing privacy clarifications, orchestrating internal compliance audits, enacting corrective operational measures, and training staff on privacy-enhancing practices.",
            mappedControls: {
                "NIST 800-53": ["PS-1", "PM-2"]
            }
        },
        {
            id: "lgpd-art-46",
            numericId: "Art. 46",
            title: "Information Security and Principles of Privacy by Design",
            description: "Processing agents (both controllers and external processors) are legally and financially bound to architect and strictly enforce robust technical, administrative, and physical security protocols broadly designed to shield personal data ecosystems against unauthorized internal or external access, accidental software destruction, catastrophic data loss, systemic alteration, unsanctioned communication, or malicious public dissemination. The text of LGPD inherently demands 'Privacy by Design' and 'Privacy by Default'; this legally signifies that sophisticated privacy-preserving mechanisms (like aggressive encryption-in-transit, strict tokenization, rigorous pseudonymization, and zero-trust segmentation) must be intrinsically integrated into the foundational architecture of products, software engineering lifecycles, and operational systems from their immediate conception and persist identically throughout their entire lifecycle.",
            mappedControls: {
                "NIST 800-53": ["SC-1", "SC-7", "SI-4", "AC-2", "IA-8", "SA-8"],
                "ISO 27001": ["A.12.6.1", "A.9.2.1", "A.14.2.5"]
            }
        },
        {
            id: "lgpd-art-48",
            numericId: "Art. 48",
            title: "Mandatory Breach Notification and Rapid Incident Response",
            description: "In the event of a catastrophic security incident that potentially engenders significant risk, discrimination, or material/moral damage to data subjects (such as adversarial data exfiltration, a ransomware attack debilitating critical availability, or unauthorized mass modification of sensitive health records), the corporate controller is strictly obligated by law to communicate the occurrence to the federal ANPD authority and to the individually affected data subjects without unreasonable delay. The formal written notification must transparently include an accurate description of the nature of the compromised data, detailed metrics of the data subjects involved, the specific technical and administrative security countermeasures that were actively deployed for protection at the time of breach, the articulated risks involved to the individuals, and the tactical remediation and mitigation strategies concurrently adopted to curtail further exposure.",
            mappedControls: {
                "NIST 800-53": ["IR-6", "IR-4", "IR-8"],
                "ISO 27001": ["A.16.1.1", "A.16.1.2"]
            }
        }
    ],
    questions: [
        {
            id: "q_lgpd_scope",
            text: "Contextual Scope: Does the organization actively collect, process, index, or store the personal digital or physical data of individuals currently located within Brazilian territory, or deliberately engineer/offer goods and digital services specifically targeted at the Brazilian consumer market?",
            type: "boolean",
            relatedArticles: ["lgpd-art-6"]
        },
        {
            id: "q_lgpd_dpi_ripd",
            text: "Risk Management (RIPD): Has the organization institutionalized a formalized, board-approved procedural workflow for executing deep-dive Data Protection Impact Assessments (RIPD) prior to commencing data processing activities that present substantial risk to fundamental civil liberties, or when controversially utilizing the abstract \"legitimate interest\" defense as a legal processing basis?",
            type: "boolean",
            relatedArticles: ["lgpd-art-38"]
        },
        {
            id: "q_lgpd_dpo",
            text: "Regulatory Liaison (DPO): has executive leadership officially appointed a designated independent Data Protection Officer (Local Encarregado), and ensures their professional identity and direct, friction-less communication contact information is unequivocally and perpetually disclosed on the organization's primary digital interfaces?",
            type: "boolean",
            relatedArticles: ["lgpd-art-41"]
        },
        {
            id: "q_lgpd_rights15",
            text: "Subject Rights (SLA): Are sophisticated engineered systems (both technically automated data-query pipelines and administrative verification processes) presently operationalized to definitively evaluate, respond to, and fulfill complex data subject access, correction, data-export, and purgal requests within the unforgiving 15-day maximum statutory deadline legally mandated by the federal LGPD legislation?",
            type: "boolean",
            relatedArticles: ["lgpd-art-18"]
        },
        {
            id: "q_lgpd_incident",
            text: "Incident Command: Does the organizational security apparatus routinely maintain, exercise, and update a documented Cyber Incident Response Plan that explicitly dictates the obligatory escalation parameters, technical forensics, and legal notification timelines required to inform the Brazilian ANPD regulator and affected civilian data subjects upon the discovery of a consequential data hemorrhage?",
            type: "boolean",
            relatedArticles: ["lgpd-art-48"]
        }
    ]
};
