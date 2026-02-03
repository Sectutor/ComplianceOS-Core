/**
 * Defined Slot Names
 * Use these constants instead of strings to ensure type safety and discoverability.
 */

export const SlotNames = {
    // Audit Hub
    AUDIT_HEADER_ACTIONS: 'audit-header-actions',
    EVIDENCE_TOOLBAR_ACTIONS: 'evidence-toolbar-actions',
    SIDEBAR_NAV_ITEMS: 'sidebar-nav-items',
    
    // Global
    LOGO: 'global-logo',
    USER_MENU_ITEMS: 'user-menu-items',
    
    // Dashboard
    DASHBOARD_WIDGETS: 'dashboard-widgets',

    // Controls
    CONTROL_HEADER_ACTIONS: 'control-header-actions',
    CONTROL_EDIT_ACTIONS: 'control-edit-actions',

    // Policy
    POLICY_RISK_SUGGESTION: 'policy-risk-suggestion',
    POLICY_CONTROL_SUGGESTION: 'policy-control-suggestion',

    // Risk
    RISK_CONTROL_SUGGESTION: 'risk-control-suggestion',
    RISK_AUTO_TRIAGE: 'risk-auto-triage',
    RISK_REPORT_AI_BUTTON: 'risk-report-ai-button',
    RISK_REPORT_GENERATE_ALL: 'risk-report-generate-all',

    // Gap Analysis
    GAP_ANALYSIS_AI_BUTTON: 'gap-analysis-ai-button',
} as const;
