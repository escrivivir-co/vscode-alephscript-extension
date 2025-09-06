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
exports.errorBoundary = exports.ErrorBoundary = exports.ErrorSeverity = void 0;
exports.safeAsync = safeAsync;
exports.safe = safe;
const vscode = __importStar(require("vscode"));
const loggingManager_1 = require("../loggingManager");
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity[ErrorSeverity["LOW"] = 0] = "LOW";
    ErrorSeverity[ErrorSeverity["MEDIUM"] = 1] = "MEDIUM";
    ErrorSeverity[ErrorSeverity["HIGH"] = 2] = "HIGH";
    ErrorSeverity[ErrorSeverity["CRITICAL"] = 3] = "CRITICAL";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
class ErrorBoundary {
    constructor() {
        this.errorHistory = [];
        this.maxHistorySize = 100;
        this.loggingManager = loggingManager_1.LoggingManager.getInstance();
    }
    static getInstance() {
        if (!ErrorBoundary.instance) {
            ErrorBoundary.instance = new ErrorBoundary();
        }
        return ErrorBoundary.instance;
    }
    /**
     * Handles an error with comprehensive logging and user notification
     */
    async handleError(error, source, category = loggingManager_1.LogCategory.GENERAL, options = {}) {
        const alephError = this.createAlephScriptError(error, source, category);
        // Add to history
        this.addToHistory(alephError);
        // Log the error
        this.logError(alephError, options.logLevel || loggingManager_1.LogLevel.ERROR);
        // Show to user if requested
        if (options.showToUser !== false) {
            await this.showErrorToUser(alephError, options);
        }
        // Execute fallback action if provided
        if (options.fallbackAction) {
            try {
                await options.fallbackAction();
            }
            catch (fallbackError) {
                // Prevent infinite recursion by not showing fallback errors to user
                this.handleError(fallbackError, `${source}:fallback`, category, {
                    showToUser: false
                });
            }
        }
    }
    /**
     * Wraps an async function with error handling
     */
    async wrapAsync(fn, source, category = loggingManager_1.LogCategory.GENERAL, options = {}) {
        try {
            return await fn();
        }
        catch (error) {
            await this.handleError(error, source, category, options);
            return undefined;
        }
    }
    /**
     * Wraps a sync function with error handling
     */
    wrap(fn, source, category = loggingManager_1.LogCategory.GENERAL, options = {}) {
        try {
            return fn();
        }
        catch (error) {
            this.handleError(error, source, category, options);
            return undefined;
        }
    }
    /**
     * Creates a standardized error object
     */
    createAlephScriptError(error, source, category) {
        const isErrorObject = error instanceof Error;
        const message = isErrorObject ? error.message : error;
        return {
            code: this.generateErrorCode(source, category),
            message,
            severity: this.determineSeverity(message, category),
            category,
            source,
            timestamp: new Date(),
            stack: isErrorObject ? error.stack : undefined,
            data: isErrorObject ? { name: error.name } : undefined
        };
    }
    /**
     * Generates a unique error code for tracking
     */
    generateErrorCode(source, category) {
        const timestamp = Date.now().toString(36);
        const sourceCode = source.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
        const categoryCode = category.slice(0, 3).toUpperCase();
        return `AS_${categoryCode}_${sourceCode}_${timestamp}`;
    }
    /**
     * Determines error severity based on message and category
     */
    determineSeverity(message, category) {
        const criticalKeywords = ['fatal', 'critical', 'crash', 'corruption'];
        const highKeywords = ['failed to start', 'connection lost', 'timeout'];
        const mediumKeywords = ['warning', 'deprecated', 'retry'];
        const lowerMessage = message.toLowerCase();
        if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return ErrorSeverity.CRITICAL;
        }
        if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return ErrorSeverity.HIGH;
        }
        if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) {
            return ErrorSeverity.MEDIUM;
        }
        // Category-based severity
        switch (category) {
            case loggingManager_1.LogCategory.PROCESS:
            case loggingManager_1.LogCategory.MCP:
                return ErrorSeverity.HIGH;
            case loggingManager_1.LogCategory.WEBVIEW:
            case loggingManager_1.LogCategory.UI:
                return ErrorSeverity.MEDIUM;
            default:
                return ErrorSeverity.LOW;
        }
    }
    /**
     * Logs the error using the logging manager
     */
    logError(error, logLevel) {
        const logMessage = `[${error.code}] ${error.message}`;
        const logData = {
            severity: ErrorSeverity[error.severity],
            source: error.source,
            timestamp: error.timestamp.toISOString(),
            stack: error.stack,
            ...error.data
        };
        this.loggingManager.log(logLevel, error.category, logMessage, error.source, logData);
    }
    /**
     * Shows error to user based on severity
     */
    async showErrorToUser(error, options) {
        const userMessage = this.createUserFriendlyMessage(error);
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                const criticalResult = await vscode.window.showErrorMessage(`Critical Error: ${userMessage}`, 'Show Details', 'Restart Extension');
                if (criticalResult === 'Show Details') {
                    this.showErrorDetails(error);
                }
                else if (criticalResult === 'Restart Extension') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
                break;
            case ErrorSeverity.HIGH:
                const highResult = await vscode.window.showErrorMessage(userMessage, 'Show Details', ...(options.retryable ? ['Retry'] : []));
                if (highResult === 'Show Details') {
                    this.showErrorDetails(error);
                }
                // Retry logic would be handled by caller
                break;
            case ErrorSeverity.MEDIUM:
                await vscode.window.showWarningMessage(userMessage, 'Show Details');
                break;
            case ErrorSeverity.LOW:
                // Only show in status bar for low severity
                vscode.window.setStatusBarMessage(`⚠️ ${error.message.slice(0, 50)}...`, 5000);
                break;
        }
    }
    /**
     * Creates a user-friendly error message
     */
    createUserFriendlyMessage(error) {
        const commonErrors = {
            'ENOENT': 'File or directory not found',
            'EACCES': 'Permission denied',
            'ECONNREFUSED': 'Connection refused - service may not be running',
            'ETIMEDOUT': 'Operation timed out',
            'ENOTFOUND': 'Network address not found'
        };
        // Check for common error patterns
        for (const [pattern, friendlyMessage] of Object.entries(commonErrors)) {
            if (error.message.includes(pattern)) {
                return `${friendlyMessage}. ${this.getSuggestion(error)}`;
            }
        }
        // Return original message with suggestion
        return `${error.message}. ${this.getSuggestion(error)}`;
    }
    /**
     * Provides suggestions based on error context
     */
    getSuggestion(error) {
        switch (error.category) {
            case loggingManager_1.LogCategory.PROCESS:
                return 'Try restarting the process or check if the executable exists.';
            case loggingManager_1.LogCategory.MCP:
                return 'Verify MCP server configuration and network connectivity.';
            case loggingManager_1.LogCategory.WEBVIEW:
                return 'Try refreshing the webview or restarting the extension.';
            case loggingManager_1.LogCategory.CONFIG:
                return 'Check configuration file format and required fields.';
            default:
                return 'Check the logs for more details.';
        }
    }
    /**
     * Shows detailed error information
     */
    async showErrorDetails(error) {
        const details = `
Error Code: ${error.code}
Time: ${error.timestamp.toLocaleString()}
Source: ${error.source}
Category: ${error.category}
Severity: ${ErrorSeverity[error.severity]}

Message: ${error.message}

${error.stack ? `Stack Trace:\n${error.stack}` : ''}

${error.data ? `Additional Data:\n${JSON.stringify(error.data, null, 2)}` : ''}
        `.trim();
        const document = await vscode.workspace.openTextDocument({
            content: details,
            language: 'text'
        });
        await vscode.window.showTextDocument(document, { preview: true });
    }
    /**
     * Adds error to history
     */
    addToHistory(error) {
        this.errorHistory.unshift(error);
        // Keep history size manageable
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
        }
    }
    /**
     * Gets error history
     */
    getErrorHistory() {
        return [...this.errorHistory];
    }
    /**
     * Gets error statistics
     */
    getErrorStats() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const bySeverity = {
            [ErrorSeverity.LOW]: 0,
            [ErrorSeverity.MEDIUM]: 0,
            [ErrorSeverity.HIGH]: 0,
            [ErrorSeverity.CRITICAL]: 0
        };
        const byCategory = {
            [loggingManager_1.LogCategory.GENERAL]: 0,
            [loggingManager_1.LogCategory.PROCESS]: 0,
            [loggingManager_1.LogCategory.TERMINAL]: 0,
            [loggingManager_1.LogCategory.MCP]: 0,
            [loggingManager_1.LogCategory.SOCKET]: 0,
            [loggingManager_1.LogCategory.CONFIG]: 0,
            [loggingManager_1.LogCategory.UI]: 0,
            [loggingManager_1.LogCategory.WEBVIEW]: 0,
            [loggingManager_1.LogCategory.EXTENSION]: 0
        };
        let recent = 0;
        this.errorHistory.forEach(error => {
            bySeverity[error.severity]++;
            byCategory[error.category]++;
            if (error.timestamp > oneHourAgo) {
                recent++;
            }
        });
        return {
            total: this.errorHistory.length,
            bySeverity,
            byCategory,
            recent
        };
    }
    /**
     * Clears error history
     */
    clearHistory() {
        this.errorHistory = [];
    }
    /**
     * Disposes the error boundary
     */
    dispose() {
        this.clearHistory();
    }
}
exports.ErrorBoundary = ErrorBoundary;
// Convenience functions for common error handling patterns
exports.errorBoundary = ErrorBoundary.getInstance();
async function safeAsync(fn, source, category = loggingManager_1.LogCategory.GENERAL) {
    return exports.errorBoundary.wrapAsync(fn, source, category);
}
function safe(fn, source, category = loggingManager_1.LogCategory.GENERAL) {
    return exports.errorBoundary.wrap(fn, source, category);
}
//# sourceMappingURL=errorBoundary.js.map