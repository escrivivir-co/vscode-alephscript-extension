"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerFactory = void 0;
exports.createStandardManagers = createStandardManagers;
const loggingManager_1 = require("../loggingManager");
const processManager_1 = require("../processManager");
const webViewManager_1 = require("../webViewManager");
const commandPaletteManager_1 = require("../commandPaletteManager");
const configurationService_1 = require("./configurationService");
const errorBoundary_1 = require("./errorBoundary");
const analyticsService_1 = require("./analyticsService");
const aiAssistantService_1 = require("./aiAssistantService");
class ManagerFactory {
    constructor(config) {
        this.managers = new Map();
        this.config = config;
    }
    static getInstance(config) {
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
    async createManager(managerType, options) {
        const managerId = managerType;
        // Return existing instance if available
        if (this.managers.has(managerId)) {
            return this.managers.get(managerId);
        }
        let manager;
        switch (managerType) {
            case 'logging':
                manager = loggingManager_1.LoggingManager.getInstance();
                break;
            case 'process':
                manager = processManager_1.ProcessManager.getInstance();
                break;
            case 'webview':
                manager = webViewManager_1.WebViewManager.getInstance(this.config.context);
                break;
            case 'command-palette':
                manager = commandPaletteManager_1.CommandPaletteManager.getInstance();
                break;
            case 'config':
                manager = configurationService_1.ConfigurationService.getInstance();
                break;
            case 'error-boundary':
                manager = errorBoundary_1.ErrorBoundary.getInstance();
                break;
            case 'analytics':
                if (!this.config.loggingManager || !this.config.configService) {
                    throw new Error('Analytics manager requires logging and config services');
                }
                manager = analyticsService_1.AnalyticsService.getInstance(this.config.loggingManager, this.config.configService);
                break;
            case 'ai-assistant':
                if (!this.config.loggingManager || !this.config.configService) {
                    throw new Error('AI Assistant manager requires logging and config services');
                }
                const analyticsService = this.managers.get('analytics');
                if (!analyticsService) {
                    throw new Error('AI Assistant manager requires analytics service to be initialized first');
                }
                manager = aiAssistantService_1.AIAssistantService.getInstance(this.config.loggingManager, this.config.configService, analyticsService);
                break;
            default:
                throw new Error(`Unknown manager type: ${managerType}`);
        }
        // Initialize async managers
        if (this.isAsyncManager(manager) && manager.initialize) {
            await manager.initialize();
        }
        this.managers.set(managerId, manager);
        return manager;
    }
    /**
     * Gets an existing manager instance
     */
    getManager(managerType) {
        return this.managers.get(managerType);
    }
    /**
     * Disposes a specific manager
     */
    async disposeManager(managerType) {
        const manager = this.managers.get(managerType);
        if (manager) {
            manager.dispose();
            this.managers.delete(managerType);
        }
    }
    /**
     * Disposes all managers in reverse order of creation
     */
    async disposeAll() {
        const managerEntries = Array.from(this.managers.entries()).reverse();
        for (const [managerId, manager] of managerEntries) {
            try {
                manager.dispose();
                this.managers.delete(managerId);
            }
            catch (error) {
                console.error(`Error disposing manager ${managerId}:`, error);
            }
        }
    }
    /**
     * Gets all active managers
     */
    getActiveManagers() {
        return Array.from(this.managers.keys());
    }
    /**
     * Checks if a manager is registered
     */
    hasManager(managerType) {
        return this.managers.has(managerType);
    }
    /**
     * Type guard for async managers
     */
    isAsyncManager(manager) {
        return 'initialize' in manager;
    }
    /**
     * Updates the configuration for all managers
     */
    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Notify managers about config change if they support it
        for (const [managerId, manager] of this.managers) {
            if ('updateConfig' in manager && typeof manager.updateConfig === 'function') {
                try {
                    await manager.updateConfig(this.config);
                }
                catch (error) {
                    console.error(`Error updating config for manager ${managerId}:`, error);
                }
            }
        }
    }
    /**
     * Gets health status of all managers
     */
    getHealthStatus() {
        const status = {};
        for (const [managerId, manager] of this.managers) {
            if ('getHealthStatus' in manager && typeof manager.getHealthStatus === 'function') {
                try {
                    status[managerId] = manager.getHealthStatus();
                }
                catch (error) {
                    status[managerId] = 'unhealthy';
                }
            }
            else {
                status[managerId] = 'unknown';
            }
        }
        return status;
    }
    /**
     * Reinitializes all managers
     */
    async reinitializeAll() {
        const managerTypes = Array.from(this.managers.keys());
        // Dispose all first
        await this.disposeAll();
        // Recreate all managers
        for (const managerType of managerTypes) {
            try {
                await this.createManager(managerType);
            }
            catch (error) {
                console.error(`Error reinitializing manager ${managerType}:`, error);
            }
        }
    }
}
exports.ManagerFactory = ManagerFactory;
/**
 * Convenience function to create the standard set of managers
 */
async function createStandardManagers(context) {
    const factory = ManagerFactory.getInstance({
        context,
    });
    const errorBoundary = await factory.createManager('error-boundary');
    const configService = await factory.createManager('config');
    const loggingManager = await factory.createManager('logging');
    const processManager = await factory.createManager('process');
    const webViewManager = await factory.createManager('webview');
    const commandPaletteManager = await factory.createManager('command-palette');
    // Analytics requires logging and config to be initialized first
    factory.config.loggingManager = loggingManager;
    factory.config.configService = configService;
    const analyticsService = await factory.createManager('analytics');
    // AI Assistant requires analytics, logging and config to be initialized first
    const aiAssistantService = await factory.createManager('ai-assistant');
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
//# sourceMappingURL=managerFactory.js.map