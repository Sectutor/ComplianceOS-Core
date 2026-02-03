import { registry } from './index';
import { SlotNames } from './slotNames';
import EvidenceAnalysisButton from '@/components/EvidenceAnalysisButton';
import SmartLinkButton from '@/components/controls/SmartLinkButton';
import GenerateGuidanceButton from '@/components/controls/GenerateGuidanceButton';
import { PolicyRiskSuggestion } from '@/components/policy/PolicyRiskSuggestion';
import { PolicyControlSuggestion } from '@/components/policy/PolicyControlSuggestion';
import { AIControlSuggestions } from '@/components/risk/AIControlSuggestions';
import { RiskAutoTriageButton } from '@/components/risk/RiskAutoTriageButton';
import { RiskReportAIButton } from '@/components/risk/RiskReportAIButton';
import { RiskReportGenerateAllButton } from '@/components/risk/RiskReportGenerateAllButton';
import { GapAnalysisAIButton } from '@/components/gap-analysis/GapAnalysisAIButton';

export function registerPremium() {
    console.log('[Registry] Registering PREMIUM AI components...');
    
    // Audit Hub
    registry.register(SlotNames.EVIDENCE_TOOLBAR_ACTIONS, EvidenceAnalysisButton);

    // Controls Page
    registry.register(SlotNames.CONTROL_HEADER_ACTIONS, SmartLinkButton);
    registry.register(SlotNames.CONTROL_EDIT_ACTIONS, GenerateGuidanceButton);

    // Policy Page
    registry.register(SlotNames.POLICY_RISK_SUGGESTION, PolicyRiskSuggestion);
    registry.register(SlotNames.POLICY_CONTROL_SUGGESTION, PolicyControlSuggestion);

    // Risk Page
    registry.register(SlotNames.RISK_CONTROL_SUGGESTION, AIControlSuggestions);
    registry.register(SlotNames.RISK_AUTO_TRIAGE, RiskAutoTriageButton);
    registry.register(SlotNames.RISK_REPORT_AI_BUTTON, RiskReportAIButton);
    registry.register(SlotNames.RISK_REPORT_GENERATE_ALL, RiskReportGenerateAllButton);

    // Gap Analysis
    registry.register(SlotNames.GAP_ANALYSIS_AI_BUTTON, GapAnalysisAIButton);
    
    console.log('[Registry] Premium AI components registered.');
}
