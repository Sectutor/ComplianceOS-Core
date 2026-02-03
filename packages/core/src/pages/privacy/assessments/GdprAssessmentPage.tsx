
import PrivacyAssessment from "../PrivacyAssessment";
import { gdprChecklist } from "./GdprChecklist";

export default function GdprAssessmentPage() {
    return (
        <PrivacyAssessment
            title="GDPR Checklist"
            type="gdpr"
            checklist={gdprChecklist}
            mode="checklist"
        />
    );
}
