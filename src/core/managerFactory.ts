import * as vscode from 'vscode';
import { LoggingManager } from '../loggingManager';
import { ProcessManager } from '../processManager';
import { WebViewManager } from '../webViewManager';
import { CommandPaletteManager } from '../commandPaletteManager';
import { ConfigurationService } from './configurationService';
import { ErrorBoundary } from './errorBoundary';
import { AnalyticsService } from './analyticsService';
import { AIAssistantService } from './aiAssistantService';

export interface ManagerConfig {
    context: vscode.ExtensionContext;
    loggingManager?: LoggingManager;
    configService?: ConfigurationService;
    errorBoundary?: ErrorBoundary;
}

export interface IManager {
    dispose(): void;
}

export interface IAsyncManager extends IManager {
    initialize?(): Promise<void>;
}

export class ManagerFactory {
    private static instance: ManagerFactory;
    private managers: Map<string, IManager> = new Map();
    public config: ManagerConfig;

    private constructor(config: ManagerConfig) {
        this.config = config;
    }

    static getInstance(config?: ManagerConfig): ManagerFactory {
        if (!ManagerFactory.instance) {
            if (!config) {
                throw new Error('ManagerFactory requires config for first initialization');
            }
            ManagerFactory.instance = new ManagerFactory(config);
        }
        return ManagerFactory.instance;
    }

    /**
     * Creates or gets a singleton manager instance
     */
    async createManager<T extends IManager>(
        managerType: 'logging' | 'process' | 'webview' | 'command-palette' | 'config' | 'error-boundary' | 'analytics' | 'ai-assistant',
        options?: any
    ): Promise<T> {
        const managerId = managerType;

        // Return existing instance if available
        if (this.managers.has(managerId)) {
            return this.managers.get(managerId) as T;
        }

        let manager: IManager;

        switch (managerType) {
            case 'logging':
                manager = LoggingManager.getInstance();
                break;

            case 'process':
                manager = ProcessManager.getInstance();
                break;

            case 'webview':
                manager = WebViewManager.getInstance(this.config.context);
                break;

            case 'command-palette':
                manager = CommandPaletteManager.getInstance(this.config.context);
                break;

            case 'config':
                manager = ConfigurationService.getInstance();
                break;

            case 'error-boundary':
                manager = ErrorBoundary.getInstance();
                break;

            case 'analytics':
                if (!this.config.loggingManager || !this.config.configService) {
                    throw new Error('Analytics manager requires logging and config services');
                }
                manager = AnalyticsService.getInstance(this.config.loggingManager, this.config.configService);
                break;

            case 'ai-assistant':
                if (!this.config.loggingManager || !this.config.configService) {
                    throw new Error('AI Assistant manager requires logging and config services');
                }
                const analyticsService = this.managers.get('analytics') as AnalyticsService;
                if (!analyticsService) {
                    throw new Error('AI Assistant manager requires analytics service to be initialized first');
                }
                manager = AIAssistantService.getInstance(this.config.loggingManager, this.config.configService, analyticsService);
                break;

            default:
                throw new Error(`Unknown manager type: ${managerType}`);
        }

        // Initialize async managers
        if (this.isAsyncManager(manager) && manager.initialize) {
            await manager.initialize();
        }

        this.managers.set(managerId, manager);
        return manager as T;
    }

    /**
     * Gets an existing manager instance
     */
    getManager<T extends IManager>(managerType: string): T | undefined {
        return this.managers.get(managerType) as T | undefined;
    }

    /**
     * Disposes a specific manager
     */
    async disposeManager(managerType: string): Promise<void> {
        const manager = this.managers.get(managerType);
        if (manager) {
            manager.dispose();
            this.managers.delete(managerType);
        }
    }

    /**
     * Disposes all managers in reverse order of creation
     */
    async disposeAll(): Promise<void> {
        const managerEntries = Array.from(this.managers.entries()).reverse();
        
        for (const [managerId, manager] of managerEntries) {
            try {
                manager.dispose();
                this.managers.delete(managerId);
            } catch (error) {
                console.error(`Error disposing manager ${managerId}:`, error);
            }
        }
    }

    /**
     * Gets all active managers
     */
    getActiveManagers(): string[] {
        return Array.from(this.managers.keys());
    }

    /**
     * Checks if a manager is registered
     */
    hasManager(managerType: string): boolean {
        return this.managers.has(managerType);
    }

    /**
     * Type guard for async managers
     */
    private isAsyncManager(manager: IManager): manager is IAsyncManager {
        return 'initialize' in manager;
    }

    /**
     * Updates the configuration for all managers
     */
    async updateConfig(newConfig: Partial<ManagerConfig>): Promise<void> {
        this.config = { ...this.config, ...newConfig };
        
        // Notify managers about config change if they support it
        for (const [managerId, manager] of this.managers) {
            if ('updateConfig' in manager && typeof (manager as any).updateConfig === 'function') {
                try {
                    await (manager as any).updateConfig(this.config);
                } catch (error) {
                    console.error(`Error updating config for manager ${managerId}:`, error);
                }
            }
        }
    }

    /**
     * Gets health status of all managers
     */
    getHealthStatus(): { [managerId: string]: 'healthy' | 'unhealthy' | 'unknown' } {
        const status: { [managerId: string]: 'healthy' | 'unhealthy' | 'unknown' } = {};

        for (const [managerId, manager] of this.managers) {
            if ('getHealthStatus' in manager && typeof (manager as any).getHealthStatus === 'function') {
                try {
                    status[managerId] = (manager as any).getHealthStatus();
                } catch (error) {
                    status[managerId] = 'unhealthy';
                }
            } else {
                status[managerId] = 'unknown';
            }
        }

        return status;
    }

    /**
     * Reinitializes all managers
     */
    async reinitializeAll(): Promise<void> {
        const managerTypes = Array.from(this.managers.keys());
        
        // Dispose all first
        await this.disposeAll();
        
        // Recreate all managers
        for (const managerType of managerTypes) {
            try {
                await this.createManager(managerType as any);
            } catch (error) {
                console.error(`Error reinitializing manager ${managerType}:`, error);
            }
        }
    }
}

/**
 * Convenience function to create the standard set of managers
 */
export async function createStandardManagers(context: vscode.ExtensionContext): Promise<{
    factory: ManagerFactory;
    errorBoundary: ErrorBoundary;
    configService: ConfigurationService;
    loggingManager: LoggingManager;
    processManager: ProcessManager;
    webViewManager: WebViewManager;
    commandPaletteManager: CommandPaletteManager;
    analyticsService: AnalyticsService;
    aiAssistantService: AIAssistantService;
}> {
    const factory = ManagerFactory.getInstance({
        context,
    });

    const errorBoundary = await factory.createManager<ErrorBoundary>('error-boundary');
    const configService = await factory.createManager<ConfigurationService>('config');
    const loggingManager = await factory.createManager<LoggingManager>('logging');
    const processManager = await factory.createManager<ProcessManager>('process');
    const webViewManager = await factory.createManager<WebViewManager>('webview');
    const commandPaletteManager = await factory.createManager<CommandPaletteManager>('command-palette');
    
    // Analytics requires logging and config to be initialized first
    factory.config.loggingManager = loggingManager;
    factory.config.configService = configService;
    const analyticsService = await factory.createManager<AnalyticsService>('analytics');
    
    // AI Assistant requires analytics, logging and config to be initialized first
    const aiAssistantService = await factory.createManager<AIAssistantService>('ai-assistant');

    return {
        factory,
        errorBoundary,
        configService,
        loggingManager,
        processManager,
        webViewManager,
        commandPaletteManager,
        analyticsService,
        aiAssistantService
    };
}
