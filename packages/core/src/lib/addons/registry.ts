import type { AddonInfo, AddonContext, AddonManifest, AddonConfiguration } from './types';
import type { BaseAddon } from './base';
import { AddonStatus, AddonManifestSchema } from './types';
import { z } from 'zod';

export type AddonEventType = 
  | 'addon:installed'
  | 'addon:uninstalled'
  | 'addon:activated'
  | 'addon:deactivated'
  | 'addon:error'
  | 'addon:updated';

export interface AddonEvent {
  type: AddonEventType;
  addonId: string;
  timestamp: Date;
  data?: unknown;
}

export type AddonEventHandler = (event: AddonEvent) => void;

class AddonRegistry {
  private addons: Map<string, BaseAddon> = new Map();
  private eventHandlers: Map<AddonEventType, Set<AddonEventHandler>> = new Map();
  private storageKey = 'complianceos_addons';

  async register(addon: BaseAddon): Promise<AddonInfo> {
    if (this.addons.has(addon.id)) {
      throw new Error(`Addon with ID "${addon.id}" is already registered`);
    }

    const manifestValidation = AddonManifestSchema.safeParse(addon.manifestData);
    if (!manifestValidation.success) {
      throw new Error(`Invalid addon manifest: ${manifestValidation.error.message}`);
    }

    this.addons.set(addon.id, addon);
    await this.persistState();
    
    this.emit({
      type: 'addon:installed',
      addonId: addon.id,
      timestamp: new Date(),
    });

    return addon.info;
  }

  async unregister(addonId: string): Promise<boolean> {
    const addon = this.addons.get(addonId);
    if (!addon) {
      return false;
    }

    if (addon.info.status === 'active') {
      await addon.deactivate();
    }

    await addon.uninstall();
    this.addons.delete(addonId);
    await this.persistState();

    this.emit({
      type: 'addon:uninstalled',
      addonId,
      timestamp: new Date(),
    });

    return true;
  }

  async initializeAll(): Promise<Map<string, AddonInfo>> {
    const results = new Map<string, AddonInfo>();

    for (const addon of this.addons.values()) {
      try {
        const info = await addon.initialize();
        results.set(addon.id, info);
      } catch (error) {
        console.error(`Failed to initialize addon ${addon.id}:`, error);
        results.set(addon.id, {
          ...addon.info,
          status: 'error' as AddonStatus,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async activateAll(): Promise<Map<string, AddonInfo>> {
    const results = new Map<string, AddonInfo>();

    for (const addon of this.addons.values()) {
      try {
        await addon.activate();
        results.set(addon.id, addon.info);
      } catch (error) {
        console.error(`Failed to activate addon ${addon.id}:`, error);
        results.set(addon.id, {
          ...addon.info,
          status: 'error' as AddonStatus,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async deactivateAll(): Promise<void> {
    for (const addon of this.addons.values()) {
      if (addon.info.status === 'active') {
        await addon.deactivate();
      }
    }
  }

  get(addonId: string): BaseAddon | undefined {
    return this.addons.get(addonId);
  }

  getAll(): AddonInfo[] {
    return Array.from(this.addons.values()).map(addon => addon.info);
  }

  getByCategory(category: string): AddonInfo[] {
    return Array.from(this.addons.values())
      .filter(addon => addon.category === category)
      .map(addon => addon.info);
  }

  getActive(): AddonInfo[] {
    return Array.from(this.addons.values())
      .filter(addon => addon.info.status === 'active')
      .map(addon => addon.info);
  }

  async updateConfig(addonId: string, config: AddonConfiguration): Promise<AddonInfo | null> {
    const addon = this.addons.get(addonId);
    if (!addon) {
      return null;
    }

    addon.setConfig(config);
    await this.persistState();
    return addon.info;
  }

  setContext(addonId: string, context: AddonContext): boolean {
    const addon = this.addons.get(addonId);
    if (!addon) {
      return false;
    }

    addon.setContext(context);
    return true;
  }

  on(event: AddonEventType, handler: AddonEventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  off(event: AddonEventType, handler: AddonEventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: AddonEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  private async persistState(): Promise<void> {
    const state = {
      addons: Array.from(this.addons.entries()).map(([id, addon]) => ({
        id,
        manifest: addon.manifestData,
        config: addon.getConfig(),
        status: addon.info.status,
      })),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    }
  }

  async restoreState(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        return;
      }

      const state = JSON.parse(stored);
      for (const addonState of state.addons) {
        try {
          const AddonClass = this.getAddonClass(addonState.manifest.category);
          if (AddonClass) {
            const addon = new AddonClass(addonState.manifest);
            addon.setConfig(addonState.config);
            addon.setStatus(addonState.status);
            await this.register(addon);
          }
        } catch (error) {
          console.error(`Failed to restore addon ${addonState.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to restore addon state:', error);
    }
  }

  private getAddonClass(category: string): typeof BaseAddon | null {
    const addonClasses: Record<string, typeof BaseAddon> = {};

    for (const [key, value] of Object.entries(addonClasses)) {
      if (key === category) {
        return value;
      }
    }

    return null;
  }

  async validatePermissions(userPermissions: string[]): Promise<Map<string, string[]>> {
    const results = new Map<string, string[]>();

    for (const addon of this.addons.values()) {
      const required = addon.manifestData.permissions || [];
      const missing = required.filter(p => !userPermissions.includes(p));
      results.set(addon.id, missing);
    }

    return results;
  }
}

export const addonRegistry = new AddonRegistry();
