
import 'dotenv/config';
import { getDb } from './db';
import * as schema from './schema';
import { eq } from 'drizzle-orm';

async function main() {
    const db = await getDb();

    const planId = 18;
    const plan = await db.query.implementationPlans.findFirst({
        where: eq(schema.implementationPlans.id, planId)
    });

    if (!plan) {
        console.log("❌ Plan 18 not found!");
        process.exit(1);
    }

    // 1. Get requirements for GDPR
    const requirements = await db.select().from(schema.frameworkRequirements)
        .where(eq(schema.frameworkRequirements.frameworkId, plan.frameworkId!));

    // 2. Get phases for mapping names
    const phases = await db.select().from(schema.implementationPhases)
        .where(eq(schema.implementationPhases.frameworkId, plan.frameworkId!));

    const phaseMap = new Map(phases.map(p => [p.id, p.name]));

    console.log(`Found ${requirements.length} requirements and ${phases.length} phases.`);

    // 3. Create tasks
    const tasksToInsert = requirements.map(r => ({
        implementationPlanId: planId,
        clientId: plan.clientId,
        title: r.title,
        description: `Requirement identifier: ${r.identifier}. ${r.description}`,
        status: 'todo',
        priority: 'medium',
        pdca: r.phaseId ? phaseMap.get(r.phaseId) || 'Plan' : 'Plan',
        tags: r.mappingTags || [],
        createdById: 1
    }));

    if (tasksToInsert.length > 0) {
        await db.insert(schema.implementationTasks).values(tasksToInsert);
        console.log(`✅ Seeded ${tasksToInsert.length} tasks into Plan 18.`);
    }

    process.exit(0);
}

main();
