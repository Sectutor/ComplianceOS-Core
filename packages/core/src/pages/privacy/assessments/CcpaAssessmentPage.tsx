
import PrivacyAssessment from "../PrivacyAssessment";
import { ccpaChecklist } from "./CcpaChecklist";

export default function CcpaAssessmentPage() {
    return (
        <PrivacyAssessment
            title="CCPA/CPRA Checklist"
            type="ccpa"
            checklist={ccpaChecklist}
        />
    );
}
