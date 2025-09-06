import * as vscode from 'vscode';

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4
}

export enum LogCategory {
    GENERAL = 'general',
    PROCESS = 'process',
    TERMINAL = 'terminal',
    MCP = 'mcp',
    SOCKET = 'socket',
    CONFIG = 'config',
    UI = 'ui',
    WEBVIEW = 'webview',
    EXTENSION = 'extension'
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: LogCategory;
    message: string;
    source?: string;
    data?: any;
}

export interface LoggerOptions {
    showTimestamp?: boolean;
    showLevel?: boolean;
    showCategory?: boolean;
    showSource?: boolean;
    maxEntries?: number;
}

export class LoggingManager {
    private static instance: LoggingManager;
    private outputChannels: Map<LogCategory | 'main', vscode.OutputChannel> = new Map();
    private logEntries: LogEntry[] = [];
    private maxLogEntries: number = 10000;
    private currentLogLevel: LogLevel = LogLevel.INFO;
    private enabledCategories: Set<LogCategory> = new Set(Object.values(LogCategory));
    private loggerOptions: LoggerOptions = {
        showTimestamp: true,
        showLevel: true,
        showCategory: true,
        showSource: true,
        maxEntries: 10000
    };

    private constructor() {
        this.initializeOutputChannels();
        this.loadConfiguration();
        
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('alephscript.logging')) {
                this.loadConfiguration();
            }
        });
    }

    public static getInstance(): LoggingManager {
        if (!LoggingManager.instance) {
            LoggingManager.instance = new LoggingManager();
        }
        return LoggingManager.instance;
    }

    private initializeOutputChannels(): void {
        // Main aggregated log channel
        this.outputChannels.set('main', vscode.window.createOutputChannel('AlephScript - All Logs'));
        
        // Category-specific channels
        this.outputChannels.set(LogCategory.GENERAL, vscode.window.createOutputChannel('AlephScript - General'));
        this.outputChannels.set(LogCategory.PROCESS, vscode.window.createOutputChannel('AlephScript - Processes'));
        this.outputChannels.set(LogCategory.TERMINAL, vscode.window.createOutputChannel('AlephScript - Terminals'));
        this.outputChannels.set(LogCategory.MCP, vscode.window.createOutputChannel('AlephScript - MCP Servers'));
        this.outputChannels.set(LogCategory.SOCKET, vscode.window.createOutputChannel('AlephScript - Socket.IO'));
        this.outputChannels.set(LogCategory.CONFIG, vscode.window.createOutputChannel('AlephScript - Configuration'));
        this.outputChannels.set(LogCategory.UI, vscode.window.createOutputChannel('AlephScript - UI'));
        this.outputChannels.set(LogCategory.EXTENSION, vscode.window.createOutputChannel('AlephScript - Extension'));
    }

    private loadConfiguration(): void {
        const config = vscode.workspace.getConfiguration('alephscript.logging');
        
        this.currentLogLevel = this.parseLogLevel(config.get('level', 'info'));
        
        const enabledCats = config.get<string[]>('enabledCategories', Object.values(LogCategory));
        this.enabledCategories = new Set(enabledCats as LogCategory[]);
        
        this.loggerOptions = {
            showTimestamp: config.get('showTimestamp', true),
            showLevel: config.get('showLevel', true),
            showCategory: config.get('showCategory', true),
            showSource: config.get('showSource', true),
            maxEntries: config.get('maxEntries', 10000)
        };
        
        this.maxLogEntries = this.loggerOptions.maxEntries!;
    }

    private parseLogLevel(level: string): LogLevel {
        switch (level.toLowerCase()) {
            case 'error': return LogLevel.ERROR;
            case 'warn': return LogLevel.WARN;
            case 'info': return LogLevel.INFO;
            case 'debug': return LogLevel.DEBUG;
            case 'trace': return LogLevel.TRACE;
            default: return LogLevel.INFO;
        }
    }

    public setLogLevel(level: LogLevel): void {
        this.currentLogLevel = level;
    }

    /**
     * Sets log level from string value
     */
    public setLogLevelFromString(level: string): void {
        this.currentLogLevel = this.parseLogLevel(level);
    }

    public setEnabledCategories(categories: LogCategory[]): void {
        this.enabledCategories = new Set(categories);
    }

    public toggleCategory(category: LogCategory): void {
        if (this.enabledCategories.has(category)) {
            this.enabledCategories.delete(category);
        } else {
            this.enabledCategories.add(category);
        }
    }

    public log(level: LogLevel, category: LogCategory, message: string, source?: string, data?: any): void {
        // Check if logging is enabled for this level and category
        if (level > this.currentLogLevel || !this.enabledCategories.has(category)) {
            return;
        }

        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            category,
            message,
            source,
            data
        };

        // Add to in-memory log
        this.logEntries.push(logEntry);
        
        // Trim log entries if necessary
        if (this.logEntries.length > this.maxLogEntries) {
            this.logEntries = this.logEntries.slice(-this.maxLogEntries);
        }

        // Format and output to channels
        const formattedMessage = this.formatLogMessage(logEntry);
        
        // Output to main channel
        const mainChannel = this.outputChannels.get('main');
        mainChannel?.appendLine(formattedMessage);
        
        // Output to category-specific channel
        const categoryChannel = this.outputChannels.get(category);
        categoryChannel?.appendLine(formattedMessage);
    }

    private formatLogMessage(entry: LogEntry): string {
        const parts: string[] = [];
        
        if (this.loggerOptions.showTimestamp) {
            const timestamp = new Date(entry.timestamp).toLocaleTimeString();
            parts.push(`[${timestamp}]`);
        }
        
        if (this.loggerOptions.showLevel) {
            const levelName = LogLevel[entry.level];
            parts.push(`[${levelName}]`);
        }
        
        if (this.loggerOptions.showCategory) {
            parts.push(`[${entry.category.toUpperCase()}]`);
        }
        
        if (this.loggerOptions.showSource && entry.source) {
            parts.push(`[${entry.source}]`);
        }
        
        parts.push(entry.message);
        
        let formatted = parts.join(' ');
        
        // Add data if present
        if (entry.data) {
            formatted += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
        }
        
        return formatted;
    }

    // Convenience methods for different log levels
    public error(category: LogCategory, message: string, source?: string, data?: any): void {
        this.log(LogLevel.ERROR, category, message, source, data);
    }

    public warn(category: LogCategory, message: string, source?: string, data?: any): void {
        this.log(LogLevel.WARN, category, message, source, data);
    }

    public info(category: LogCategory, message: string, source?: string, data?: any): void {
        this.log(LogLevel.INFO, category, message, source, data);
    }

    public debug(category: LogCategory, message: string, source?: string, data?: any): void {
        this.log(LogLevel.DEBUG, category, message, source, data);
    }

    public trace(category: LogCategory, message: string, source?: string, data?: any): void {
        this.log(LogLevel.TRACE, category, message, source, data);
    }

    // Channel management methods
    public showChannel(category: LogCategory | 'main'): void {
        const channel = this.outputChannels.get(category);
        channel?.show();
    }

    public clearChannel(category: LogCategory | 'main'): void {
        const channel = this.outputChannels.get(category);
        channel?.clear();
    }

    public clearAllChannels(): void {
        for (const channel of this.outputChannels.values()) {
            channel.clear();
        }
        this.logEntries = [];
    }

    // Export logs functionality
    public getLogEntries(
        category?: LogCategory,
        level?: LogLevel,
        since?: Date
    ): LogEntry[] {
        return this.logEntries.filter(entry => {
            if (category && entry.category !== category) return false;
            if (level !== undefined && entry.level > level) return false;
            if (since && new Date(entry.timestamp) < since) return false;
            return true;
        });
    }

    public async exportLogs(uri?: vscode.Uri): Promise<void> {
        const logData = {
            exportDate: new Date().toISOString(),
            configuration: {
                logLevel: LogLevel[this.currentLogLevel],
                enabledCategories: Array.from(this.enabledCategories),
                options: this.loggerOptions
            },
            entries: this.logEntries
        };

        const content = JSON.stringify(logData, null, 2);

        if (uri) {
            await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
        } else {
            const defaultUri = vscode.Uri.joinPath(
                vscode.workspace.workspaceFolders?.[0]?.uri || vscode.Uri.file('.'),
                `alephscript-logs-${new Date().toISOString().split('T')[0]}.json`
            );
            
            const selectedUri = await vscode.window.showSaveDialog({
                defaultUri,
                filters: { 'JSON Files': ['json'] }
            });

            if (selectedUri) {
                await vscode.workspace.fs.writeFile(selectedUri, Buffer.from(content, 'utf8'));
                vscode.window.showInformationMessage(`Logs exported to: ${selectedUri.fsPath}`);
            }
        }
    }

    // Statistics and monitoring
    public getLogStats(): { [key: string]: any } {
        const stats = {
            totalEntries: this.logEntries.length,
            levelBreakdown: {} as { [key: string]: number },
            categoryBreakdown: {} as { [key: string]: number },
            oldestEntry: this.logEntries[0]?.timestamp,
            newestEntry: this.logEntries[this.logEntries.length - 1]?.timestamp
        };

        // Calculate breakdowns
        for (const entry of this.logEntries) {
            const levelName = LogLevel[entry.level];
            stats.levelBreakdown[levelName] = (stats.levelBreakdown[levelName] || 0) + 1;
            stats.categoryBreakdown[entry.category] = (stats.categoryBreakdown[entry.category] || 0) + 1;
        }

        return stats;
    }

    public dispose(): void {
        for (const channel of this.outputChannels.values()) {
            channel.dispose();
        }
        this.outputChannels.clear();
        this.logEntries = [];
    }
}

// Create category-specific logger interfaces for easier use
export class CategoryLogger {
    constructor(
        private category: LogCategory,
        private source?: string,
        private loggingManager: LoggingManager = LoggingManager.getInstance()
    ) {}

    error(message: string, data?: any): void {
        this.loggingManager.error(this.category, message, this.source, data);
    }

    warn(message: string, data?: any): void {
        this.loggingManager.warn(this.category, message, this.source, data);
    }

    info(message: string, data?: any): void {
        this.loggingManager.info(this.category, message, this.source, data);
    }

    debug(message: string, data?: any): void {
        this.loggingManager.debug(this.category, message, this.source, data);
    }

    trace(message: string, data?: any): void {
        this.loggingManager.trace(this.category, message, this.source, data);
    }
}

// Factory function for easy logger creation
export function createLogger(category: LogCategory, source?: string): CategoryLogger {
    return new CategoryLogger(category, source);
}
