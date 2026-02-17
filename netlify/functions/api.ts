import serverless from "serverless-http";
import { app } from "../../server_entry";

export const handler = serverless(app, {
    binary: [
        'application/zip',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/*',
    ]
});
