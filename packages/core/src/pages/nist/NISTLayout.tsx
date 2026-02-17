import React, { PropsWithChildren } from "react";
import NISTEcosystemLayout from "./NISTEcosystemLayout";

export default function NISTLayout({ children, fullWidth = false }: PropsWithChildren<{ fullWidth?: boolean }>) {
    return (
        <NISTEcosystemLayout standard="csf" fullWidth={fullWidth}>
            {children}
        </NISTEcosystemLayout>
    );
}
