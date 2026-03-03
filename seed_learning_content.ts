import { getDb } from "./db";
import { learningFrameworks, learningSections } from "./schema";

async function seedLearningContent() {
    const db = await getDb();

    console.log("Seeding learning content...");

    // Seed frameworks
    const frameworks = [
        {
            frameworkId: "iso-27001",
            title: "ISO 27001",
            description: "The international standard for Information Security Management Systems (ISMS).",
            color: "bg-blue-600",
            icon: "Shield",
            sortOrder: 1,
        },
        {
            frameworkId: "soc-2",
            title: "SOC 2",
            description: "Service Organization Control 2 - Trust Services Criteria.",
            color: "bg-orange-600",
            icon: "FileText",
            sortOrder: 2,
        },
        {
            frameworkId: "gdpr",
            title: "GDPR",
            description: "General Data Protection Regulation - EU Data Privacy.",
            color: "bg-yellow-500",
            icon: "Globe",
            sortOrder: 3,
        },
        {
            frameworkId: "hipaa",
            title: "HIPAA",
            description: "Health Insurance Portability and Accountability Act.",
            color: "bg-teal-600",
            icon: "Activity",
            sortOrder: 4,
        },
        {
            frameworkId: "cmmc",
            title: "CMMC",
            description: "The Cybersecurity Maturity Model Certification.",
            color: "bg-indigo-700",
            icon: "Shield",
            sortOrder: 5,
        },
    ];

    for (const fw of frameworks) {
        const existing = await db.select().from(learningFrameworks).where(
            // @ts-ignore
            learningFrameworks.frameworkId === fw.frameworkId
        ).limit(1);

        if (existing.length === 0) {
            await db.insert(learningFrameworks).values(fw);
            console.log(`Created framework: ${fw.title}`);
        }
    }

    // Get framework IDs
    const allFrameworks = await db.select().from(learningFrameworks);
    const frameworkMap = Object.fromEntries(
        allFrameworks.map(fw => [fw.frameworkId, fw.id])
    );

    // Seed sections for ISO 27001
    const iso27001Sections = [
        {
            frameworkId: frameworkMap["iso-27001"],
            sectionId: "intro",
            title: "Introduction to ISO 27001",
            icon: "Shield",
            sortOrder: 1,
            content: `
        <div class="space-y-4">
          <p class="text-lg leading-relaxed text-muted-foreground">
            ISO/IEC 27001 is the world's best-known standard for information security management systems (ISMS). It defines requirements such an ISMS must meet.
          </p>
          <div class="grid md:grid-cols-2 gap-6 mt-6">
            <div class="p-6 bg-card rounded-xl border shadow-sm">
              <h4 class="font-semibold text-primary mb-2">Why it matters?</h4>
              <p class="text-sm text-muted-foreground">
                It demonstrates to your customers and partners that you take security seriously and have processes in place to protect their data.
              </p>
            </div>
            <div class="p-6 bg-card rounded-xl border shadow-sm">
              <h4 class="font-semibold text-primary mb-2">Who is it for?</h4>
              <p class="text-sm text-muted-foreground">
                Any organization, big or small, that wants to manage its data security risks formally.
              </p>
            </div>
          </div>
        </div>
      `,
        },
        {
            frameworkId: frameworkMap["iso-27001"],
            sectionId: "cia-triad",
            title: "The CIA Triad",
            icon: "Lock",
            sortOrder: 2,
            content: `
        <div class="space-y-6">
          <p>At the heart of ISO 27001 is the preservation of the CIA Triad:</p>
          <div class="grid gap-4">
            <div class="flex items-start gap-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100">
              <div class="p-2 bg-blue-100 rounded-lg text-blue-600 font-bold">C</div>
              <div>
                <h4 class="font-semibold text-blue-900">Confidentiality</h4>
                <p class="text-sm text-blue-700 mt-1">Only authorized people can access the information.</p>
              </div>
            </div>
            <div class="flex items-start gap-4 p-4 rounded-lg bg-purple-50/50 border border-purple-100">
              <div class="p-2 bg-purple-100 rounded-lg text-purple-600 font-bold">I</div>
              <div>
                <h4 class="font-semibold text-purple-900">Integrity</h4>
                <p class="text-sm text-purple-700 mt-1">Only authorized people can change the information.</p>
              </div>
            </div>
            <div class="flex items-start gap-4 p-4 rounded-lg bg-green-50/50 border border-green-100">
              <div class="p-2 bg-green-100 rounded-lg text-green-600 font-bold">A</div>
              <div>
                <h4 class="font-semibold text-green-900">Availability</h4>
                <p class="text-sm text-green-700 mt-1">Information is accessible to authorized people whenever it is needed.</p>
              </div>
            </div>
          </div>
        </div>
      `,
        },
        {
            frameworkId: frameworkMap["iso-27001"],
            sectionId: "pcca",
            title: "The PDCA Cycle",
            icon: "Activity",
            sortOrder: 3,
            content: `
        <div class="space-y-4">
          <p>ISO 27001 advocates for a continuous improvement approach known as Plan-Do-Check-Act.</p>
          <ul class="space-y-3 mt-4">
            <li class="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
              <span class="font-bold text-primary w-16">Plan</span>
              <span class="text-sm text-muted-foreground">Establish the ISMS, assess risks, and select controls.</span>
            </li>
            <li class="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
              <span class="font-bold text-primary w-16">Do</span>
              <span class="text-sm text-muted-foreground">Implement and operate the controls.</span>
            </li>
            <li class="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
              <span class="font-bold text-primary w-16">Check</span>
              <span class="text-sm text-muted-foreground">Monitor and review performance against objectives.</span>
            </li>
            <li class="flex gap-3 items-center p-3 bg-muted/30 rounded-lg">
              <span class="font-bold text-primary w-16">Act</span>
              <span class="text-sm text-muted-foreground">Maintain and improve the ISMS based on results.</span>
            </li>
          </ul>
        </div>
      `,
        },
    ];

    // Seed sections for SOC 2
    const soc2Sections = [
        {
            frameworkId: frameworkMap["soc-2"],
            sectionId: "intro",
            title: "What is SOC 2?",
            icon: "FileText",
            sortOrder: 1,
            content: `
        <div class="space-y-4">
          <p class="text-lg leading-relaxed text-muted-foreground">
            SOC 2 is an auditing procedure that ensures your service providers securely manage your data to protect the interests of your organization and the privacy of its clients.
          </p>
          <div class="bg-orange-50 border border-orange-100 p-4 rounded-lg text-orange-800 text-sm">
            <strong>Key Difference:</strong> Unlike ISO 27001 which is a certification, SOC 2 is an attestation report produced by a CPA firm.
          </div>
        </div>
      `,
        },
        {
            frameworkId: frameworkMap["soc-2"],
            sectionId: "tsc",
            title: "Trust Services Criteria",
            icon: "Database",
            sortOrder: 2,
            content: `
        <div class="grid sm:grid-cols-2 gap-4">
          <div class="p-4 border rounded-lg hover:border-orange-200 transition-colors">
            <h5 class="font-bold mb-2">Security (Common Criteria)</h5>
            <p class="text-xs text-muted-foreground">The system is protected against unauthorized access. Required for every SOC 2 report.</p>
          </div>
          <div class="p-4 border rounded-lg hover:border-orange-200 transition-colors">
            <h5 class="font-bold mb-2">Availability</h5>
            <p class="text-xs text-muted-foreground">The system is available for operation and use as committed or agreed.</p>
          </div>
          <div class="p-4 border rounded-lg hover:border-orange-200 transition-colors">
            <h5 class="font-bold mb-2">Processing Integrity</h5>
            <p class="text-xs text-muted-foreground">System processing is complete, valid, accurate, timely, and authorized.</p>
          </div>
          <div class="p-4 border rounded-lg hover:border-orange-200 transition-colors">
            <h5 class="font-bold mb-2">Confidentiality</h5>
            <p class="text-xs text-muted-foreground">Information designated as confidential is protected.</p>
          </div>
          <div class="p-4 border rounded-lg hover:border-orange-200 transition-colors">
            <h5 class="font-bold mb-2">Privacy</h5>
            <p class="text-xs text-muted-foreground">Personal information is collected, used, retained, disclosed, and disposed of appropriately.</p>
          </div>
        </div>
      `,
        },
    ];

    // Seed all sections
    const allSections = [...iso27001Sections, ...soc2Sections];

    for (const section of allSections) {
        const existing = await db.select().from(learningSections).where(
            // @ts-ignore
            learningSections.sectionId === section.sectionId
        ).limit(1);

        if (existing.length === 0) {
            await db.insert(learningSections).values(section);
            console.log(`Created section: ${section.title}`);
        }
    }

    console.log("Learning content seeded successfully!");
}

seedLearningContent()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Error seeding learning content:", err);
        process.exit(1);
    });
