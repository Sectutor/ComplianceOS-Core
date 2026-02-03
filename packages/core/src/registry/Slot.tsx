import React from 'react';
import { registry } from './registry';

/**
 * A React component that renders all plugins registered to a specific slot name.
 */
export const Slot: React.FC<{ name: string; props?: any }> = ({ name, props }) => {
    const components = registry.getComponents(name);

    if (components.length === 0) return null;

    return (
        <>
            {components.map((Comp, index) => (
                <Comp key={`${name}-${index}`} {...props} />
            ))}
        </>
    );
};
