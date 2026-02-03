
// NIST AI Risk Management Framework (AI RMF 1.0)
// Full set of 73 subcategories across the 4 core functions: GOVERN, MAP, MEASURE, MANAGE
// Official NIST AI RMF 1.0 (January 2023)

export const nistAiRmfControls = [
    // ==========================================
    // 1. GOVERN (GOV)
    // ==========================================
    { id: "GOV 1.1", name: "Legal & Regulatory Requirements", description: "Legal and regulatory requirements and AI risk management-related roles and responsibilities are clearly defined, communicated, and understood across the organization.", category: "GOVERN" },
    { id: "GOV 1.2", name: "Risk Management Strategy", description: "The organization’s AI risk management strategy and appetite are documented and shared.", category: "GOVERN" },
    { id: "GOV 1.3", name: "Risk Prioritization Process", description: "Processes are in place to prioritize AI risks and responses based on the organization's mission and the risk to individuals or groups.", category: "GOVERN" },
    { id: "GOV 1.4", name: "Roles & Responsibilities", description: "Personnel roles and responsibilities for AI risk management are established and documented throughout the AI system lifecycle.", category: "GOVERN" },
    { id: "GOV 1.5", name: "ERM Integration", description: "The organization’s AI risk management policies and practices are integrated into existing enterprise risk management (ERM) policies and processes.", category: "GOVERN" },
    { id: "GOV 1.6", name: "Training & Resources", description: "Organizational teams are provided with the necessary education, training, and resources to identify and manage AI risks.", category: "GOVERN" },
    { id: "GOV 1.7", name: "Performance Reviews", description: "Compensation and performance reviews are aligned with the organization’s AI risk management objectives.", category: "GOVERN" },
    { id: "GOV 2.1", name: "Leadership Accountability", description: "Senior leadership is accountable for the organization's AI risk management activities and outcomes.", category: "GOVERN" },
    { id: "GOV 2.2", name: "Advocacy Culture", description: "AI risk management is integrated into the organization's culture through leadership advocacy.", category: "GOVERN" },
    { id: "GOV 2.3", name: "Expert Assignment", description: "AI risk management roles and responsibilities are assigned to personnel with the necessary expertise.", category: "GOVERN" },
    { id: "GOV 3.1", name: "Team Diversity", description: "Organizational teams responsible for AI risk management are diverse and inclusive.", category: "GOVERN" },
    { id: "GOV 3.2", name: "Non-Retaliation Policy", description: "Personnel are encouraged to identify and report AI risks and potential harms without fear of retaliation.", category: "GOVERN" },
    { id: "GOV 4.1", name: "Stakeholder Consultation", description: "Internal and external stakeholder consultations are conducted to identify and manage AI risks.", category: "GOVERN" },
    { id: "GOV 4.2", name: "Transparent Communication", description: "Stakeholders are informed about AI system development, deployment, and risk management.", category: "GOVERN" },
    { id: "GOV 4.3", name: "Feedback Integration", description: "Feedback from stakeholders is incorporated into AI risk management activities.", category: "GOVERN" },
    { id: "GOV 5.1", name: "Mission Alignment", description: "AI risks are assessed against the organization’s mission, values, and risk appetite.", category: "GOVERN" },
    { id: "GOV 5.2", name: "Impact Evaluation", description: "The potential impacts of AI risks on individuals, groups, the organization, and society are evaluated.", category: "GOVERN" },
    { id: "GOV 6.1", name: "Procurement Trust", description: "AI trust and risk management requirements are integrated into procurement processes and agreements with third parties.", category: "GOVERN" },
    { id: "GOV 6.2", name: "3rd Party Evaluation", description: "Third-party AI products and services are evaluated for risks and compliance with organizational policies.", category: "GOVERN" },

    // ==========================================
    // 2. MAP (MAP)
    // ==========================================
    { id: "MAP 1.1", name: "Purpose & Benefits", description: "The AI system's intended purpose and expected benefits are documented.", category: "MAP" },
    { id: "MAP 1.2", name: "Deployment Context", description: "The AI system's deployment context and potential impacts on individuals and groups are identified.", category: "MAP" },
    { id: "MAP 1.3", name: "Actor Roles", description: "The AI system's lifecycle and the roles of various actors are documented.", category: "MAP" },
    { id: "MAP 1.4", name: "Technical Constraints", description: "The AI system's technical requirements and constraints are documented.", category: "MAP" },
    { id: "MAP 1.5", name: "Organizational Values", description: "The AI system's alignment with organizational mission and values is assessed.", category: "MAP" },
    { id: "MAP 2.1", name: "Technical Capabilities", description: "The AI system's technical capabilities and limitations are documented.", category: "MAP" },
    { id: "MAP 2.2", name: "Data Requirements", description: "The AI system's data requirements and sources are documented.", category: "MAP" },
    { id: "MAP 2.3", name: "Human-AI Interaction", description: "The AI system's level of autonomy and human-AI interaction are documented.", category: "MAP" },
    { id: "MAP 2.4", name: "Risk Categorization", description: "The AI system's potential risks and impacts are categorized.", category: "MAP" },
    { id: "MAP 2.5", name: "Regular Category Review", description: "The AI system's categorization is regularly reviewed and updated.", category: "MAP" },
    { id: "MAP 3.1", name: "Performance Metrics", description: "The AI system's performance metrics and evaluation methods are documented.", category: "MAP" },
    { id: "MAP 3.2", name: "Failure Modes", description: "The AI system's potential failure modes and their impacts are identified.", category: "MAP" },
    { id: "MAP 3.3", name: "System Boundaries", description: "The AI system's limitations and boundaries are documented.", category: "MAP" },
    { id: "MAP 3.4", name: "Sensitivity Analysis", description: "The AI system's sensitivity to input changes and noise is assessed.", category: "MAP" },
    { id: "MAP 3.5", name: "Explainability Needs", description: "The AI system's explainability and interpretability are assessed.", category: "MAP" },
    { id: "MAP 4.1", name: "Societal Risks", description: "Potential risks to individuals, groups, the organization, and society are identified.", category: "MAP" },
    { id: "MAP 4.2", name: "Bias & Fairness", description: "Potential risks related to bias, fairness, and discrimination are identified.", category: "MAP" },
    { id: "MAP 4.3", name: "Security & Robustness", description: "Potential risks related to safety, security, and robustness are identified.", category: "MAP" },
    { id: "MAP 4.4", name: "Privacy Protection", description: "Potential risks related to privacy and data protection are identified.", category: "MAP" },
    { id: "MAP 4.5", name: "Transparency Gaps", description: "Potential risks related to transparency and accountability are identified.", category: "MAP" },
    { id: "MAP 5.1", name: "External Components", description: "Risks and impacts from external data, tools, and libraries are identified.", category: "MAP" },
    { id: "MAP 5.2", name: "External Services", description: "Risks and impacts from external AI models and services are identified.", category: "MAP" },

    // ==========================================
    // 3. MEASURE (MEAS)
    // ==========================================
    { id: "MEAS 1.1", name: "Technical Performance", description: "Methods and metrics for measuring technical performance and robustness are identified and applied.", category: "MEASURE" },
    { id: "MEAS 1.2", name: "Fairness Metrics", description: "Methods and metrics for measuring bias, fairness, and discrimination are identified and applied.", category: "MEASURE" },
    { id: "MEAS 1.3", name: "Trustworthy Metrics", description: "Methods and metrics for measuring other trustworthy characteristics (e.g., privacy, safety) are identified and applied.", category: "MEASURE" },
    { id: "MEAS 2.1", name: "TEVV Performance", description: "Test, evaluation, verification, and validation (TEVV) are performed against metrics.", category: "MEASURE" },
    { id: "MEAS 2.2", name: "Bias Evaluation", description: "The AI system is evaluated for bias and fairness using appropriate methods.", category: "MEASURE" },
    { id: "MEAS 2.3", name: "Security Evaluation", description: "The AI system is evaluated for security and resilience against adversarial attacks.", category: "MEASURE" },
    { id: "MEAS 2.4", name: "Safety Evaluation", description: "The AI system is evaluated for safety and potential physical or psychological harms.", category: "MEASURE" },
    { id: "MEAS 2.5", name: "Robustness Evaluation", description: "The AI system's robustness is evaluated across various environmental conditions.", category: "MEASURE" },
    { id: "MEAS 2.6", name: "Explainability Check", description: "Evaluation of the AI system's explainability and interpretability.", category: "MEASURE" },
    { id: "MEAS 2.7", name: "Privacy Evaluation", description: "The AI system's privacy and data protection measures are evaluated.", category: "MEASURE" },
    { id: "MEAS 2.8", name: "Performance Drift", description: "The AI system's technical performance is monitored for drift and degradation.", category: "MEASURE" },
    { id: "MEAS 2.9", name: "Interaction Design", description: "Evaluation of human-AI interaction, including usability and fatigue.", category: "MEASURE" },
    { id: "MEAS 2.10", name: "Environmental Impact", description: "Evaluation of the AI system's environmental impact (e.g., energy consumption).", category: "MEASURE" },
    { id: "MEAS 2.11", name: "3rd Party Results", description: "Evaluation results of third-party AI components are used and interpreted.", category: "MEASURE" },
    { id: "MEAS 3.1", name: "Effectiveness Tracking", description: "The effectiveness of AI risk management activities is measured.", category: "MEASURE" },
    { id: "MEAS 3.2", name: "Documentation", description: "Results of AI risk assessments and evaluations are systematically documented.", category: "MEASURE" },
    { id: "MEAS 3.3", name: "Reporting Quality", description: "Measurement results are reported in a timely, accurate, and actionable manner.", category: "MEASURE" },
    { id: "MEAS 4.1", name: "Decision Prioritization", description: "Measurement results are used to prioritize AI risks and responses.", category: "MEASURE" },
    { id: "MEAS 4.2", name: "Deployment Decisions", description: "Measurement results inform decisions about whether to develop, deploy, or retire a system.", category: "MEASURE" },
    { id: "MEAS 4.3", name: "Policy Updates", description: "Measurement results are used to improve AI risk management policies and practices.", category: "MEASURE" },

    // ==========================================
    // 4. MANAGE (MAN)
    // ==========================================
    { id: "MAN 1.1", name: "Risk Prioritization", description: "AI risks are prioritized based on their potential impact and likelihood.", category: "MANAGE" },
    { id: "MAN 1.2", name: "Response Strategies", description: "AI risk response strategies (avoid, mitigate, transfer, accept) are selected.", category: "MANAGE" },
    { id: "MAN 1.3", name: "Mitigation Implementation", description: "AI risk mitigation plans are developed, documented, and implemented.", category: "MANAGE" },
    { id: "MAN 2.1", name: "Design Management", description: "AI risks are managed throughout the design and development phases.", category: "MANAGE" },
    { id: "MAN 2.2", name: "Testing Management", description: "AI risks are managed during the testing and evaluation phases.", category: "MANAGE" },
    { id: "MAN 2.3", name: "Monitoring Management", description: "AI risks are managed during the deployment and monitoring phases.", category: "MANAGE" },
    { id: "MAN 2.4", name: "Retirement Management", description: "AI risks are managed during the retirement and decommissioning phases.", category: "MANAGE" },
    { id: "MAN 3.1", name: "Lifecycle Integration", description: "AI risk management is integrated into the software development lifecycle (SDLC).", category: "MANAGE" },
    { id: "MAN 3.2", name: "Process Integration", description: "AI risk management is integrated into existing organizational risk management processes.", category: "MANAGE" },
    { id: "MAN 4.1", name: "Effectiveness Review", description: "AI risk management activities are regularly reviewed for effectiveness.", category: "MANAGE" },
    { id: "MAN 4.2", name: "Emerging Risk Update", description: "AI risk management policies are updated based on lessons learned and emerging risks.", category: "MANAGE" },
    { id: "MAN 4.3", name: "Continuous Learning", description: "Organizational learning from AI risk management activities is promoted.", category: "MANAGE" },
];

export default nistAiRmfControls;
