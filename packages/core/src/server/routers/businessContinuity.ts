import { z } from "zod";
import * as db from "../../db";
import * as schema from "../../schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { router, publicProcedure, clientProcedure } from "../trpc";

export const businessContinuitySubRouter = router({


    getDashboardMetrics: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
        const dbConn = await db.getDb();

        // 1. BIA Stats
        const bias = await dbConn.select().from(schema.businessImpactAnalyses).where(eq(schema.businessImpactAnalyses.clientId, input.clientId));
        const completedBias = bias.filter((b: any) => b.status === 'completed' || b.status === 'approved').length;

        // 2. Plan Stats
        const plans = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.clientId, input.clientId));
        const approvedPlans = plans.filter((p: any) => p.status === 'approved').length;
        const testedPlans = plans.filter((p: any) => p.lastTestedDate).length; // Assuming we will populate this field or derive it from exercises

        // 3. Strategy Stats
        const strategies = await dbConn.select().from(schema.bcStrategies).where(eq(schema.bcStrategies.clientId, input.clientId));

        // 4. Exercise Stats (Global)
        // We need to join plans -> exercises
        const exercises = await dbConn.select({
            id: schema.planExercises.id,
            status: schema.planExercises.status
        })
            .from(schema.planExercises)
            .innerJoin(schema.bcPlans, eq(schema.planExercises.planId, schema.bcPlans.id))
            .where(eq(schema.bcPlans.clientId, input.clientId));

        const completedExercises = exercises.filter((e: any) => e.status === 'Completed').length;

        // 5. READINESS SCORE CALCULATION (Multi-factor)
        /* 
           Heuristic:
           - 30% BIA Coverage: (Completed BIAs / Total Processes)
           - 40% Plan Coverage: (Approved Plans / Total Processes) 
           - 30% Testing Maturity: (Tests Completed / Total Plans) 
        */
        const processes = await dbConn.select().from(schema.businessProcesses).where(eq(schema.businessProcesses.clientId, input.clientId));
        const totalProcesses = Math.max(processes.length, 1);
        const totalPlansCount = Math.max(plans.length, 1);

        const biaScore = (completedBias / totalProcesses) * 30;
        const planScore = (approvedPlans / totalProcesses) * 40;
        const testScore = (completedExercises > 0) ? (Math.min(completedExercises / totalPlansCount, 1) * 30) : 0;

        const readinessScore = Math.round(biaScore + planScore + testScore);

        return {
            totalBIAs: bias.length,
            completedBIAs: completedBias,
            totalPlans: plans.length,
            approvedPlans: approvedPlans,
            testedPlans: testedPlans,
            totalStrategies: strategies.length,
            totalExercises: exercises.length,
            completedExercises: completedExercises,
            readinessScore: Math.min(readinessScore, 100)
        };
    }),



    getProgram: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
        const dbConn = await db.getDb();
        const [program] = await dbConn.select().from(schema.bcPrograms).where(eq(schema.bcPrograms.clientId, input.clientId)).limit(1);
        return program || null;
    }),

    generateBiaDraft: clientProcedure.input(z.object({
        processId: z.number(),
        clientId: z.number()
    })).mutation(async ({ input }: any) => {
        const process = await db.getBusinessProcessById(input.processId);
        if (!process) throw new TRPCError({ code: "NOT_FOUND", message: "Process not found" });
        if (process.clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

        // Create a BIA record
        const bia = await db.createBIA({
            clientId: process.clientId,
            processId: process.id,
            title: `BIA Assessment: ${process.name}`,
            status: "draft"
        });

        // Create initial recovery objective
        await db.saveRecoveryObjective({
            biaId: bia.id,
            activity: "Full Recovery",
            rto: process.rto || "4 Hours",
            rpo: process.rpo || "1 Hour",
            criticality: process.criticalityTier || "High"
        });

        return bia;
    }),

    projects: router({
        list: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
            return await db.getBcpProjects(input.clientId);
        }),
        get: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number()
        })).query(async ({ input }: any) => {
            const project = await db.getBcpProjectById(input.id);
            if (project && project.clientId !== input.clientId) return null;
            return project;
        }),
        create: clientProcedure.input(z.object({
            clientId: z.number(),
            title: z.string(),
            scope: z.string().optional(),
            managerId: z.number().optional(),
            startDate: z.string().optional(), // Date string
            targetDate: z.string().optional(), // Date string
        })).mutation(async ({ input }: any) => {
            return await db.createBcpProject({
                ...input,
                startDate: input.startDate ? new Date(input.startDate) : undefined,
                targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
            });
        }),
        update: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number(),
            title: z.string().optional(),
            scope: z.string().optional(),
            status: z.string().optional(),
        })).mutation(async ({ input }: any) => {
            const { id, clientId, ...data } = input;
            const project = await db.getBcpProjectById(id);
            if (!project || project.clientId !== clientId) throw new TRPCError({ code: "FORBIDDEN" });
            return await db.updateBcpProject(id, data);
        }),
    }),

    // Module 2: Process Registry
    processes: router({
        list: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
            const processes = await db.getBusinessProcesses(input.clientId);
            // Fetch dependencies for each process (optional, but good for summary)
            return processes;
        }),
        getProcessesWithBiaStatus: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
            const processes = await db.getBusinessProcesses(input.clientId);
            const bias = await db.getBIAs(input.clientId);

            return processes.map(p => {
                const bia = bias.find((b: any) => b.processId === p.id);
                return {
                    ...p,
                    hasBia: !!bia,
                    biaId: bia?.id,
                    biaStatus: bia?.status
                };
            });
        }),
        get: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number()
        })).query(async ({ input }: any) => {
            const process = await db.getBusinessProcessById(input.id);
            if (!process || process.clientId !== input.clientId) return null;
            const dependencies = await db.getProcessDependencies(input.id);
            return { ...process, dependencies };
        }),
        create: clientProcedure.input(z.object({
            clientId: z.number(),
            name: z.string(),
            description: z.string().optional(),
            department: z.string().optional(),
            ownerId: z.number().optional(),
            parentId: z.number().optional(),
            criticalityTier: z.string().optional(),
            rto: z.string().optional(),
            rpo: z.string().optional(),
            mtpd: z.string().optional(),
        })).mutation(async ({ input }: any) => {
            console.log("SERVER: Creating Business Process", input);
            try {
                const result = await db.createBusinessProcess(input);
                console.log("SERVER: Process Created", result);
                return result;
            } catch (e: any) {
                console.error("SERVER: Process Creation Failed", e);
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Process Creation Failed: " + e.message });
            }
        }),
        update: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number(),
            name: z.string().optional(),
            description: z.string().optional(),
            department: z.string().optional(),
            ownerId: z.number().optional(),
            parentId: z.number().optional(),
            criticalityTier: z.string().optional(),
            rto: z.string().optional(),
            rpo: z.string().optional(),
            mtpd: z.string().optional(),
        })).mutation(async ({ input }: any) => {
            const { id, clientId, ...data } = input;
            const process = await db.getBusinessProcessById(id);
            if (!process || process.clientId !== clientId) throw new TRPCError({ code: "FORBIDDEN" });
            return await db.updateBusinessProcess(id, data);
        }),
        delete: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number()
        })).mutation(async ({ input }: any) => {
            const process = await db.getBusinessProcessById(input.id);
            if (!process || process.clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });
            await db.deleteBusinessProcess(input.id);
            return { success: true };
        }),

        // Dependencies
        addDependency: clientProcedure.input(z.object({
            processId: z.number(),
            dependencyType: z.string(),
            dependencyName: z.string(),
            criticality: z.string().optional(),
            notes: z.string().optional(),
        })).mutation(async ({ input }: any) => {
            return await db.addProcessDependency(input);
        }),

        removeDependency: clientProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }: any) => {
            await db.removeProcessDependency(input.id);
            return { success: true };
        }),
    }),

    // Module 2: BIA Engine
    bia: router({
        list: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
            return await db.getBIAs(input.clientId);
        }),
        get: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number()
        })).query(async ({ input }: any) => {
            const bia = await db.getBIAById(input.id);
            if (!bia || bia.clientId !== input.clientId) return null;
            return bia;
        }),
        create: clientProcedure.input(z.object({
            clientId: z.number(),
            processId: z.number(),
            title: z.string(),
            conductorId: z.number().optional(),
        })).mutation(async ({ input }: any) => {
            return await db.createBIA({
                ...input,
                status: 'draft',
            });
        }),
        updateStatus: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number(),
            status: z.string()
        })).mutation(async ({ input }: any) => {
            const bia = await db.getBIAById(input.id);
            if (!bia || bia.clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });
            await db.updateBIAStatus(input.id, input.status);
            return { success: true };
        }),
        saveResponse: clientProcedure.input(z.object({
            questionId: z.number(),
            response: z.string(),
            notes: z.string().optional(),
            impactLevel: z.string().optional()
        })).mutation(async ({ input }: any) => {
            await db.updateBIAQuestionFull(input.questionId, input.response, input.notes, input.impactLevel);
            return { success: true };
        }),
        // Phase 2: Impact Assessments
        saveImpactAssessment: clientProcedure.input(z.object({
            biaId: z.number(),
            timeInterval: z.string(),
            financialRating: z.number().optional(),
            operationalRating: z.number().optional(),
            reputationRating: z.number().optional(),
            legalRating: z.number().optional(),
            financialValue: z.string().optional(),
            notes: z.string().optional(),
        })).mutation(async ({ input }: any) => {
            return await db.createImpactAssessment(input);
        }),
        getImpactAssessments: clientProcedure.input(z.object({ biaId: z.number() })).query(async ({ input }: any) => {
            return await db.getImpactAssessments(input.biaId);
        }),
        saveFinancialImpact: clientProcedure.input(z.object({
            biaId: z.number(),
            lossCategory: z.string(),
            amountPerUnit: z.number().optional(),
            unit: z.string().optional(),
            description: z.string().optional(),
        })).mutation(async ({ input }: any) => {
            return await db.createFinancialImpact(input);
        }),
        getFinancialImpacts: clientProcedure.input(z.object({ biaId: z.number() })).query(async ({ input }: any) => {
            return await db.getFinancialImpacts(input.biaId);
        }),

        // Phase 3: Recovery Strategies (RTO/RPO)
        saveRecoveryObjective: clientProcedure.input(z.object({
            biaId: z.number(),
            activity: z.string(),
            criticality: z.string().optional(),
            rto: z.string().optional(),
            rpo: z.string().optional(),
            mtpd: z.string().optional(),
            dependencies: z.string().optional(),
            resources: z.string().optional(),
        })).mutation(async ({ input }: any) => {
            return await db.saveRecoveryObjective(input);
        }),
        getRecoveryObjectives: clientProcedure.input(z.object({ biaId: z.number() })).query(async ({ input }: any) => {
            return await db.getRecoveryObjectives(input.biaId);
        }),
        getActivitiesForBias: clientProcedure.input(z.object({ biaIds: z.array(z.number()) })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            if (input.biaIds.length === 0) return [];
            return await dbConn.select().from(schema.recoveryObjectives).where(inArray(schema.recoveryObjectives.biaId, input.biaIds));
        }),

        // BIA Enhanced Details (Seasonality, Vital Records)
        seasonality: router({
            list: clientProcedure.input(z.object({ biaId: z.number() })).query(async ({ input }: any) => {
                return await db.getBiaSeasonalEvents(input.biaId);
            }),
            create: clientProcedure.input(z.object({
                biaId: z.number(),
                name: z.string(),
                startDate: z.string().optional(),
                endDate: z.string().optional(),
                impactDescription: z.string().optional(),
            })).mutation(async ({ input }: any) => {
                return await db.createBiaSeasonalEvent(input);
            }),
            delete: clientProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }: any) => {
                return await db.deleteBiaSeasonalEvent(input.id);
            }),
        }),

        vitalRecords: router({
            list: clientProcedure.input(z.object({ biaId: z.number() })).query(async ({ input }: any) => {
                return await db.getBiaVitalRecords(input.biaId);
            }),
            create: clientProcedure.input(z.object({
                biaId: z.number(),
                recordName: z.string(),
                mediaType: z.string().optional(),
                location: z.string().optional(),
                backupMethod: z.string().optional(),
                rto: z.string().optional(),
            })).mutation(async ({ input }: any) => {
                return await db.createBiaVitalRecord(input);
            }),
            delete: clientProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }: any) => {
                return await db.deleteBiaVitalRecord(input.id);
            }),
        }),
    }),
    stakeholders: router({
        add: clientProcedure.input(z.object({
            userId: z.number(),
            role: z.string(),
            projectId: z.number().optional(),
            processId: z.number().optional(),
        })).mutation(async ({ input }: any) => {
            return await db.addStakeholder(input);
        }),
        list: clientProcedure.input(z.object({
            projectId: z.number().optional(),
            processId: z.number().optional(),
        })).query(async ({ input }: any) => {
            return await db.getStakeholders(input.projectId, input.processId);
        }),
        searchCandidates: clientProcedure.input(z.object({
            query: z.string().optional()
        })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            if (!input.query) return await dbConn.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email }).from(schema.users).limit(10);
            return await dbConn.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
                .from(schema.users)
                .where(sql`to_tsvector('english', ${schema.users.name} || ' ' || ${schema.users.email}) @@ plainto_tsquery('english', ${input.query})`)
                .limit(10);
        }),
    }),

    scenarios: router({
        list: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
            return await db.getDisruptiveScenarios(input.clientId);
        }),
        create: clientProcedure.input(z.object({
            clientId: z.number(),
            title: z.string(),
            description: z.string(),
            likelihood: z.string().optional(),
            potentialImpact: z.string().optional(),
            mitigationStrategies: z.string().optional(),
        })).mutation(async ({ input }: any) => {
            return await db.createDisruptiveScenario(input);
        }),
        delete: clientProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }: any) => {
            return await db.deleteDisruptiveScenario(input.id);
        }),
        update: clientProcedure.input(z.object({
            id: z.number(),
            title: z.string().optional(),
            description: z.string().optional(),
            likelihood: z.string().optional(),
            potentialImpact: z.string().optional(),
            mitigationStrategies: z.string().optional(),
        })).mutation(async ({ input }: any) => {
            const { id, ...data } = input;
            return await db.updateDisruptiveScenario(id, data);
        }),
        listRisks: clientProcedure.input(z.object({ scenarioId: z.number() })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            return await dbConn.select({
                id: schema.riskAssessments.id,
                title: schema.riskAssessments.title,
                description: schema.riskAssessments.threatDescription, // Use threatDescription as generic description or fallback
                inherentRiskScore: schema.riskAssessments.inherentScore,
                linkId: schema.riskScenarioLinks.id
            })
                .from(schema.riskScenarioLinks)
                .innerJoin(schema.riskAssessments, eq(schema.riskScenarioLinks.riskId, schema.riskAssessments.id))
                .where(eq(schema.riskScenarioLinks.scenarioId, input.scenarioId));
        }),
        addRisk: clientProcedure.input(z.object({
            scenarioId: z.number(),
            riskId: z.number(),
            notes: z.string().optional()
        })).mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            return await dbConn.insert(schema.riskScenarioLinks).values(input).returning();
        }),
        removeRisk: clientProcedure.input(z.object({ linkId: z.number() })).mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            return await dbConn.delete(schema.riskScenarioLinks).where(eq(schema.riskScenarioLinks.id, input.linkId));
        }),
    }),

    // Module 4: Strategies
    strategies: router({
        list: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            return await dbConn.select().from(schema.bcStrategies).where(eq(schema.bcStrategies.clientId, input.clientId));
        }),
        create: clientProcedure.input(z.object({
            clientId: z.number(),
            title: z.string(),
            description: z.string().optional(),
            resourceRequirements: z.string().optional(),
            estimatedCost: z.string().optional(),
            benefits: z.string().optional(),
        })).mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            return await dbConn.insert(schema.bcStrategies).values(input).returning();
        }),
        update: clientProcedure.input(z.object({
            id: z.number(),
            title: z.string().optional(),
            description: z.string().optional(),
            approvalStatus: z.string().optional(),
            resourceRequirements: z.string().optional(),
            estimatedCost: z.string().optional(),
            benefits: z.string().optional(),
        })).mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const { id, ...data } = input;
            return await dbConn.update(schema.bcStrategies).set(data).where(eq(schema.bcStrategies.id, id)).returning();
        }),
        delete: clientProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            return await dbConn.delete(schema.bcStrategies).where(eq(schema.bcStrategies.id, input.id));
        }),
    }),

    // Module 4: Plans
    plans: router({
        communications: router({
            list: clientProcedure.input(z.object({ planId: z.number(), clientId: z.number() })).query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
                if (!plan[0] || plan[0].clientId !== input.clientId) return [];
                return await db.getPlanCommunicationChannels(input.planId);
            }),
            create: clientProcedure.input(z.object({
                clientId: z.number(),
                planId: z.number(),
                audience: z.string(),
                channel: z.string().optional(),
                responsibleRole: z.string().optional(),
                messageTemplate: z.string().optional(),
                frequency: z.string().optional(),
            })).mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
                if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });
                return await db.createPlanCommunicationChannel(input);
            }),
            delete: clientProcedure.input(z.object({ id: z.number(), clientId: z.number() })).mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();
                // Check ownership via join or lookup
                // For simplicity, we can trust the ID + clientId pattern if we enforce it everywhere, 
                // but for strict IDOR we must verify the item belongs to a plan that belongs to the client.
                const channel = await dbConn.select().from(schema.bcPlanCommunicationChannels).where(eq(schema.bcPlanCommunicationChannels.id, input.id));
                if (!channel[0]) throw new TRPCError({ code: "NOT_FOUND" });

                const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, channel[0].planId));
                if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

                return await db.deletePlanCommunicationChannel(input.id);
            }),
        }),

        logistics: router({
            list: clientProcedure.input(z.object({ planId: z.number(), clientId: z.number() })).query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
                if (!plan[0] || plan[0].clientId !== input.clientId) return [];
                return await db.getPlanLogistics(input.planId);
            }),
            create: clientProcedure.input(z.object({
                clientId: z.number(),
                planId: z.number(),
                type: z.string(),
                locationName: z.string(),
                address: z.string().optional(),
                capacity: z.number().optional(),
                notes: z.string().optional(),
            })).mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
                if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });
                return await db.createPlanLogistic(input);
            }),
            delete: clientProcedure.input(z.object({ id: z.number(), clientId: z.number() })).mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const logistic = await dbConn.select().from(schema.bcPlanLogistics).where(eq(schema.bcPlanLogistics.id, input.id));
                if (!logistic[0]) throw new TRPCError({ code: "NOT_FOUND" });

                const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, logistic[0].planId));
                if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

                return await db.deletePlanLogistic(input.id);
            }),
        }),

        sections: router({
            get: clientProcedure
                .input(z.object({ planId: z.number(), clientId: z.number() }))
                .query(async ({ input }: any) => {
                    const dbConn = await db.getDb();
                    const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
                    if (!plan[0] || plan[0].clientId !== input.clientId) return [];
                    return await db.getPlanSections(input.planId);
                }),
            upsert: clientProcedure
                .input(z.object({
                    clientId: z.number(),
                    planId: z.number(),
                    sectionKey: z.string(),
                    content: z.string()
                }))
                .mutation(async ({ input }: any) => {
                    const dbConn = await db.getDb();
                    const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
                    if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });
                    return await db.upsertPlanSection(input);
                })
        }),

        appendices: router({
            list: clientProcedure
                .input(z.object({ planId: z.number(), clientId: z.number() }))
                .query(async ({ input }: any) => {
                    const dbConn = await db.getDb();
                    const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
                    if (!plan[0] || plan[0].clientId !== input.clientId) return [];

                    return await db.getPlanAppendices(input.planId);
                }),
            add: clientProcedure
                .input(z.object({
                    clientId: z.number(),
                    planId: z.number(),
                    title: z.string(),
                    type: z.string(),
                    fileUrl: z.string().optional(),
                    description: z.string().optional()
                }))
                .mutation(async ({ input }: any) => {
                    const dbConn = await db.getDb();
                    const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
                    if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

                    return await db.addPlanAppendix(input);
                }),
            remove: clientProcedure
                .input(z.object({ id: z.number(), clientId: z.number() }))
                .mutation(async ({ input }: any) => {
                    const dbConn = await db.getDb();
                    const appendix = await dbConn.select().from(schema.bcPlanAppendices).where(eq(schema.bcPlanAppendices.id, input.id));
                    if (!appendix[0]) throw new TRPCError({ code: "NOT_FOUND" });

                    const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, appendix[0].planId));
                    if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

                    return await db.removePlanAppendix(input.id);
                })
        }),

        contacts: router({
            list: clientProcedure
                .input(z.object({ planId: z.number(), clientId: z.number() }))
                .query(async ({ input }: any) => {
                    const dbConn = await db.getDb();
                    const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
                    if (!plan[0] || plan[0].clientId !== input.clientId) return [];

                    return await dbConn.select({
                        id: schema.bcPlanContacts.id,
                        planId: schema.bcPlanContacts.planId,
                        userId: schema.bcPlanContacts.userId,
                        vendorContactId: schema.bcPlanContacts.vendorContactId,
                        role: schema.bcPlanContacts.role,
                        isPrimary: schema.bcPlanContacts.isPrimary,
                        userName: schema.users.name,
                        userEmail: schema.users.email
                    })
                        .from(schema.bcPlanContacts)
                        .leftJoin(schema.users, eq(schema.bcPlanContacts.userId, schema.users.id))
                        .where(eq(schema.bcPlanContacts.planId, input.planId));
                }),
            add: clientProcedure
                .input(z.object({
                    clientId: z.number(),
                    planId: z.number(),
                    userId: z.number().optional(),
                    vendorContactId: z.number().optional(),
                    role: z.string(),
                    isPrimary: z.boolean().optional()
                }))
                .mutation(async ({ input }: any) => {
                    const dbConn = await db.getDb();
                    const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
                    if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

                    return await dbConn.insert(schema.bcPlanContacts).values(input).returning();
                }),
            remove: clientProcedure
                .input(z.object({ id: z.number(), clientId: z.number() }))
                .mutation(async ({ input }: any) => {
                    const dbConn = await db.getDb();
                    const contact = await dbConn.select().from(schema.bcPlanContacts).where(eq(schema.bcPlanContacts.id, input.id));
                    if (!contact[0]) throw new TRPCError({ code: "NOT_FOUND" });

                    const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, contact[0].planId));
                    if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

                    return await dbConn.delete(schema.bcPlanContacts).where(eq(schema.bcPlanContacts.id, input.id));
                }),
            setPrimary: clientProcedure
                .input(z.object({ planId: z.number(), contactId: z.number(), clientId: z.number() }))
                .mutation(async ({ input }: any) => {
                    const dbConn = await db.getDb();
                    const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
                    if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

                    // Clear all primary flags for this plan
                    await dbConn.update(schema.bcPlanContacts)
                        .set({ isPrimary: false })
                        .where(eq(schema.bcPlanContacts.planId, input.planId));
                    // Set the new primary
                    return await dbConn.update(schema.bcPlanContacts)
                        .set({ isPrimary: true })
                        .where(eq(schema.bcPlanContacts.id, input.contactId))
                        .returning();
                })
        }),
        list: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            return await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.clientId, input.clientId));
        }),
        get: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number()
        })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.id));
            if (!plan[0] || plan[0].clientId !== input.clientId) return null;

            // Fetch relationships
            const bias = await dbConn.select({
                id: schema.businessImpactAnalyses.id,
                title: schema.businessImpactAnalyses.title
            })
                .from(schema.bcPlanBias)
                .innerJoin(schema.businessImpactAnalyses, eq(schema.bcPlanBias.biaId, schema.businessImpactAnalyses.id))
                .where(eq(schema.bcPlanBias.planId, input.id));

            const strategies = await dbConn.select({
                id: schema.bcStrategies.id,
                title: schema.bcStrategies.title
            })
                .from(schema.bcPlanStrategies)
                .innerJoin(schema.bcStrategies, eq(schema.bcPlanStrategies.strategyId, schema.bcStrategies.id))
                .where(eq(schema.bcPlanStrategies.planId, input.id));

            const scenarios = await dbConn.select({
                id: schema.disruptiveScenarios.id,
                title: schema.disruptiveScenarios.title
            })
                .from(schema.bcPlanScenarios)
                .innerJoin(schema.disruptiveScenarios, eq(schema.bcPlanScenarios.scenarioId, schema.disruptiveScenarios.id))
                .where(eq(schema.bcPlanScenarios.planId, input.id));

            return { ...plan[0], bias, strategies, scenarios };
        }),
        getFull: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number()
        })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const plan = await dbConn.query.bcPlans.findFirst({
                where: eq(schema.bcPlans.id, input.id),
                with: {
                    // Relationships via join tables in Drizzle are tricky if not defined in schema relation object
                    // Often easier to manual query if relation objects aren't set up perfectly
                }
            });
            if (!plan || plan.clientId !== input.clientId) return null;

            // 1. Text Sections
            const sections = await dbConn.select().from(schema.bcPlanSections).where(eq(schema.bcPlanSections.planId, input.id));

            // 2. Appendices
            const appendices = await dbConn.select().from(schema.bcPlanAppendices).where(eq(schema.bcPlanAppendices.planId, input.id));

            // 3. BIAs (Full Details)
            const biaLinks = await dbConn.select().from(schema.bcPlanBias).where(eq(schema.bcPlanBias.planId, input.id));
            const biaIds = biaLinks.map((l: any) => l.biaId);
            let bias: any[] = [];
            if (biaIds.length > 0) {
                bias = await dbConn.select().from(schema.businessImpactAnalyses).where(inArray(schema.businessImpactAnalyses.id, biaIds));
                // Fetch RTOs for these BIAs
                const rtos = await dbConn.select().from(schema.recoveryObjectives).where(inArray(schema.recoveryObjectives.biaId, biaIds));
                // Attach RTOs
                bias = bias.map(b => ({
                    ...b,
                    rtos: rtos.filter((r: any) => r.biaId === b.id)
                }));
            }

            // 4. Strategies (Full Details)
            const stratLinks = await dbConn.select().from(schema.bcPlanStrategies).where(eq(schema.bcPlanStrategies.planId, input.id));
            const stratIds = stratLinks.map((l: any) => l.strategyId);
            let strategies: any[] = [];
            if (stratIds.length > 0) {
                strategies = await dbConn.select().from(schema.bcStrategies).where(inArray(schema.bcStrategies.id, stratIds));
            }

            // 5. Scenarios
            const scenLinks = await dbConn.select().from(schema.bcPlanScenarios).where(eq(schema.bcPlanScenarios.planId, input.id));
            const scenIds = scenLinks.map((l: any) => l.scenarioId);
            let scenarios: any[] = [];
            if (scenIds.length > 0) {
                scenarios = await dbConn.select().from(schema.disruptiveScenarios).where(inArray(schema.disruptiveScenarios.id, scenIds));
            }

            // 6. Exercises
            const exercises = await dbConn.select().from(schema.planExercises).where(eq(schema.planExercises.planId, input.id));

            return {
                ...plan,
                sections,
                appendices,
                bias,
                strategies,
                scenarios,
                exercises
            };
        }),
        create: clientProcedure.input(z.object({
            clientId: z.number(),
            title: z.string(),
            version: z.string().optional(),
            status: z.string().optional(),
            content: z.string().optional(),
            biaIds: z.array(z.number()).optional(),
            strategyIds: z.array(z.number()).optional(),
            scenarioIds: z.array(z.number()).optional(),
        })).mutation(async ({ input, ctx }: any) => {
            const dbConn = await db.getDb();
            const { biaIds, strategyIds, scenarioIds, ...planData } = input;
            const [plan] = await dbConn.insert(schema.bcPlans).values(planData).returning();

            if (biaIds?.length) {
                await dbConn.insert(schema.bcPlanBias).values(biaIds.map((id: number) => ({ planId: plan.id, biaId: id })));
            }
            if (strategyIds?.length) {
                await dbConn.insert(schema.bcPlanStrategies).values(strategyIds.map((id: number) => ({ planId: plan.id, strategyId: id })));
            }
            if (scenarioIds?.length) {
                await dbConn.insert(schema.bcPlanScenarios).values(scenarioIds.map((id: number) => ({ planId: plan.id, scenarioId: id })));
            }

            // Log change
            await dbConn.insert(schema.planChangeLog).values({
                planId: plan.id,
                userId: ctx.user?.id || 0, // Fallback if no user context
                action: 'create',
                details: 'Initial plan creation'
            });

            return plan;
        }),
        update: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number(),
            title: z.string().optional(),
            content: z.string().optional(),
            status: z.string().optional(),
            version: z.string().optional(),
            biaIds: z.array(z.number()).optional(),
            strategyIds: z.array(z.number()).optional(),
            scenarioIds: z.array(z.number()).optional(),
        })).mutation(async ({ input, ctx }: any) => {
            const dbConn = await db.getDb();
            const { id, clientId, biaIds, strategyIds, scenarioIds, ...data } = input;

            const check = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, id));
            if (!check[0] || check[0].clientId !== clientId) throw new TRPCError({ code: "FORBIDDEN" });

            await dbConn.update(schema.bcPlans).set(data).where(eq(schema.bcPlans.id, id));

            // Update relationships (Simple clear and re-insert)
            if (biaIds) {
                await dbConn.delete(schema.bcPlanBias).where(eq(schema.bcPlanBias.planId, id));
                if (biaIds.length > 0) {
                    await dbConn.insert(schema.bcPlanBias).values(biaIds.map((bid: number) => ({ planId: id, biaId: bid })));
                }
            }
            if (strategyIds) {
                await dbConn.delete(schema.bcPlanStrategies).where(eq(schema.bcPlanStrategies.planId, id));
                if (strategyIds.length > 0) {
                    await dbConn.insert(schema.bcPlanStrategies).values(strategyIds.map((sid: number) => ({ planId: id, strategyId: sid })));
                }
            }
            if (scenarioIds) {
                await dbConn.delete(schema.bcPlanScenarios).where(eq(schema.bcPlanScenarios.planId, id));
                if (scenarioIds.length > 0) {
                    await dbConn.insert(schema.bcPlanScenarios).values(scenarioIds.map((sid: number) => ({ planId: id, scenarioId: sid })));
                }
            }



            // Log change
            await dbConn.insert(schema.planChangeLog).values({
                planId: id,
                userId: ctx.user?.id || 0,
                action: 'update',
                details: 'Updated plan details and relationships'
            });

            return { id, success: true };
        }),
        getChangeLog: clientProcedure.input(z.object({
            planId: z.number(),
            clientId: z.number()
        })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
            if (!plan[0] || plan[0].clientId !== input.clientId) return [];

            return await dbConn.select({
                id: schema.planChangeLog.id,
                action: schema.planChangeLog.action,
                details: schema.planChangeLog.details,
                createdAt: schema.planChangeLog.createdAt,
                userName: schema.users.name
            })
                .from(schema.planChangeLog)
                .leftJoin(schema.users, eq(schema.planChangeLog.userId, schema.users.id))
                .where(eq(schema.planChangeLog.planId, input.planId))
                .orderBy(desc(schema.planChangeLog.createdAt));
        }),
        getVersions: clientProcedure.input(z.object({
            planId: z.number(),
            clientId: z.number()
        })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
            if (!plan[0] || plan[0].clientId !== input.clientId) return [];

            return await dbConn.select().from(schema.planVersions).where(eq(schema.planVersions.planId, input.planId)).orderBy(desc(schema.planVersions.createdAt));
        }),
        createVersion: clientProcedure.input(z.object({
            planId: z.number(),
            clientId: z.number(),
            version: z.string(),
            changeSummary: z.string().optional(),
        })).mutation(async ({ input, ctx }: any) => {
            const dbConn = await db.getDb();
            // Fetch full plan
            const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
            if (!plan[0]) throw new Error("Plan not found");
            if (plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

            const bias = await dbConn.select().from(schema.bcPlanBias).where(eq(schema.bcPlanBias.planId, input.planId));
            const strategies = await dbConn.select().from(schema.bcPlanStrategies).where(eq(schema.bcPlanStrategies.planId, input.planId));
            const scenarios = await dbConn.select().from(schema.bcPlanScenarios).where(eq(schema.bcPlanScenarios.planId, input.planId));

            const snapshot = {
                plan: plan[0],
                bias,
                strategies,
                scenarios
            };

            return await dbConn.insert(schema.planVersions).values({
                planId: input.planId,
                version: input.version,
                changeSummary: input.changeSummary,
                contentSnapshot: snapshot,
                createdBy: ctx.user?.id
            }).returning();
        }),

        exportDocx: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number()
        })).mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();

            // Fetch plan with all related data
            const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.id));
            if (!plan[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
            if (plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

            // Fetch sections
            const sections = await dbConn.select().from(schema.bcPlanSections).where(eq(schema.bcPlanSections.planId, input.id));

            // Fetch BIAs with RTOs
            const biaLinks = await dbConn.select().from(schema.bcPlanBias).where(eq(schema.bcPlanBias.planId, input.id));
            const biaIds = biaLinks.map((l: any) => l.biaId);
            let bias: any[] = [];
            if (biaIds.length > 0) {
                bias = await dbConn.select().from(schema.businessImpactAnalyses).where(inArray(schema.businessImpactAnalyses.id, biaIds));
                const rtos = await dbConn.select().from(schema.recoveryObjectives).where(inArray(schema.recoveryObjectives.biaId, biaIds));
                bias = bias.map((b: any) => ({ ...b, rtos: rtos.filter((r: any) => r.biaId === b.id) }));
            }

            // Fetch strategies
            const stratLinks = await dbConn.select().from(schema.bcPlanStrategies).where(eq(schema.bcPlanStrategies.planId, input.id));
            const stratIds = stratLinks.map((l: any) => l.strategyId);
            let strategies: any[] = [];
            if (stratIds.length > 0) {
                strategies = await dbConn.select().from(schema.bcStrategies).where(inArray(schema.bcStrategies.id, stratIds));
            }

            // Fetch scenarios
            const scenLinks = await dbConn.select().from(schema.bcPlanScenarios).where(eq(schema.bcPlanScenarios.planId, input.id));
            const scenIds = scenLinks.map((l: any) => l.scenarioId);
            let scenarios: any[] = [];
            if (scenIds.length > 0) {
                scenarios = await dbConn.select().from(schema.disruptiveScenarios).where(inArray(schema.disruptiveScenarios.id, scenIds));
            }

            // Fetch exercises
            const exercises = await dbConn.select().from(schema.planExercises).where(eq(schema.planExercises.planId, input.id));

            // Generate DOCX
            try {
                const { generateBcpDocx } = await import("../../lib/docx/generate-bcp-docx");
                const buffer = await generateBcpDocx({
                    plan: plan[0],
                    sections: sections.map((s: any) => ({ sectionKey: s.sectionKey, content: s.content || '', order: s.order || 0 })),
                    bias,
                    strategies,
                    scenarios,
                    exercises
                });

                const filename = `BCP-${plan[0].title.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().split('T')[0]}.docx`;
                return { base64: buffer.toString('base64'), filename };
            } catch (err: any) {
                console.error('DOCX Generation Error:', err);
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to generate document: ${err.message}` });
            }
        }),
    }),

    exercises: router({
        list: clientProcedure.input(z.object({ planId: z.number(), clientId: z.number() })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
            if (!plan[0] || plan[0].clientId !== input.clientId) return [];
            return await dbConn.select().from(schema.planExercises).where(eq(schema.planExercises.planId, input.planId)).orderBy(desc(schema.planExercises.startDate));
        }),
        listAll: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();
            // Join with Plans to get Plan Title
            return await dbConn.select({
                id: schema.planExercises.id,
                title: schema.planExercises.title,
                type: schema.planExercises.type,
                startDate: schema.planExercises.startDate,
                status: schema.planExercises.status || 'completed', // fallback
                planTitle: schema.bcPlans.title
            })
                .from(schema.planExercises)
                .innerJoin(schema.bcPlans, eq(schema.planExercises.planId, schema.bcPlans.id))
                .where(eq(schema.bcPlans.clientId, input.clientId))
                .orderBy(desc(schema.planExercises.startDate));
        }),
        create: clientProcedure.input(z.object({
            clientId: z.number(),
            planId: z.number(),
            title: z.string(),
            type: z.string(),
            date: z.string(),
            status: z.string().optional(),
            notes: z.string().optional()
        })).mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, input.planId));
            if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

            return await dbConn.insert(schema.planExercises).values({
                ...input,
                startDate: new Date(input.date),
                endDate: new Date(input.date) // Default to same day
            }).returning();
        }),
        update: clientProcedure.input(z.object({
            id: z.number(),
            clientId: z.number(),
            status: z.string().optional(),
            outcome: z.string().optional(),
            reportUrl: z.string().optional(),
            notes: z.string().optional()
        })).mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const exercise = await dbConn.select().from(schema.planExercises).where(eq(schema.planExercises.id, input.id));
            if (!exercise[0]) throw new TRPCError({ code: "NOT_FOUND" });

            const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, exercise[0].planId));
            if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

            const { id, clientId, ...data } = input;
            return await dbConn.update(schema.planExercises).set(data).where(eq(schema.planExercises.id, id)).returning();
        }),
        delete: clientProcedure.input(z.object({ id: z.number(), clientId: z.number() })).mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            const exercise = await dbConn.select().from(schema.planExercises).where(eq(schema.planExercises.id, input.id));
            if (!exercise[0]) throw new TRPCError({ code: "NOT_FOUND" });

            const plan = await dbConn.select().from(schema.bcPlans).where(eq(schema.bcPlans.id, exercise[0].planId));
            if (!plan[0] || plan[0].clientId !== input.clientId) throw new TRPCError({ code: "FORBIDDEN" });

            return await dbConn.delete(schema.planExercises).where(eq(schema.planExercises.id, input.id));
        }),
    }),

    // Module 4: Call Tree / Contacts
    callTree: router({
        list: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();

            // 1. Internal Contacts (Users assigned to client)
            // Join userClients -> users
            const internal = await dbConn.select({
                id: schema.users.id,
                name: schema.users.name,
                email: schema.users.email,
                role: schema.userClients.role,
                // phone: users.phone (if it existed, but using schema it doesn't seem to)
            })
                .from(schema.userClients)
                .innerJoin(schema.users, eq(schema.userClients.userId, schema.users.id))
                .where(eq(schema.userClients.clientId, input.clientId));

            // 2. External Contacts (Vendors)
            const external = await dbConn.select().from(schema.vendorContacts).where(eq(schema.vendorContacts.clientId, input.clientId));

            return { internal, external };
        }),
    }),


    // Module 5 (Advanced): Collaboration & Workflow
    collaboration: router({
        // --- Comments ---
        addComment: clientProcedure
            .input(z.object({
                clientId: z.number(),
                entityType: z.string(),
                entityId: z.number(),
                content: z.string()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();
                return await dbConn.insert(schema.comments).values({
                    clientId: input.clientId,
                    entityType: input.entityType,
                    entityId: input.entityId,
                    userId: ctx.user.id,
                    content: input.content
                }).returning();
            }),

        getComments: clientProcedure
            .input(z.object({
                clientId: z.number(),
                entityType: z.string(),
                entityId: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                return await dbConn.select({
                    id: schema.comments.id,
                    content: schema.comments.content,
                    createdAt: schema.comments.createdAt,
                    userName: schema.users.name,
                    userId: schema.comments.userId
                })
                    .from(schema.comments)
                    .leftJoin(schema.users, eq(schema.comments.userId, schema.users.id))
                    .where(and(
                        eq(schema.comments.clientId, input.clientId),
                        eq(schema.comments.entityType, input.entityType),
                        eq(schema.comments.entityId, input.entityId)
                    ))
                    .orderBy(desc(schema.comments.createdAt));
            }),

        // --- Tasks ---
        assignTask: clientProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string(),
                description: z.string().optional(),
                assigneeId: z.number(),
                dueDate: z.string().optional(),
                relatedEntityType: z.string().optional(),
                relatedEntityId: z.number().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();
                return await dbConn.insert(schema.tasks).values({
                    clientId: input.clientId,
                    title: input.title,
                    description: input.description,
                    assigneeId: input.assigneeId,
                    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
                    status: 'pending',
                    priority: 'medium',
                    createdBy: ctx.user.id,
                    relatedEntityType: input.relatedEntityType,
                    relatedEntityId: input.relatedEntityId
                }).returning();
            }),

        listTasks: clientProcedure
            .input(z.object({
                clientId: z.number(),
                assigneeId: z.number().optional(),
                status: z.string().optional()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const filters = [eq(schema.tasks.clientId, input.clientId)];
                if (input.assigneeId) filters.push(eq(schema.tasks.assigneeId, input.assigneeId));
                if (input.status) filters.push(eq(schema.tasks.status, input.status));

                return await dbConn.select().from(schema.tasks)
                    .where(and(...filters))
                    .orderBy(desc(schema.tasks.createdAt));
            }),

        updateTask: clientProcedure
            .input(z.object({
                id: z.number(),
                status: z.string().optional(),
                notes: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();
                const { id, ...data } = input;
                return await dbConn.update(schema.tasks).set(data).where(eq(schema.tasks.id, id)).returning();
            }),

        // --- Approvals ---
        requestApproval: clientProcedure
            .input(z.object({
                clientId: z.number(),
                entityType: z.string(),
                entityId: z.number(),
                approverId: z.number()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();
                return await dbConn.insert(schema.bcApprovals).values({
                    clientId: input.clientId,
                    entityType: input.entityType,
                    entityId: input.entityId,
                    approverId: input.approverId,
                    status: 'pending'
                }).returning();
            }),

        getApprovals: clientProcedure
            .input(z.object({
                clientId: z.number(),
                entityType: z.string(),
                entityId: z.number()
            }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                return await dbConn.select().from(schema.bcApprovals)
                    .where(and(
                        eq(schema.bcApprovals.clientId, input.clientId),
                        eq(schema.bcApprovals.entityType, input.entityType),
                        eq(schema.bcApprovals.entityId, input.entityId)
                    ))
                    .orderBy(desc(schema.bcApprovals.requestedAt));
            }),

        respondToApproval: clientProcedure
            .input(z.object({
                id: z.number(),
                status: z.enum(['approved', 'rejected']),
                comments: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();
                return await dbConn.update(schema.bcApprovals).set({
                    status: input.status,
                    comments: input.comments,
                    respondedAt: new Date()
                }).where(eq(schema.bcApprovals.id, input.id)).returning();
            }),
    }),

    program: router({
        get: clientProcedure.input(z.object({ clientId: z.number() })).query(async ({ input }: any) => {
            return await db.getBcProgram(input.clientId);
        }),
        upsert: clientProcedure
            .input(z.object({
                id: z.number().optional(),
                clientId: z.number(),
                programName: z.string(),
                scopeDescription: z.string().optional(),
                policyStatement: z.string().optional(),
                budgetAllocated: z.string().optional(),
                programManagerId: z.number().optional(),
                executiveSponsorId: z.number().optional(),
                status: z.enum(['draft', 'approved', 'active']).optional()
            }))
            .mutation(async ({ input }: any) => {
                const { id, ...data } = input;
                if (id) {
                    return await db.updateBcProgram(id, data);
                } else {
                    return await db.createBcProgram(data);
                }
            }),

        committee: router({
            list: clientProcedure
                .input(z.object({ programId: z.number() }))
                .query(async ({ input }: any) => {
                    return await db.getCommitteeMembers(input.programId);
                }),
            add: clientProcedure
                .input(z.object({
                    programId: z.number(),
                    userId: z.number(),
                    role: z.string(),
                    responsibilities: z.string().optional()
                }))
                .mutation(async ({ input }: any) => {
                    return await db.addCommitteeMember(input);
                }),
            remove: clientProcedure
                .input(z.object({ id: z.number() }))
                .mutation(async ({ input }: any) => {
                    return await db.removeCommitteeMember(input.id);
                })
        }),

        training: router({
            list: clientProcedure
                .input(z.object({ clientId: z.number() }))
                .query(async ({ input }: any) => {
                    return await db.getTrainingRecords(input.clientId);
                }),
            add: clientProcedure
                .input(z.object({
                    clientId: z.number(),
                    userId: z.number(),
                    trainingType: z.string(),
                    completionDate: z.string().optional(),
                    notes: z.string().optional()
                }))
                .mutation(async ({ input }: any) => {
                    return await db.addTrainingRecord({
                        ...input,
                        completionDate: input.completionDate ? new Date(input.completionDate) : undefined
                    });
                })
        })
    }),


});
