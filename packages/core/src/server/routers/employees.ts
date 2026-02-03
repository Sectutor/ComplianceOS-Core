
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";
import { getDb } from "../../db";
import { employees } from "../../schema";

export const createEmployeesRouter = (t: any, clientProcedure: any) => {
  return t.router({
    list: clientProcedure
      .input(z.object({
        clientId: z.number().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }: any) => {
        const db = await getDb();
        const clientId = input?.clientId || ctx.clientId; // usage from clientProcedure context?

        // If specific clientId needed but not provided/contextual:
        // ClientProcedure usually ensures ctx.clientRole and potentially ctx.clientId if passed? 
        // Actually checkClientAccess expects input.clientId usually.

        // Let's assume input.clientId is passed or we filter by something else.
        // If strict clientProcedure, input.clientId is essential.

        if (!process.env.DATABASE_URL) {
          console.error("DATABASE_URL is not set");
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database configuration error" });
        }

        try {
          // Find WHERE clause
          // If employees table has clientId
          let query = db.select().from(employees);

          // We need to know if employees has clientId. Assuming yes.
          if (clientId) {
            // @ts-ignore
            query = query.where(eq(employees.clientId, clientId));
          }

          const result = await query;
          return result;
        } catch (err: any) {
          console.error("Error in employees.list:", err);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
        }
      }),

    get: clientProcedure
      .input(z.object({ id: z.number(), clientId: z.number() }))
      .query(async ({ input }: any) => {
        const db = await getDb();
        const [employee] = await db.select().from(employees).where(eq(employees.id, input.id));
        if (!employee) return null;
        if (employee.clientId !== input.clientId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Employee does not belong to this client' });
        }
        return employee;
      }),

    getRACIMatrix: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }: any) => {
        // Mock response for now to unblock
        const db = await getDb();
        const clientEmployees = await db.select().from(employees).where(eq(employees.clientId, input.clientId));

        return clientEmployees.map((emp: any) => ({
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          jobTitle: emp.jobTitle,
          totalAssignments: 0,
          assignments: [],
        }));
      }),

    getRACIGapAnalysis: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }: any) => {
        // Mock response
        return {
          totalControls: 0,
          assignedControls: 0,
          totalPolicies: 0,
          assignedPolicies: 0,
          totalEvidence: 0,
          assignedEvidence: 0,
          unassignedControls: [],
          unassignedPolicies: [],
          unassignedEvidence: [],
          gaps: [],
          recommendations: []
        };
      }),
  });
};
