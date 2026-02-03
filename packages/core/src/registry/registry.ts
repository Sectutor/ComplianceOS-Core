import React from 'react';

type ComponentType = React.ComponentType<any>;

class SlotRegistry {
    private slots: Map<string, ComponentType[]> = new Map();

    /**
     * Register a component to a specific slot.
     * @param slotName The unique name of the slot (e.g., 'header-actions')
     * @param component The React component to render
     */
    register(slotName: string, component: ComponentType) {
        if (!this.slots.has(slotName)) {
            this.slots.set(slotName, []);
        }
        this.slots.get(slotName)?.push(component);
    }

    /**
     * Get all components registered for a slot.
     */
    getComponents(slotName: string): ComponentType[] {
        return this.slots.get(slotName) || [];
    }

    /**
     * Clear a slot (useful for testing or HMR)
     */
    clear(slotName: string) {
        this.slots.delete(slotName);
    }
}

export const registry = new SlotRegistry();
