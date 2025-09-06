import * as vscode from 'vscode';
import { LoggingManager, LogCategory, LogLevel } from '../loggingManager';
import { errorBoundary } from './errorBoundary';

export interface ConfigurationDefinition {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    defaultValue: any;
    description: string;
    required?: boolean;
    validation?: (value: any) => boolean | string;
}

export interface AlephScriptConfig {
    // Logging Configuration
    'logging.level': string;
    'logging.enabledCategories': string[];
    'logging.maxEntries': number;
    'logging.showTimestamp': boolean;

    // Process Configuration
    'process.autoStart': boolean;
    'process.configPath': string;
    'process.maxRetries': number;
    'process.timeout': number;

    // WebView Configuration
    'webview.retainContextWhenHidden': boolean;
    'webview.enableScripts': boolean;
    'webview.basePort': number;
    'webview.maxInstances': number;

    // MCP Configuration
    'mcp.serverTimeout': number;
    'mcp.retryCount': number;
    'mcp.autoReconnect': boolean;

    // UI Configuration
    'ui.theme': 'auto' | 'light' | 'dark';
    'ui.animations': boolean;
    'ui.compactMode': boolean;

    // Development Configuration
    'development.debugMode': boolean;
    'development.verboseLogging': boolean;
    'development.hotReload': boolean;

    // Analytics Configuration
    'analytics.enabled': boolean;
    'analytics.trackPerformance': boolean;
    'analytics.exportPath': string;
    'analytics.retentionDays': number;
}

export class ConfigurationService {
    private static instance: ConfigurationService;
    private readonly loggingManager: LoggingManager;
    private readonly configSection = 'alephscript';
    
    private readonly configDefinitions: ConfigurationDefinition[] = [
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
            defaultValue: Object.values(LogCategory),
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

    private constructor() {
        this.loggingManager = LoggingManager.getInstance();
        this.setupConfigurationWatcher();
    }

    static getInstance(): ConfigurationService {
        if (!ConfigurationService.instance) {
            ConfigurationService.instance = new ConfigurationService();
        }
        return ConfigurationService.instance;
    }

    /**
     * Gets a configuration value with type safety
     */
    get<K extends keyof AlephScriptConfig>(key: K): AlephScriptConfig[K] {
        const config = vscode.workspace.getConfiguration(this.configSection);
        const definition = this.getDefinition(key as string);
        
        if (!definition) {
            this.loggingManager.log(LogLevel.WARN, LogCategory.CONFIG, `Unknown configuration key: ${key}`);
            return undefined as any;
        }

        const value = config.get(key as string, definition.defaultValue);
        
        // Validate the value
        const validationResult = this.validateValue(key as string, value);
        if (validationResult !== true) {
            this.loggingManager.log(
                LogLevel.WARN, 
                LogCategory.CONFIG, 
                `Invalid configuration value for ${key}: ${validationResult}. Using default.`
            );
            return definition.defaultValue;
        }

        return value as AlephScriptConfig[K];
    }

    /**
     * Sets a configuration value
     */
    async set<K extends keyof AlephScriptConfig>(
        key: K, 
        value: AlephScriptConfig[K], 
        target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
    ): Promise<boolean> {
        try {
            const config = vscode.workspace.getConfiguration(this.configSection);
            const validationResult = this.validateValue(key as string, value);
            
            if (validationResult !== true) {
                throw new Error(`Invalid configuration value: ${validationResult}`);
            }

            await config.update(key as string, value, target);
            this.loggingManager.log(LogLevel.INFO, LogCategory.CONFIG, `Configuration updated: ${key} = ${JSON.stringify(value)}`);
            return true;
        } catch (error) {
            await errorBoundary.handleError(error as Error, 'ConfigurationService.set', LogCategory.CONFIG);
            return false;
        }
    }

    /**
     * Gets multiple configuration values
     */
    getMultiple<K extends keyof AlephScriptConfig>(keys: K[]): Partial<AlephScriptConfig> {
        const result: Partial<AlephScriptConfig> = {};
        
        for (const key of keys) {
            result[key] = this.get(key);
        }
        
        return result;
    }

    /**
     * Gets all configuration values
     */
    getAll(): any {
        const result: any = {};
        
        for (const definition of this.configDefinitions) {
            const key = definition.key;
            result[key] = this.get(key as keyof AlephScriptConfig);
        }
        
        return result;
    }

    /**
     * Resets configuration to defaults
     */
    async resetToDefaults(target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace): Promise<void> {
        await errorBoundary.wrapAsync(async () => {
            const config = vscode.workspace.getConfiguration(this.configSection);
            
            for (const definition of this.configDefinitions) {
                await config.update(definition.key, undefined, target);
            }
            
            this.loggingManager.log(LogLevel.INFO, LogCategory.CONFIG, 'Configuration reset to defaults');
        }, 'ConfigurationService.resetToDefaults', LogCategory.CONFIG);
    }

    /**
     * Validates configuration values
     */
    validateConfiguration(): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        
        for (const definition of this.configDefinitions) {
            const value = this.get(definition.key as keyof AlephScriptConfig);
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
    getConfigurationSchema(): ConfigurationDefinition[] {
        return [...this.configDefinitions];
    }

    /**
     * Exports configuration to JSON
     */
    exportConfiguration(): string {
        const config = this.getAll();
        return JSON.stringify(config, null, 2);
    }

    /**
     * Imports configuration from JSON
     */
    async importConfiguration(
        jsonString: string, 
        target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Workspace
    ): Promise<boolean> {
        try {
            const importedConfig = JSON.parse(jsonString);
            const validationResults: string[] = [];
            
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
            
            this.loggingManager.log(LogLevel.INFO, LogCategory.CONFIG, 'Configuration imported successfully');
            return true;
        } catch (error) {
            await errorBoundary.handleError(error as Error, 'ConfigurationService.importConfiguration', LogCategory.CONFIG);
            return false;
        }
    }

    /**
     * Sets up configuration change watcher
     */
    private setupConfigurationWatcher(): void {
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration(this.configSection)) {
                this.loggingManager.log(LogLevel.DEBUG, LogCategory.CONFIG, 'Configuration changed, reloading...');
                
                // Validate new configuration
                const validation = this.validateConfiguration();
                if (!validation.isValid) {
                    this.loggingManager.log(
                        LogLevel.WARN, 
                        LogCategory.CONFIG, 
                        `Configuration validation errors: ${validation.errors.join(', ')}`
                    );
                }
            }
        });
    }

    /**
     * Gets configuration definition by key
     */
    private getDefinition(key: string): ConfigurationDefinition | undefined {
        return this.configDefinitions.find(def => def.key === key);
    }

    /**
     * Validates a configuration value
     */
    private validateValue(key: string, value: any): boolean | string {
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
                return validationResult as string;
            }
        }

        return true;
    }

    /**
     * Disposes the configuration service
     */
    dispose(): void {
        // Cleanup any resources if needed
        this.loggingManager.log(LogLevel.DEBUG, LogCategory.CONFIG, 'ConfigurationService disposed');
    }
}

// Convenience instance
export const configService = ConfigurationService.getInstance();
