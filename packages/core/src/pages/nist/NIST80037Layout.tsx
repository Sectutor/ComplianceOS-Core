
import React, { PropsWithChildren } from "react";
import NISTEcosystemLayout from "./NISTEcosystemLayout";

export default function NIST80037Layout({ children }: PropsWithChildren) {
    return (
        <NISTEcosystemLayout standard="rmf">
            {children}
        </NISTEcosystemLayout>
    );
}
