
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "./server/routers";
import superjson from "superjson";

async function main() {
    const trpc = createTRPCProxyClient<AppRouter>({
        links: [
            httpBatchLink({
                url: "http://localhost:5173/api/trpc",
                headers: () => ({
                    // Admin token or headers needed if any
                })
            })
        ],
        transformer: superjson
    });

    try {
        const res = await trpc.requirements.getFrameworkRequirements.query({
            clientId: 3,
            framework: "iso-27001"
        });

        console.log("Controls:", res.controls ? Object.keys(res.controls).length : 0);
        console.log("Policies:", res.policies?.length || 0);
        console.log("Evidence:", res.evidence?.length || 0);
    } catch (err: any) {
        console.error(err.message);
    }
}

main().catch(console.error);
