"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.configService = exports.ConfigurationService = void 0;
const vscode = __importStar(require("vscode"));
const loggingManager_1 = require("../loggingManager");
const errorBoundary_1 = require("./errorBoundary");
class ConfigurationService {
    constructor() {
        this.configSection = 'alephscript';
        this.configDefinitions = [
            // Logging
            {
                key: 'logging.level',
                type: 'string',
                defaultValue: 'info',
                description: 'Minimum log level to display',
                validation: (value) => ['error', 'warn', 'info', 'debug', 'trace'].includes(value) || 'Must be one of: error, warn, info, debug, trace'
            },
            {
                key: 'logging.enabledCategories',
                type: 'array',
                defaultValue: Object.values(loggingManager_1.LogCategory),
                description: 'Log categories to enable'
            },
            {
                key: 'logging.maxEntries',
                type: 'number',
                defaultValue: 10000,
                description: 'Maximum number of log entries to keep',
                validation: (value) => value > 0 && value <= 100000 || 'Must be between 1 and 100000'
            },
            {
                key: 'logging.showTimestamp',
                type: 'boolean',
                defaultValue: true,
                description: 'Show timestamps in log entries'
            },
            // Process
            {
                key: 'process.autoStart',
                type: 'boolean',
                defaultValue: false,
                description: 'Auto-start services when opening workspace'
            },
            {
                key: 'process.configPath',
                type: 'string',
                defaultValue: '',
                description: 'Path to the main configuration file'
            },
            {
                key: 'process.maxRetries',
                type: 'number',
                defaultValue: 3,
                description: 'Maximum number of retries for failed processes',
                validation: (value) => value >= 0 && value <= 10 || 'Must be between 0 and 10'
            },
            {
                key: 'process.timeout',
                type: 'number',
                defaultValue: 30000,
                description: 'Process startup timeout in milliseconds',
                validation: (value) => value >= 1000 && value <= 300000 || 'Must be between 1000 and 300000'
            },
            // WebView
            {
                key: 'webview.retainContextWhenHidden',
                type: 'boolean',
                defaultValue: true,
                description: 'Keep webview content when hidden'
            },
            {
                key: 'webview.enableScripts',
                type: 'boolean',
                defaultValue: true,
                description: 'Enable JavaScript in webviews'
            },
            {
                key: 'webview.basePort',
                type: 'number',
                defaultValue: 4200,
                description: 'Base port for webview servers',
                validation: (value) => value >= 1000 && value <= 65535 || 'Must be a valid port number (1000-65535)'
            },
            {
                key: 'webview.maxInstances',
                type: 'number',
                defaultValue: 10,
                description: 'Maximum number of concurrent webview instances',
                validation: (value) => value > 0 && value <= 50 || 'Must be between 1 and 50'
            },
            // MCP
            {
                key: 'mcp.serverTimeout',
                type: 'number',
                defaultValue: 5000,
                description: 'MCP server connection timeout in milliseconds',
                validation: (value) => value >= 1000 && value <= 60000 || 'Must be between 1000 and 60000'
            },
            {
                key: 'mcp.retryCount',
                type: 'number',
                defaultValue: 3,
                description: 'Number of retries for MCP operations',
                validation: (value) => value >= 0 && value <= 10 || 'Must be between 0 and 10'
            },
            {
                key: 'mcp.autoReconnect',
                type: 'boolean',
                defaultValue: true,
                description: 'Automatically reconnect to MCP servers on disconnect'
            },
            // UI
            {
                key: 'ui.theme',
                type: 'string',
                defaultValue: 'auto',
                description: 'UI theme preference',
                validation: (value) => ['auto', 'light', 'dark'].includes(value) || 'Must be one of: auto, light, dark'
            },
            {
                key: 'ui.animations',
                type: 'boolean',
                defaultValue: true,
                description: 'Enable UI animations'
            },
            {
                key: 'ui.compactMode',
                type: 'boolean',
                defaultValue: false,
                description: 'Use compact UI layout'
            },
            // Development
            {
                key: 'development.debugMode',
                type: 'boolean',
                defaultValue: false,
                description: 'Enable debug mode features'
            },
            {
                key: 'development.verboseLogging',
                type: 'boolean',
                defaultValue: false,
                description: 'Enable verbose logging output'
            },
            {
                key: 'development.hotReload',
                type: 'boolean',
                defaultValue: false,
                description: 'Enable hot reload for development'
            },
            // Analytics
            {
                key: 'analytics.enabled',
                type: 'boolean',
                defaultValue: true,
                description: 'Enable analytics data collection'
            },
            {
                key: 'analytics.trackPerformance',
                type: 'boolean',
                defaultValue: true,
                description: 'Track performance metrics'
            },
            {
                key: 'analytics.exportPath',
                type: 'string',
                defaultValue: '',
                description: 'Path for analytics data export (empty for default)'
            },
            {
                key: 'analytics.retentionDays',
                type: 'number',
                defaultValue: 30,
                description: 'How many days to retain analytics data',
                validation: (value) => value > 0 && value <= 365 || 'Must be between 1 and 365 days'
            }
        ];
        this.loggingManager = loggingManager_1.LoggingManager.getInstance();
        this.setupConfigurationWatcher();
    }
    static getInstance() {
        if (!ConfigurationService.instance) {
            ConfigurationService.instance = new ConfigurationService();
        }
        return ConfigurationService.instance;
    }
    /**
     * Gets a configuration value with type safety
     */
    get(key) {
        const config = vscode.workspace.getConfiguration(this.configSection);
        const definition = this.getDefinition(key);
        if (!definition) {
            this.loggingManager.log(loggingManager_1.LogLevel.WARN, loggingManager_1.LogCategory.CONFIG, `Unknown configuration key: ${key}`);
            return undefined;
        }
        const value = config.get(key, definition.defaultValue);
        // Validate the value
        const validationResult = this.validateValue(key, value);
        if (validationResult !== true) {
            this.loggingManager.log(loggingManager_1.LogLevel.WARN, loggingManager_1.LogCategory.CONFIG, `Invalid configuration value for ${key}: ${validationResult}. Using default.`);
            return definition.defaultValue;
        }
        return value;
    }
    /**
     * Sets a configuration value
     */
    async set(key, value, target = vscode.ConfigurationTarget.Workspace) {
        try {
            const config = vscode.workspace.getConfiguration(this.configSection);
            const validationResult = this.validateValue(key, value);
            if (validationResult !== true) {
                throw new Error(`Invalid configuration value: ${validationResult}`);
            }
            await config.update(key, value, target);
            this.loggingManager.log(loggingManager_1.LogLevel.INFO, loggingManager_1.LogCategory.CONFIG, `Configuration updated: ${key} = ${JSON.stringify(value)}`);
            return true;
        }
        catch (error) {
            await errorBoundary_1.errorBoundary.handleError(error, 'ConfigurationService.set', loggingManager_1.LogCategory.CONFIG);
            return false;
        }
    }
    /**
     * Gets multiple configuration values
     */
    getMultiple(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = this.get(key);
        }
        return result;
    }
    /**
     * Gets all configuration values
     */
    getAll() {
        const result = {};
        for (const definition of this.configDefinitions) {
            const key = definition.key;
            result[key] = this.get(key);
        }
        return result;
    }
    /**
     * Resets configuration to defaults
     */
    async resetToDefaults(target = vscode.ConfigurationTarget.Workspace) {
        await errorBoundary_1.errorBoundary.wrapAsync(async () => {
            const config = vscode.workspace.getConfiguration(this.configSection);
            for (const definition of this.configDefinitions) {
                await config.update(definition.key, undefined, target);
            }
            this.loggingManager.log(loggingManager_1.LogLevel.INFO, loggingManager_1.LogCategory.CONFIG, 'Configuration reset to defaults');
        }, 'ConfigurationService.resetToDefaults', loggingManager_1.LogCategory.CONFIG);
    }
    /**
     * Validates configuration values
     */
    validateConfiguration() {
        const errors = [];
        for (const definition of this.configDefinitions) {
            const value = this.get(definition.key);
            const validationResult = this.validateValue(definition.key, value);
            if (validationResult !== true) {
                errors.push(`${definition.key}: ${validationResult}`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    /**
     * Gets configuration schema for UI generation
     */
    getConfigurationSchema() {
        return [...this.configDefinitions];
    }
    /**
     * Exports configuration to JSON
     */
    exportConfiguration() {
        const config = this.getAll();
        return JSON.stringify(config, null, 2);
    }
    /**
     * Imports configuration from JSON
     */
    async importConfiguration(jsonString, target = vscode.ConfigurationTarget.Workspace) {
        try {
            const importedConfig = JSON.parse(jsonString);
            const validationResults = [];
            // Validate all imported values first
            for (const [key, value] of Object.entries(importedConfig)) {
                const validationResult = this.validateValue(key, value);
                if (validationResult !== true) {
                    validationResults.push(`${key}: ${validationResult}`);
                }
            }
            if (validationResults.length > 0) {
                throw new Error(`Validation errors: ${validationResults.join(', ')}`);
            }
            // Apply all valid configurations
            const config = vscode.workspace.getConfiguration(this.configSection);
            for (const [key, value] of Object.entries(importedConfig)) {
                await config.update(key, value, target);
            }
            this.loggingManager.log(loggingManager_1.LogLevel.INFO, loggingManager_1.LogCategory.CONFIG, 'Configuration imported successfully');
            return true;
        }
        catch (error) {
            await errorBoundary_1.errorBoundary.handleError(error, 'ConfigurationService.importConfiguration', loggingManager_1.LogCategory.CONFIG);
            return false;
        }
    }
    /**
     * Sets up configuration change watcher
     */
    setupConfigurationWatcher() {
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration(this.configSection)) {
                this.loggingManager.log(loggingManager_1.LogLevel.DEBUG, loggingManager_1.LogCategory.CONFIG, 'Configuration changed, reloading...');
                // Validate new configuration
                const validation = this.validateConfiguration();
                if (!validation.isValid) {
                    this.loggingManager.log(loggingManager_1.LogLevel.WARN, loggingManager_1.LogCategory.CONFIG, `Configuration validation errors: ${validation.errors.join(', ')}`);
                }
            }
        });
    }
    /**
     * Gets configuration definition by key
     */
    getDefinition(key) {
        return this.configDefinitions.find(def => def.key === key);
    }
    /**
     * Validates a configuration value
     */
    validateValue(key, value) {
        const definition = this.getDefinition(key);
        if (!definition) {
            return `Unknown configuration key: ${key}`;
        }
        // Check required fields
        if (definition.required && (value === undefined || value === null || value === '')) {
            return 'This field is required';
        }
        // Type validation
        const expectedType = definition.type;
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== expectedType && value !== undefined) {
            return `Expected ${expectedType} but got ${actualType}`;
        }
        // Custom validation
        if (definition.validation && value !== undefined) {
            const validationResult = definition.validation(value);
            if (validationResult !== true) {
                return validationResult;
            }
        }
        return true;
    }
    /**
     * Disposes the configuration service
     */
    dispose() {
        // Cleanup any resources if needed
        this.loggingManager.log(loggingManager_1.LogLevel.DEBUG, loggingManager_1.LogCategory.CONFIG, 'ConfigurationService disposed');
    }
}
exports.ConfigurationService = ConfigurationService;
// Convenience instance
exports.configService = ConfigurationService.getInstance();
//# sourceMappingURL=configurationService.js.map