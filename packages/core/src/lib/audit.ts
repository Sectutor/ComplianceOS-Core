
import { getDb } from "../db";
import { auditLogs } from "../schema";

export type AuditAction = 'create' | 'update' | 'delete' | 'publish' | 'export' | 'sync' | 'restore' | 'import';
export type EntityType = 'policy' | 'control' | 'client' | 'user' | 'evidence' | 'mapping' | 'risk' | 'treatment' | 'asset' | 'threat' | 'vulnerability' | 'bcp_plan' | 'roadmap' | 'implementation_plan' | 'stakeholder' | 'dev_project' | 'threat_model';
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
            // Ip and UserAgent could be extracted if `req` was passed and running in an env that supports it
            // For now we leave them null or implement later
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Silent fail to not block main operation
    }
}
