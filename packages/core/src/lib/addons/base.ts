import type {
  AddonManifest,
  AddonInfo,
  AddonContext,
  AddonConfiguration,
  AddonHookResult,
  AddonInitializationResult
} from './types';
import { AddonStatus } from './types';

export abstract class BaseAddon {
  protected manifest: AddonManifest;
  protected config: AddonConfiguration = {};
  protected status: AddonStatus = 'pending';
  protected context?: AddonContext;
  protected error?: string;

  constructor(manifest: AddonManifest) {
    this.manifest = manifest;
  }

  get id(): string {
    return this.manifest.id;
  }

  get name(): string {
    return this.manifest.name;
  }

  get version(): string {
    return this.manifest.version;
  }

  get category(): string {
    return this.manifest.category;
  }

  get manifestData(): AddonManifest {
    return this.manifest;
  }

  get info(): AddonInfo {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.manifest.description,
      author: this.manifest.author,
      category: this.manifest.category,
      status: this.status,
      icon: this.manifest.icon,
      homepage: this.manifest.homepage,
      repository: this.manifest.repository,
      license: this.manifest.license,
      configuration: this.config,
      permissions: this.manifest.permissions || [],
      error: this.error,
    };
  }

  setStatus(status: AddonStatus): void {
    this.status = status;
  }

  setConfig(config: AddonConfiguration): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AddonConfiguration {
    return { ...this.config };
  }

  setContext(context: AddonContext): void {
    this.context = context;
  }

  getContext(): AddonContext | undefined {
    return this.context;
  }

  hasPermission(permission: string): boolean {
    return this.manifest.permissions?.includes(permission as any) ?? false;
  }

  async initialize(): Promise<AddonInitializationResult> {
    try {
      this.status = 'installing';
      const result = await this.onInitialize();
      this.status = result.success ? 'active' : 'error';
      this.error = result.error;
      return result;
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: this.error };
    }
  }

  async activate(): Promise<AddonHookResult> {
    try {
      this.status = 'active';
      const result = await this.onActivate();
      if (!result.success) {
        this.status = 'error';
      }
      return result;
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: this.error };
    }
  }

  async deactivate(): Promise<AddonHookResult> {
    try {
      const previousStatus = this.status;
      this.status = 'inactive';
      const result = await this.onDeactivate();
      if (!result.success) {
        this.status = previousStatus;
      }
      return result;
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: this.error };
    }
  }

  async uninstall(): Promise<AddonHookResult> {
    try {
      this.status = 'uninstalling';
      const result = await this.onUninstall();
      return result;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: this.error };
    }
  }

  async update(newManifest: AddonManifest): Promise<AddonInitializationResult> {
    try {
      this.status = 'updating';
      const result = await this.onUpdate(newManifest);
      if (result.success) {
        this.manifest = newManifest;
        this.status = 'active';
      } else {
        this.status = 'error';
      }
      return result;
    } catch (error) {
      this.status = 'error';
      this.error = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: this.error };
    }
  }

  protected async onInitialize(): Promise<AddonInitializationResult> {
    return { success: true };
  }

  protected async onActivate(): Promise<AddonHookResult> {
    return { success: true };
  }

  protected async onDeactivate(): Promise<AddonHookResult> {
    return { success: true };
  }

  protected async onUninstall(): Promise<AddonHookResult> {
    return { success: true };
  }

  protected async onUpdate(newManifest: AddonManifest): Promise<AddonInitializationResult> {
    return { success: true };
  }

  abstract getSettingsSchema(): Record<string, unknown>;
  abstract renderSettings(): React.ReactNode;
}
