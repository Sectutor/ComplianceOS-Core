import { sendThreatAlert } from "../src/emailNotification";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });
dotenv.config({ path: "../.env" });

async function verifyThreatAlert() {
    const clientId = 3; // Using Client 3 as test target

    const mockThreats = [
        {
            cveId: "CVE-2025-9999",
            assetName: "Production Database Server",
            description: "A critical SQL injection vulnerability allows remote attackers to execute arbitrary code via the user_input parameter.",
            score: "9.8"
        },
        {
            cveId: "CVE-2025-8888",
            assetName: "Employee Portal",
            description: "Remote Code Execution (RCE) in the login module.",
            score: "9.0"
        }
    ];

    console.log("Simulating Threat Alert for Client", clientId);
    const result = await sendThreatAlert(clientId, mockThreats);
    console.log("Alert Result:", result);
}

verifyThreatAlert().catch(console.error);
