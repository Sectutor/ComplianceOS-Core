
import { Shield, Lock, FileText, Database, Activity, Eye, FileCheck, Globe, Server, UserCheck } from "lucide-react";

export interface LearningSection {
  id: string;
  title: string;
  icon?: any;
  content: string; // HTML string for rich formatting
}

export interface FrameworkLearning {
  id: string;
  title: string;
  description: string;
  color: string;
  sections: LearningSection[];
}

export const learningContent: Record<string, FrameworkLearning> = {
  "iso-27001": {
    id: "iso-27001",
    title: "ISO 27001",
    description: "The international standard for Information Security Management Systems (ISMS).",
    color: "bg-blue-600",
    sections: [
      {
        id: "intro",
        title: "Introduction to ISO 27001",
        icon: Shield,
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
        `
      },
      {
        id: "cia-triad",
        title: "The CIA Triad",
        icon: Lock,
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
        `
      },
      {
        id: "pcca",
        title: "The PDCA Cycle",
        icon: Activity,
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
        `
      }
    ]
  },
  "soc-2": {
    id: "soc-2",
    title: "SOC 2",
    description: "Service Organization Control 2 - Trust Services Criteria.",
    color: "bg-orange-600",
    sections: [
      {
        id: "intro",
        title: "What is SOC 2?",
        icon: FileText,
        content: `
          <div class="space-y-4">
             <p class="text-lg leading-relaxed text-muted-foreground">
              SOC 2 is an auditing procedure that ensures your service providers securely manage your data to protect the interests of your organization and the privacy of its clients.
            </p>
            <div class="bg-orange-50 border border-orange-100 p-4 rounded-lg text-orange-800 text-sm">
              <strong>Key Difference:</strong> Unlike ISO 27001 which is a certification, SOC 2 is an attestation report produced by a CPA firm.
            </div>
          </div>
        `
      },
      {
        id: "tsc",
        title: "Trust Services Criteria",
        icon: Database,
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
        `
      },
      {
        id: "types",
        title: "Type I vs Type II",
        icon: FileCheck,
        content: `
          <table class="w-full text-sm text-left">
            <thead class="bg-muted text-muted-foreground font-semibold">
              <tr>
                <th class="p-3 rounded-tl-lg">aspect</th>
                <th class="p-3">Type I</th>
                <th class="p-3 rounded-tr-lg">Type II</th>
              </tr>
            </thead>
            <tbody class="divide-y border-x border-b rounded-b-lg">
              <tr>
                <td class="p-3 font-medium">Focus</td>
                <td class="p-3">Design of controls at a specific point in time.</td>
                <td class="p-3">Design AND operating effectiveness over a period of time.</td>
              </tr>
              <tr>
                <td class="p-3 font-medium">Timeline</td>
                <td class="p-3">Single date (Snaphot).</td>
                <td class="p-3">Review period (usually 3-12 months).</td>
              </tr>
              <tr>
                <td class="p-3 font-medium">Cost/Effort</td>
                <td class="p-3">Lower / Faster.</td>
                <td class="p-3">Higher / More rigorous.</td>
              </tr>
            </tbody>
          </table>
        `
      }
    ]
  },
  "gdpr": {
    id: "gdpr",
    title: "GDPR",
    description: "General Data Protection Regulation - EU Data Privacy.",
    color: "bg-yellow-500",
    sections: [
      {
        id: "intro",
        title: "Intro to GDPR",
        icon: Globe,
        content: `
           <p class="text-lg leading-relaxed text-muted-foreground mb-4">
              The General Data Protection Regulation (GDPR) is the toughest privacy and security law in the world. Though it was drafted and passed by the European Union (EU), it imposes obligations onto organizations anywhere, so long as they target or collect data related to people in the EU.
            </p>
        `
      },
      {
        id: "principles",
        title: "Key Principles",
        icon: Server,
        content: `
          <ul class="grid gap-3">
            <li class="p-3 border rounded-md"><strong>Lawfulness, fairness and transparency</strong> - Processing must be lawful, fair, and transparent to the data subject.</li>
            <li class="p-3 border rounded-md"><strong>Purpose limitation</strong> - You must only collect data for a legitimate interest.</li>
            <li class="p-3 border rounded-md"><strong>Data minimization</strong> - You must only collect as much data as is necessary.</li>
            <li class="p-3 border rounded-md"><strong>Accuracy</strong> - Data must be accurate and kept up to date.</li>
            <li class="p-3 border rounded-md"><strong>Storage limitation</strong> - You cannot store data longer than necessary.</li>
            <li class="p-3 border rounded-md"><strong>Integrity and confidentiality</strong> - Implementation of appropriate security measures.</li>
            <li class="p-3 border rounded-md"><strong>Accountability</strong> - The data controller is responsible for compliance.</li>
          </ul>
        `
      }
    ]
  },
  "hipaa": {
    id: "hipaa",
    title: "HIPAA",
    description: "Health Insurance Portability and Accountability Act.",
    color: "bg-teal-600",
    sections: [
      {
        id: "intro",
        title: "Understanding HIPAA",
        icon: Activity,
        content: `
          <p class="text-lg leading-relaxed text-muted-foreground mb-4">
            HIPAA is a federal law that required the creation of national standards to protect sensitive patient health information from being disclosed without the patient's consent or knowledge.
          </p>
        `
      },
      {
        id: "rules",
        title: "The Main Rules",
        icon: UserCheck,
        content: `
          <div class="space-y-6">
            <div class="flex gap-4">
              <div class="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">P</div>
              <div>
                <h4 class="font-bold text-lg">Privacy Rule</h4>
                <p class="text-muted-foreground text-sm">Standards for the use and disclosure of individuals' health information (called "protected health information").</p>
              </div>
            </div>
            <div class="flex gap-4">
               <div class="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">S</div>
              <div>
                <h4 class="font-bold text-lg">Security Rule</h4>
                <p class="text-muted-foreground text-sm">Standards for protecting individuals' electronic personal health information that is created, received, used, or maintained by a covered entity.</p>
              </div>
            </div>
             <div class="flex gap-4">
               <div class="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0">B</div>
              <div>
                <h4 class="font-bold text-lg">Breach Notification Rule</h4>
                <p class="text-muted-foreground text-sm">Requires covered entities and their business associates to provide notification following a breach of unsecured protected health information.</p>
              </div>
            </div>
          </div>
        `
      }
    ]
  },
  "cmmc": {
    id: "cmmc",
    title: "CMMC",
    description: "The Cybersecurity Maturity Model Certification (CMMC) is a program to measure their cybersecurity maturity.",
    color: "bg-indigo-700",
    sections: [
      {
        id: "intro",
        title: "What is CMMC?",
        icon: Shield,
        content: `
          <div class="space-y-4">
            <p class="text-lg leading-relaxed text-muted-foreground">
              CMMC is designed to verify that defense contractors have the cybersecurity practices in place to protect sensitive data. It is mandatory for any organization doing business with the Department of Defense (DoD).
            </p>
            <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-indigo-800 text-sm">
              <strong>Maturity Model:</strong> CMMC 2.0 simplifies the requirements into three levels, ranging from foundational to expert.
            </div>
          </div>
        `
      },
      {
        id: "levels",
        title: "CMMC 2.0 Levels",
        icon: Activity,
        content: `
          <div class="grid gap-4">
            <div class="p-4 border rounded-lg bg-slate-50">
              <h5 class="font-bold text-indigo-900 mb-2">Level 1: Foundational</h5>
              <p class="text-sm text-muted-foreground">Requires 15 basic practices to protect Federal Contract Information (FCI). Verified via annual self-assessment.</p>
            </div>
            <div class="p-4 border rounded-lg bg-slate-50 border-indigo-200">
              <h5 class="font-bold text-indigo-900 mb-2">Level 2: Advanced</h5>
              <p class="text-sm text-muted-foreground">Requires 110 practices aligned with NIST SP 800-171 to protect Controlled Unclassified Information (CUI). Verified via triennial third-party assessments for some, and self-assessments for others.</p>
            </div>
            <div class="p-4 border rounded-lg bg-slate-50">
              <h5 class="font-bold text-indigo-900 mb-2">Level 3: Expert</h5>
              <p class="text-sm text-muted-foreground">Requires 110+ practices aligned with NIST SP 800-172. Verified via triennial government-led assessments.</p>
            </div>
          </div>
        `
      },
      {
        id: "importance",
        title: "Why CMMC Matters?",
        icon: Lock,
        content: `
          <div class="space-y-4">
            <p>For defense contractors, CMMC is a license to trade. Without the required certification level, organizations will not be eligible to bid on DoD contracts.</p>
            <ul class="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Protects sensitive defense information (FCI and CUI).</li>
              <li>Standardizes cybersecurity across the supply chain.</li>
              <li>Reduces risk of cyber attacks from nation-state actors.</li>
            </ul>
          </div>
        `
      }
    ]
  }
};
