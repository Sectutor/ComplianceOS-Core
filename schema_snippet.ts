
// ==========================================
// Management Sign-off & Approvals
// ==========================================

export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);

export const approvalRequests = pgTable("approval_requests", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),

  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'risk_treatment', 'policy', 'soa', etc.
  entityId: integer("entity_id").notNull(),

  status: approvalStatusEnum("status").default("pending"),

  submitterId: integer("submitter_id"), // FK to users
  submittedAt: timestamp("submitted_at").defaultNow(),

  requiredRoles: json("required_roles").$type<string[]>(), // e.g. ["CISO", "CEO"]

  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    clientStatusIdx: index("idx_ar_client_status").on(table.clientId, table.status),
    entityIdx: index("idx_ar_entity").on(table.entityType, table.entityId),
  };
});

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = typeof approvalRequests.$inferInsert;

export const approvalSignatures = pgTable("approval_signatures", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").notNull(), // FK to approval_requests

  signerId: integer("signer_id").notNull(), // FK to users
  signerRole: varchar("signer_role", { length: 100 }).notNull(), // e.g. "CISO"

  status: varchar("status", { length: 50 }).default("signed"), // signed, rejected

  comment: text("comment"),
  signatureData: text("signature_data"), // Cryptographic hash or graphical data

  signedAt: timestamp("signed_at").defaultNow(),
}, (table) => {
  return {
    requestIdx: index("idx_as_request").on(table.requestId),
    signerIdx: index("idx_as_signer").on(table.signerId),
  };
});

export type ApprovalSignature = typeof approvalSignatures.$inferSelect;
export type InsertApprovalSignature = typeof approvalSignatures.$inferInsert;
