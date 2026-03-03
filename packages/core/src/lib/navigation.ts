import { Shield, FileText, BookOpen, Sparkles, Link, ClipboardCheck, AlertTriangle, Code, Activity, Compass, Flag, Brain, Building2, Users, FileBarChart, Calendar, Bell, Settings, ListTodo, MessageSquare, History, GraduationCap, Palette, ClipboardList, ShieldCheck } from "lucide-react";

export const clientSpecificMenuItems = [
    { icon: Shield, label: "Controls", path: "/client-controls" },
    { icon: ClipboardList, label: "Requirements", path: "/compliance-requirements" },
    { icon: FileText, label: "Policies", path: "/client-policies" },
    { icon: BookOpen, label: "Knowledge Base", path: "/knowledge-base" },
    { icon: Link, label: "Mappings", path: "/mappings" },

    { icon: ClipboardCheck, label: "Evidence", path: "/evidence" },
    { icon: AlertTriangle, label: "Risk Management", path: "/risks" },
    { icon: Code, label: "Threat Modeling", path: "/dev/projects", isPremium: true },
    { icon: Activity, label: "Gap Analysis", path: "/gap-analysis" },
    { icon: ShieldCheck, label: "Audit Manager", path: "/audit-manager" },
    { icon: Compass, label: "Compliance Journey", path: "/journey" },
    { icon: Flag, label: "Discovery Wizard", path: "/readiness/wizard" },
    { icon: Brain, label: "AI Governance", path: "/ai-governance", isPremium: true },

    {
        icon: Building2, label: "Federal Hub", path: "/federal", submenu: [
            { label: "FIPS 199 Categorization", path: "/federal/fips-199" },
            { label: "SSP (NIST 800-171)", path: "/federal/ssp-171" },
            { label: "SSP (NIST 800-172)", path: "/federal/ssp-172" },
            { label: "SAR Report", path: "/federal/sar" },
            { label: "POA&M (NIST 171)", path: "/federal/poam" },
        ]
    },
    { icon: Users, label: "People", path: "/people" },
    { icon: FileBarChart, label: "RACI Matrix", path: "/raci-matrix" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: FileBarChart, label: "Reports", path: "/reports" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: ListTodo, label: "Tasks", path: "/tasks" },
    { icon: MessageSquare, label: "Communication", path: "/communication" },
    { icon: History, label: "Activity Log", path: "/activity" },
    { icon: GraduationCap, label: "Personnel Compliance", path: "/personnel-compliance" },
    { icon: Palette, label: "White-Label Branding", path: "/settings?tab=branding" },
];

export function resolveNavigationPath(itemPath: string, clientId: number | null): string {
    if (!clientId) return itemPath;

    const [purePath, query] = itemPath.split('?');
    const queryStr = query ? `?${query}` : '';

    // Public questionnaire routes (vendor response tokens) should not be rewritten
    if (purePath.startsWith('/questionnaire/')) return itemPath;

    if (purePath === "/governance") return `/clients/${clientId}/governance${queryStr}`;
    if (purePath === "/governance/workbench") return `/clients/${clientId}/governance/workbench${queryStr}`;
    if (purePath === "/compliance") return `/clients/${clientId}/compliance${queryStr}`;
    if (purePath === "/client-dashboard") return `/clients/${clientId}?tab=dashboard${query ? '&' + query : ''}`;
    if (purePath === "/client-controls") return `/clients/${clientId}/controls${queryStr}`;
    if (purePath === "/compliance-requirements") return `/compliance-requirements${queryStr}`;
    if (purePath === "/client-policies") return `/clients/${clientId}/policies${queryStr}`;
    if (purePath === "/audit-readiness") return `/clients/${clientId}/audit-readiness${queryStr}`;
    if (purePath === "/readiness/wizard") return `/clients/${clientId}/readiness/wizard${queryStr}`;
    if (purePath === "/intake") return `/clients/${clientId}/intake${queryStr}`;
    if (purePath === "/board-summary") return `/clients/${clientId}/board-summary${queryStr}`;
    if (purePath === "/communication") return `/clients/${clientId}/communication${queryStr}`;
    if (purePath === "/ai-governance") return `/clients/${clientId}/ai-governance${queryStr}`;
    if (purePath === "/activity") return `/clients/${clientId}/activity${queryStr}`;
    if (purePath === "/readiness/roadmap") return `/clients/${clientId}/roadmap/dashboard${queryStr}`;
    if (purePath === "/roadmap") return `/clients/${clientId}/roadmap/dashboard${queryStr}`;
    if (purePath === "/implementation") return `/clients/${clientId}/implementation${queryStr}`;
    if (purePath === "/implementation/dashboard") return `/clients/${clientId}/implementation${queryStr}`;
    if (purePath === "/evidence") return `/clients/${clientId}/evidence${queryStr}`;
    if (purePath === "/journey") return `/clients/${clientId}/journey${queryStr}`;
    if (purePath === "/onboarding") return `/onboarding${queryStr}`;
    if (purePath === "/gap-analysis") return `/clients/${clientId}/gap-analysis${queryStr}`;
    if (purePath === "/training/management") return `/clients/${clientId}/training/management${queryStr}`;
    if (purePath === "/personnel-compliance") return `/clients/${clientId}/personnel-compliance${queryStr}`;
    if (purePath === "/audit-hub") return `/clients/${clientId}/audit-hub${queryStr}`;
    if (purePath === "/audit-manager") return `/clients/${clientId}/audit-manager${queryStr}`;
    if (purePath === "/reports") return `/clients/${clientId}/reports${queryStr}`;
    if (purePath === "/trust-center") return `/trust-center/${clientId}${queryStr}`;
    if (purePath === "/projects") return `/clients/${clientId}/projects${queryStr}`;
    if (purePath === "/marketplace") return `/clients/${clientId}/marketplace${queryStr}`;
    if (purePath === "/essential-eight") return `/clients/${clientId}/essential-eight${queryStr}`;
    if (purePath === "/nist-csf-2") return `/clients/${clientId}/nist-csf-2${queryStr}`;
    if (purePath === "/cisa-ztmm-2") return `/clients/${clientId}/cisa-ztmm-2${queryStr}`;
    if (purePath === "/cmmc-2") return `/clients/${clientId}/cmmc-2${queryStr}`;
    if (purePath === "/c2m2-2.1") return `/clients/${clientId}/c2m2-2.1${queryStr}`;
    if (purePath === "/settings") return `/clients/${clientId}/settings${queryStr}`;
    if (purePath === "/compliance-obligations") return `/clients/${clientId}/compliance-obligations${queryStr}`;
    if (purePath === "/frameworks") return `/frameworks${queryStr}`;
    if (purePath === "/questionnaires") return `/clients/${clientId}/questionnaires${queryStr}`;

    const isClientSubRoute = clientSpecificMenuItems.some(cItem => cItem.path === purePath) ||
        purePath.startsWith('/risks') ||
        purePath.startsWith('/vendors') ||
        purePath.startsWith('/business-continuity') ||
        purePath.startsWith('/federal') ||
        purePath.startsWith('/nist') ||
        purePath.startsWith('/privacy') ||
        purePath.startsWith('/workflows') ||
        purePath.startsWith('/cyber') ||
        purePath.startsWith('/ai-governance') ||
        purePath.startsWith('/iso27001') ||
        purePath.startsWith('/roadmap') ||
        purePath.startsWith('/readiness') ||
        purePath.startsWith('/compliance-journey') ||
        purePath.startsWith('/assurance') ||
        purePath.startsWith('/implementation') ||
        purePath === '/asvs' ||
        purePath === '/samm' ||
        purePath === '/nist-csf-2' ||
        purePath === '/cisa-ztmm-2' ||
        purePath === '/cmmc-2' ||
        purePath === '/metrics';

    if (isClientSubRoute) {
        return `/clients/${clientId}${purePath}${queryStr}`;
    }

    return itemPath;
}
