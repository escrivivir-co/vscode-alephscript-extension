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
exports.CategoryLogger = exports.LoggingManager = exports.LogCategory = exports.LogLevel = void 0;
exports.createLogger = createLogger;
const vscode = __importStar(require("vscode"));
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 4] = "TRACE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var LogCategory;
(function (LogCategory) {
    LogCategory["GENERAL"] = "general";
    LogCategory["PROCESS"] = "process";
    LogCategory["TERMINAL"] = "terminal";
    LogCategory["MCP"] = "mcp";
    LogCategory["SOCKET"] = "socket";
    LogCategory["CONFIG"] = "config";
    LogCategory["UI"] = "ui";
    LogCategory["WEBVIEW"] = "webview";
    LogCategory["EXTENSION"] = "extension";
})(LogCategory || (exports.LogCategory = LogCategory = {}));
class LoggingManager {
    constructor() {
        this.outputChannels = new Map();
        this.logEntries = [];
        this.maxLogEntries = 10000;
        this.currentLogLevel = LogLevel.INFO;
        this.enabledCategories = new Set(Object.values(LogCategory));
        this.loggerOptions = {
            showTimestamp: true,
            showLevel: true,
            showCategory: true,
            showSource: true,
            maxEntries: 10000
        };
        this.initializeOutputChannels();
        this.loadConfiguration();
        // Listen for configuration changes
        vscode.workspace.onDidChangeConfiguration((event) => {
            if (event.affectsConfiguration('alephscript.logging')) {
                this.loadConfiguration();
            }
        });
    }
    static getInstance() {
        if (!LoggingManager.instance) {
            LoggingManager.instance = new LoggingManager();
        }
        return LoggingManager.instance;
    }
    initializeOutputChannels() {
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
    loadConfiguration() {
        const config = vscode.workspace.getConfiguration('alephscript.logging');
        this.currentLogLevel = this.parseLogLevel(config.get('level', 'info'));
        const enabledCats = config.get('enabledCategories', Object.values(LogCategory));
        this.enabledCategories = new Set(enabledCats);
        this.loggerOptions = {
            showTimestamp: config.get('showTimestamp', true),
            showLevel: config.get('showLevel', true),
            showCategory: config.get('showCategory', true),
            showSource: config.get('showSource', true),
            maxEntries: config.get('maxEntries', 10000)
        };
        this.maxLogEntries = this.loggerOptions.maxEntries;
    }
    parseLogLevel(level) {
        switch (level.toLowerCase()) {
            case 'error': return LogLevel.ERROR;
            case 'warn': return LogLevel.WARN;
            case 'info': return LogLevel.INFO;
            case 'debug': return LogLevel.DEBUG;
            case 'trace': return LogLevel.TRACE;
            default: return LogLevel.INFO;
        }
    }
    setLogLevel(level) {
        this.currentLogLevel = level;
    }
    /**
     * Sets log level from string value
     */
    setLogLevelFromString(level) {
        this.currentLogLevel = this.parseLogLevel(level);
    }
    setEnabledCategories(categories) {
        this.enabledCategories = new Set(categories);
    }
    toggleCategory(category) {
        if (this.enabledCategories.has(category)) {
            this.enabledCategories.delete(category);
        }
        else {
            this.enabledCategories.add(category);
        }
    }
    log(level, category, message, source, data) {
        // Check if logging is enabled for this level and category
        if (level > this.currentLogLevel || !this.enabledCategories.has(category)) {
            return;
        }
        const logEntry = {
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
    formatLogMessage(entry) {
        const parts = [];
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
    error(category, message, source, data) {
        this.log(LogLevel.ERROR, category, message, source, data);
    }
    warn(category, message, source, data) {
        this.log(LogLevel.WARN, category, message, source, data);
    }
    info(category, message, source, data) {
        this.log(LogLevel.INFO, category, message, source, data);
    }
    debug(category, message, source, data) {
        this.log(LogLevel.DEBUG, category, message, source, data);
    }
    trace(category, message, source, data) {
        this.log(LogLevel.TRACE, category, message, source, data);
    }
    // Channel management methods
    showChannel(category) {
        const channel = this.outputChannels.get(category);
        channel?.show();
    }
    clearChannel(category) {
        const channel = this.outputChannels.get(category);
        channel?.clear();
    }
    clearAllChannels() {
        for (const channel of this.outputChannels.values()) {
            channel.clear();
        }
        this.logEntries = [];
    }
    // Export logs functionality
    getLogEntries(category, level, since) {
        return this.logEntries.filter(entry => {
            if (category && entry.category !== category)
                return false;
            if (level !== undefined && entry.level > level)
                return false;
            if (since && new Date(entry.timestamp) < since)
                return false;
            return true;
        });
    }
    async exportLogs(uri) {
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
        }
        else {
            const defaultUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders?.[0]?.uri || vscode.Uri.file('.'), `alephscript-logs-${new Date().toISOString().split('T')[0]}.json`);
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
    getLogStats() {
        const stats = {
            totalEntries: this.logEntries.length,
            levelBreakdown: {},
            categoryBreakdown: {},
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
    dispose() {
        for (const channel of this.outputChannels.values()) {
            channel.dispose();
        }
        this.outputChannels.clear();
        this.logEntries = [];
    }
}
exports.LoggingManager = LoggingManager;
// Create category-specific logger interfaces for easier use
class CategoryLogger {
    constructor(category, source, loggingManager = LoggingManager.getInstance()) {
        this.category = category;
        this.source = source;
        this.loggingManager = loggingManager;
    }
    error(message, data) {
        this.loggingManager.error(this.category, message, this.source, data);
    }
    warn(message, data) {
        this.loggingManager.warn(this.category, message, this.source, data);
    }
    info(message, data) {
        this.loggingManager.info(this.category, message, this.source, data);
    }
    debug(message, data) {
        this.loggingManager.debug(this.category, message, this.source, data);
    }
    trace(message, data) {
        this.loggingManager.trace(this.category, message, this.source, data);
    }
}
exports.CategoryLogger = CategoryLogger;
// Factory function for easy logger creation
function createLogger(category, source) {
    return new CategoryLogger(category, source);
}
//# sourceMappingURL=loggingManager.js.map