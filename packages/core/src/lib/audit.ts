
import { getDb } from "../db";
import { auditLogs } from "../schema";

export type AuditAction = 'create' | 'update' | 'delete' | 'publish' | 'export' | 'sync' | 'restore' | 'import' | 'acknowledge_compliance' | 'update_security_setup' | 'confirm_asset_receipt' | 'assign' | 'withdraw' | 'consent_created' | 'dsar_status_updated' | 'dpia_template_created';
export type EntityType = 'policy' | 'control' | 'client' | 'user' | 'evidence' | 'mapping' | 'risk' | 'treatment' | 'asset' | 'threat' | 'vulnerability' | 'bcp_plan' | 'roadmap' | 'implementation_plan' | 'stakeholder' | 'dev_project' | 'threat_model' | 'employee_acknowledgment' | 'employee_security' | 'employee_asset' | 'training_module' | 'training_assignment' | 'project' | 'task' | 'compliance_mapping' | 'consent' | 'dsar_request' | 'dpia_template' | 'data_flow';
export type Severity = 'info' | 'warning' | 'critical';

interface LogActivityParams {
    userId: number;
    clientId?: number;
    action: AuditAction;
    entityType: EntityType;
    entityId?: number;
    details?: any;
    severity?: Severity;
    req?: Request; // Optional: Pass request object to extract IP/UA if needed
}

export async function logActivity(params: LogActivityParams, tx?: any) {
    try {
        const { userId, clientId, action, entityType, entityId, details, severity } = params;
        const db = tx || await getDb();
        if (!db) {
            console.warn("Could not log activity: DB connection failed");
            return;
        }

        await db.insert(auditLogs).values({
            userId,
            clientId,
            action,
            entityType,
            entityId,
            details: details ? JSON.stringify(details) : null,
            severity: severity || 'info',
            ipAddress: params.req ? (params.req.headers.get('x-forwarded-for') || (params.req as any).socket?.remoteAddress) : null,
            userAgent: params.req ? params.req.headers.get('user-agent') : null,
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Silent fail to not block main operation
    }
}
