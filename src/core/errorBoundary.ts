import * as vscode from 'vscode';
import { LoggingManager, LogCategory, LogLevel } from '../loggingManager';

export enum ErrorSeverity {
    LOW = 0,
    MEDIUM = 1,
    HIGH = 2,
    CRITICAL = 3
}

export interface AlephScriptError {
    code: string;
    message: string;
    severity: ErrorSeverity;
    category: LogCategory;
    source: string;
    timestamp: Date;
    data?: any;
    stack?: string;
}

export interface ErrorHandlerOptions {
    showToUser?: boolean;
    logLevel?: LogLevel;
    retryable?: boolean;
    retryCount?: number;
    fallbackAction?: () => Promise<void>;
}

export class ErrorBoundary {
    private static instance: ErrorBoundary;
    private loggingManager: LoggingManager;
    private errorHistory: AlephScriptError[] = [];
    private readonly maxHistorySize: number = 100;

    private constructor() {
        this.loggingManager = LoggingManager.getInstance();
    }

    static getInstance(): ErrorBoundary {
        if (!ErrorBoundary.instance) {
            ErrorBoundary.instance = new ErrorBoundary();
        }
        return ErrorBoundary.instance;
    }

    /**
     * Handles an error with comprehensive logging and user notification
     */
    async handleError(
        error: Error | string,
        source: string,
        category: LogCategory = LogCategory.GENERAL,
        options: ErrorHandlerOptions = {}
    ): Promise<void> {
        const alephError = this.createAlephScriptError(error, source, category);
        
        // Add to history
        this.addToHistory(alephError);

        // Log the error
        this.logError(alephError, options.logLevel || LogLevel.ERROR);

        // Show to user if requested
        if (options.showToUser !== false) {
            await this.showErrorToUser(alephError, options);
        }

        // Execute fallback action if provided
        if (options.fallbackAction) {
            try {
                await options.fallbackAction();
            } catch (fallbackError) {
                // Prevent infinite recursion by not showing fallback errors to user
                this.handleError(fallbackError as Error, `${source}:fallback`, category, { 
                    showToUser: false 
                });
            }
        }
    }

    /**
     * Wraps an async function with error handling
     */
    async wrapAsync<T>(
        fn: () => Promise<T>,
        source: string,
        category: LogCategory = LogCategory.GENERAL,
        options: ErrorHandlerOptions = {}
    ): Promise<T | undefined> {
        try {
            return await fn();
        } catch (error) {
            await this.handleError(error as Error, source, category, options);
            return undefined;
        }
    }

    /**
     * Wraps a sync function with error handling
     */
    wrap<T>(
        fn: () => T,
        source: string,
        category: LogCategory = LogCategory.GENERAL,
        options: ErrorHandlerOptions = {}
    ): T | undefined {
        try {
            return fn();
        } catch (error) {
            this.handleError(error as Error, source, category, options);
            return undefined;
        }
    }

    /**
     * Creates a standardized error object
     */
    private createAlephScriptError(
        error: Error | string,
        source: string,
        category: LogCategory
    ): AlephScriptError {
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
    private generateErrorCode(source: string, category: LogCategory): string {
        const timestamp = Date.now().toString(36);
        const sourceCode = source.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
        const categoryCode = category.slice(0, 3).toUpperCase();
        return `AS_${categoryCode}_${sourceCode}_${timestamp}`;
    }

    /**
     * Determines error severity based on message and category
     */
    private determineSeverity(message: string, category: LogCategory): ErrorSeverity {
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
            case LogCategory.PROCESS:
            case LogCategory.MCP:
                return ErrorSeverity.HIGH;
            case LogCategory.WEBVIEW:
            case LogCategory.UI:
                return ErrorSeverity.MEDIUM;
            default:
                return ErrorSeverity.LOW;
        }
    }

    /**
     * Logs the error using the logging manager
     */
    private logError(error: AlephScriptError, logLevel: LogLevel): void {
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
    private async showErrorToUser(
        error: AlephScriptError,
        options: ErrorHandlerOptions
    ): Promise<void> {
        const userMessage = this.createUserFriendlyMessage(error);

        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                const criticalResult = await vscode.window.showErrorMessage(
                    `Critical Error: ${userMessage}`,
                    'Show Details',
                    'Restart Extension'
                );
                if (criticalResult === 'Show Details') {
                    this.showErrorDetails(error);
                } else if (criticalResult === 'Restart Extension') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
                break;

            case ErrorSeverity.HIGH:
                const highResult = await vscode.window.showErrorMessage(
                    userMessage,
                    'Show Details',
                    ...(options.retryable ? ['Retry'] : [])
                );
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
                vscode.window.setStatusBarMessage(
                    `⚠️ ${error.message.slice(0, 50)}...`,
                    5000
                );
                break;
        }
    }

    /**
     * Creates a user-friendly error message
     */
    private createUserFriendlyMessage(error: AlephScriptError): string {
        const commonErrors: { [key: string]: string } = {
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
    private getSuggestion(error: AlephScriptError): string {
        switch (error.category) {
            case LogCategory.PROCESS:
                return 'Try restarting the process or check if the executable exists.';
            case LogCategory.MCP:
                return 'Verify MCP server configuration and network connectivity.';
            case LogCategory.WEBVIEW:
                return 'Try refreshing the webview or restarting the extension.';
            case LogCategory.CONFIG:
                return 'Check configuration file format and required fields.';
            default:
                return 'Check the logs for more details.';
        }
    }

    /**
     * Shows detailed error information
     */
    private async showErrorDetails(error: AlephScriptError): Promise<void> {
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
    private addToHistory(error: AlephScriptError): void {
        this.errorHistory.unshift(error);
        
        // Keep history size manageable
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * Gets error history
     */
    getErrorHistory(): AlephScriptError[] {
        return [...this.errorHistory];
    }

    /**
     * Gets error statistics
     */
    getErrorStats(): {
        total: number;
        bySeverity: { [key in ErrorSeverity]: number };
        byCategory: { [key in LogCategory]: number };
        recent: number; // Last hour
    } {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const bySeverity = {
            [ErrorSeverity.LOW]: 0,
            [ErrorSeverity.MEDIUM]: 0,
            [ErrorSeverity.HIGH]: 0,
            [ErrorSeverity.CRITICAL]: 0
        };

        const byCategory = {
            [LogCategory.GENERAL]: 0,
            [LogCategory.PROCESS]: 0,
            [LogCategory.TERMINAL]: 0,
            [LogCategory.MCP]: 0,
            [LogCategory.SOCKET]: 0,
            [LogCategory.CONFIG]: 0,
            [LogCategory.UI]: 0,
            [LogCategory.WEBVIEW]: 0,
            [LogCategory.EXTENSION]: 0
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
    clearHistory(): void {
        this.errorHistory = [];
    }

    /**
     * Disposes the error boundary
     */
    dispose(): void {
        this.clearHistory();
    }
}

// Convenience functions for common error handling patterns
export const errorBoundary = ErrorBoundary.getInstance();

export async function safeAsync<T>(
    fn: () => Promise<T>,
    source: string,
    category: LogCategory = LogCategory.GENERAL
): Promise<T | undefined> {
    return errorBoundary.wrapAsync(fn, source, category);
}

export function safe<T>(
    fn: () => T,
    source: string,
    category: LogCategory = LogCategory.GENERAL
): T | undefined {
    return errorBoundary.wrap(fn, source, category);
}
