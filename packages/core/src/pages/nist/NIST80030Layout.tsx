
import React, { PropsWithChildren } from "react";
import NISTEcosystemLayout from "./NISTEcosystemLayout";

export default function NIST80030Layout({ children }: PropsWithChildren) {
    return (
        <NISTEcosystemLayout standard="800-30">
            {children}
        </NISTEcosystemLayout>
    );
}
