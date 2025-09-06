import * as vscode from 'vscode';
import { LoggingManager, LogCategory, LogLevel, createLogger } from '../loggingManager';
import { errorBoundary } from './errorBoundary';
import { ConfigurationService } from './configurationService';

/**
 * Analytics event types for tracking user interactions
 */
export enum AnalyticsEventType {
    EXTENSION_ACTIVATED = 'extension_activated',
    EXTENSION_DEACTIVATED = 'extension_deactivated',
    WEBVIEW_OPENED = 'webview_opened',
    WEBVIEW_CLOSED = 'webview_closed',
    COMMAND_EXECUTED = 'command_executed',
    CONFIGURATION_CHANGED = 'configuration_changed',
    ERROR_OCCURRED = 'error_occurred',
    PERFORMANCE_METRIC = 'performance_metric',
    USER_INTERACTION = 'user_interaction',
    PROCESS_STARTED = 'process_started',
    PROCESS_STOPPED = 'process_stopped'
}

/**
 * Analytics event data structure
 */
export interface AnalyticsEvent {
    type: AnalyticsEventType;
    timestamp: string;
    session_id: string;
    event_id: string;
    category: string;
    data: {
        [key: string]: any;
    };
    metadata?: {
        user_agent?: string;
        vs_code_version?: string;
        extension_version?: string;
        platform?: string;
        duration?: number;
        success?: boolean;
        error_type?: string;
    };
}

/**
 * Performance metrics structure
 */
export interface PerformanceMetric {
    operation: string;
    start_time: number;
    end_time: number;
    duration: number;
    memory_usage?: number;
    cpu_usage?: number;
    success: boolean;
    error?: string;
}

/**
 * Session information for analytics
 */
export interface AnalyticsSession {
    session_id: string;
    start_time: string;
    end_time?: string;
    events_count: number;
    total_duration?: number;
    user_actions: number;
    errors_count: number;
}

/**
 * Analytics aggregation results
 */
export interface AnalyticsAggregation {
    most_used_commands: Array<{ command: string; count: number; percentage: number }>;
    most_opened_webviews: Array<{ webview: string; count: number; avg_duration: number }>;
    error_frequency: Array<{ error_type: string; count: number; last_occurrence: string }>;
    performance_summary: {
        avg_startup_time: number;
        avg_command_execution_time: number;
        memory_usage_trend: number[];
        slowest_operations: Array<{ operation: string; avg_duration: number }>;
    };
    usage_patterns: {
        peak_usage_hours: number[];
        most_active_days: string[];
        session_duration_avg: number;
    };
}

/**
 * Analytics Service for tracking user behavior and system performance
 */
export class AnalyticsService {
    private static instance: AnalyticsService;
    private currentSession: AnalyticsSession;
    private events: AnalyticsEvent[] = [];
    private performanceMetrics: PerformanceMetric[] = [];
    private loggingManager: LoggingManager;
    private configService: ConfigurationService;
    private logger: ReturnType<typeof createLogger>;
    private sessionStartTime: number;
    private eventCounter: number = 0;
    private readonly maxEvents: number = 10000;
    private readonly maxMetrics: number = 5000;

    private constructor(
        loggingManager: LoggingManager,
        configService: ConfigurationService
    ) {
        this.loggingManager = loggingManager;
        this.configService = configService;
        this.logger = createLogger(LogCategory.EXTENSION, 'AnalyticsService');
        this.sessionStartTime = Date.now();
        this.currentSession = this.initializeSession();
        
        this.logger.info('AnalyticsService initialized');
    }

    /**
     * Get singleton instance
     */
    static getInstance(
        loggingManager?: LoggingManager,
        configService?: ConfigurationService
    ): AnalyticsService {
        if (!AnalyticsService.instance) {
            if (!loggingManager || !configService) {
                throw new Error('AnalyticsService requires LoggingManager and ConfigurationService for first initialization');
            }
            AnalyticsService.instance = new AnalyticsService(loggingManager, configService);
        }
        return AnalyticsService.instance;
    }

    /**
     * Initialize new analytics session
     */
    private initializeSession(): AnalyticsSession {
        return {
            session_id: this.generateSessionId(),
            start_time: new Date().toISOString(),
            events_count: 0,
            user_actions: 0,
            errors_count: 0
        };
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `session_${timestamp}_${random}`;
    }

    /**
     * Generate unique event ID
     */
    private generateEventId(): string {
        this.eventCounter++;
        return `evt_${this.currentSession.session_id}_${this.eventCounter}`;
    }

    /**
     * Track an analytics event
     */
    async trackEvent(
        type: AnalyticsEventType,
        category: string,
        data: { [key: string]: any } = {},
        metadata: AnalyticsEvent['metadata'] = {}
    ): Promise<void> {
        return await errorBoundary.wrapAsync(async () => {
            // Check if analytics is enabled
            if (!this.configService.get('analytics.enabled')) {
                return;
            }

            const event: AnalyticsEvent = {
                type,
                timestamp: new Date().toISOString(),
                session_id: this.currentSession.session_id,
                event_id: this.generateEventId(),
                category,
                data: {
                    ...data,
                    session_duration: Date.now() - this.sessionStartTime
                },
                metadata: {
                    vs_code_version: vscode.version,
                    extension_version: '1.0.0', // TODO: Get from package.json
                    platform: process.platform,
                    ...metadata
                }
            };

            this.events.push(event);
            this.currentSession.events_count++;

            if (type === AnalyticsEventType.USER_INTERACTION) {
                this.currentSession.user_actions++;
            }

            if (type === AnalyticsEventType.ERROR_OCCURRED) {
                this.currentSession.errors_count++;
            }

            // Rotate events if we reach max limit
            if (this.events.length > this.maxEvents) {
                this.events = this.events.slice(-Math.floor(this.maxEvents * 0.8));
                this.logger.debug(`Events rotated. New count: ${this.events.length}`);
            }

            this.logger.debug(`Event tracked: ${type} in category ${category}`);

        }, 'AnalyticsService.trackEvent', LogCategory.EXTENSION);
    }

    /**
     * Track performance metric
     */
    async trackPerformance(
        operation: string,
        startTime: number,
        success: boolean = true,
        error?: string,
        additionalData?: { [key: string]: any }
    ): Promise<void> {
        return await errorBoundary.wrapAsync(async () => {
            if (!this.configService.get('analytics.enabled')) {
                return;
            }

            const endTime = Date.now();
            const metric: PerformanceMetric = {
                operation,
                start_time: startTime,
                end_time: endTime,
                duration: endTime - startTime,
                memory_usage: process.memoryUsage().heapUsed,
                success,
                error
            };

            this.performanceMetrics.push(metric);

            // Also track as analytics event
            await this.trackEvent(
                AnalyticsEventType.PERFORMANCE_METRIC,
                'performance',
                {
                    operation,
                    duration: metric.duration,
                    success,
                    error,
                    ...additionalData
                }
            );

            // Rotate metrics if we reach max limit
            if (this.performanceMetrics.length > this.maxMetrics) {
                this.performanceMetrics = this.performanceMetrics.slice(-Math.floor(this.maxMetrics * 0.8));
            }

            this.logger.debug(`Performance tracked: ${operation} (${metric.duration}ms)`);

        }, 'AnalyticsService.trackPerformance', LogCategory.EXTENSION);
    }

    /**
     * Start tracking an operation (returns a function to end tracking)
     */
    startTracking(operation: string): (success?: boolean, error?: string) => Promise<void> {
        const startTime = Date.now();
        
        return async (success: boolean = true, error?: string) => {
            await this.trackPerformance(operation, startTime, success, error);
        };
    }

    /**
     * Get analytics aggregation
     */
    async getAnalyticsAggregation(): Promise<AnalyticsAggregation> {
        const result = await errorBoundary.wrapAsync(async (): Promise<AnalyticsAggregation> => {
            // Most used commands
            const commandEvents = this.events.filter(e => e.type === AnalyticsEventType.COMMAND_EXECUTED);
            const commandCounts = this.aggregateByField(commandEvents, 'data.command');
            const totalCommands = commandEvents.length;
            
            const most_used_commands = Object.entries(commandCounts)
                .map(([command, count]) => ({
                    command,
                    count: count as number,
                    percentage: Math.round((count as number / totalCommands) * 100)
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            // Most opened webviews
            const webviewEvents = this.events.filter(e => e.type === AnalyticsEventType.WEBVIEW_OPENED);
            const webviewCounts = this.aggregateByField(webviewEvents, 'data.webview_type');
            const webviewDurations = this.aggregateAverageByField(webviewEvents, 'data.webview_type', 'data.duration');
            
            const most_opened_webviews = Object.entries(webviewCounts)
                .map(([webview, count]) => ({
                    webview,
                    count: count as number,
                    avg_duration: webviewDurations[webview] || 0
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Error frequency
            const errorEvents = this.events.filter(e => e.type === AnalyticsEventType.ERROR_OCCURRED);
            const errorCounts = this.aggregateByField(errorEvents, 'data.error_type');
            const errorLastOccurrence = this.getLastOccurrenceByField(errorEvents, 'data.error_type');
            
            const error_frequency = Object.entries(errorCounts)
                .map(([error_type, count]) => ({
                    error_type,
                    count: count as number,
                    last_occurrence: errorLastOccurrence[error_type] || 'Unknown'
                }))
                .sort((a, b) => b.count - a.count);

            // Performance summary
            const successfulMetrics = this.performanceMetrics.filter(m => m.success);
            const startupMetrics = successfulMetrics.filter(m => m.operation.includes('startup'));
            const commandMetrics = successfulMetrics.filter(m => m.operation.includes('command'));
            
            const performance_summary = {
                avg_startup_time: this.calculateAverage(startupMetrics.map(m => m.duration)),
                avg_command_execution_time: this.calculateAverage(commandMetrics.map(m => m.duration)),
                memory_usage_trend: this.getMemoryUsageTrend(),
                slowest_operations: this.getSlowestOperations()
            };

            // Usage patterns
            const usage_patterns = {
                peak_usage_hours: this.getPeakUsageHours(),
                most_active_days: this.getMostActiveDays(),
                session_duration_avg: Date.now() - this.sessionStartTime
            };

            return {
                most_used_commands,
                most_opened_webviews,
                error_frequency,
                performance_summary,
                usage_patterns
            };

        }, 'AnalyticsService.getAnalyticsAggregation', LogCategory.EXTENSION);
        
        // Return default aggregation if error occurred
        return result || {
            most_used_commands: [],
            most_opened_webviews: [],
            error_frequency: [],
            performance_summary: {
                avg_startup_time: 0,
                avg_command_execution_time: 0,
                memory_usage_trend: [],
                slowest_operations: []
            },
            usage_patterns: {
                peak_usage_hours: [],
                most_active_days: [],
                session_duration_avg: 0
            }
        };
    }

    /**
     * Helper method to aggregate events by field
     */
    private aggregateByField(events: AnalyticsEvent[], fieldPath: string): { [key: string]: number } {
        const result: { [key: string]: number } = {};
        
        events.forEach(event => {
            const value = this.getNestedValue(event, fieldPath);
            if (value) {
                result[value] = (result[value] || 0) + 1;
            }
        });
        
        return result;
    }

    /**
     * Helper method to aggregate averages by field
     */
    private aggregateAverageByField(events: AnalyticsEvent[], groupField: string, valueField: string): { [key: string]: number } {
        const groups: { [key: string]: number[] } = {};
        
        events.forEach(event => {
            const groupValue = this.getNestedValue(event, groupField);
            const value = this.getNestedValue(event, valueField);
            
            if (groupValue && typeof value === 'number') {
                if (!groups[groupValue]) groups[groupValue] = [];
                groups[groupValue].push(value);
            }
        });
        
        const result: { [key: string]: number } = {};
        Object.entries(groups).forEach(([key, values]) => {
            result[key] = this.calculateAverage(values);
        });
        
        return result;
    }

    /**
     * Get last occurrence timestamp by field
     */
    private getLastOccurrenceByField(events: AnalyticsEvent[], fieldPath: string): { [key: string]: string } {
        const result: { [key: string]: string } = {};
        
        events.forEach(event => {
            const value = this.getNestedValue(event, fieldPath);
            if (value) {
                result[value] = event.timestamp;
            }
        });
        
        return result;
    }

    /**
     * Get nested value from object using dot notation
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Calculate average of number array
     */
    private calculateAverage(numbers: number[]): number {
        if (numbers.length === 0) return 0;
        return Math.round(numbers.reduce((sum, num) => sum + num, 0) / numbers.length);
    }

    /**
     * Get memory usage trend
     */
    private getMemoryUsageTrend(): number[] {
        const memoryMetrics = this.performanceMetrics
            .filter(m => m.memory_usage)
            .map(m => m.memory_usage!)
            .slice(-20); // Last 20 metrics
        
        return memoryMetrics;
    }

    /**
     * Get slowest operations
     */
    private getSlowestOperations(): Array<{ operation: string; avg_duration: number }> {
        const operationDurations: { [key: string]: number[] } = {};
        
        this.performanceMetrics.forEach(metric => {
            if (!operationDurations[metric.operation]) {
                operationDurations[metric.operation] = [];
            }
            operationDurations[metric.operation].push(metric.duration);
        });
        
        return Object.entries(operationDurations)
            .map(([operation, durations]) => ({
                operation,
                avg_duration: this.calculateAverage(durations)
            }))
            .sort((a, b) => b.avg_duration - a.avg_duration)
            .slice(0, 10);
    }

    /**
     * Get peak usage hours (mock implementation)
     */
    private getPeakUsageHours(): number[] {
        // This would analyze event timestamps to find peak hours
        // For now, return mock data
        return [9, 10, 11, 14, 15, 16];
    }

    /**
     * Get most active days (mock implementation)
     */
    private getMostActiveDays(): string[] {
        // This would analyze event timestamps to find most active days
        // For now, return mock data
        return ['Monday', 'Tuesday', 'Wednesday'];
    }

    /**
     * Export analytics data
     */
    async exportAnalytics(): Promise<string> {
        const result = await errorBoundary.wrapAsync(async (): Promise<string> => {
            const exportData = {
                session: this.currentSession,
                events: this.events,
                performance_metrics: this.performanceMetrics,
                aggregation: await this.getAnalyticsAggregation(),
                export_timestamp: new Date().toISOString()
            };
            
            return JSON.stringify(exportData, null, 2);
            
        }, 'AnalyticsService.exportAnalytics', LogCategory.EXTENSION);
        
        return result || '{}';
    }

    /**
     * Clear analytics data
     */
    async clearAnalytics(): Promise<void> {
        return await errorBoundary.wrapAsync(async () => {
            this.events = [];
            this.performanceMetrics = [];
            this.currentSession = this.initializeSession();
            this.sessionStartTime = Date.now();
            this.eventCounter = 0;
            
            this.logger.info('Analytics data cleared');
            
        }, 'AnalyticsService.clearAnalytics', LogCategory.EXTENSION);
    }

    /**
     * End current session
     */
    async endSession(): Promise<void> {
        await errorBoundary.wrapAsync(async () => {
            this.currentSession.end_time = new Date().toISOString();
            this.currentSession.total_duration = Date.now() - this.sessionStartTime;
            
            await this.trackEvent(
                AnalyticsEventType.EXTENSION_DEACTIVATED,
                'extension',
                {
                    session_duration: this.currentSession.total_duration,
                    events_count: this.currentSession.events_count,
                    user_actions: this.currentSession.user_actions,
                    errors_count: this.currentSession.errors_count
                }
            );
            
            this.logger.info(`Session ended: ${this.currentSession.session_id}`);
            
        }, 'AnalyticsService.endSession', LogCategory.EXTENSION);
    }

    /**
     * Dispose resources
     */
    dispose(): void {
        // Save analytics data if needed
        this.logger.info('AnalyticsService disposed');
    }

    /**
     * Generate HTML dashboard for analytics
     */
    async generateDashboard(): Promise<string> {
        const result = await errorBoundary.wrapAsync(async () => {
            const aggregation = await this.getAnalyticsAggregation();
            
            return '<html><body><h1>Analytics Dashboard</h1>' +
                   '<p>Total Events: ' + this.events.length + '</p>' +
                   '<p>Session ID: ' + this.currentSession.session_id + '</p>' +
                   '<p>User Actions: ' + this.currentSession.user_actions + '</p>' +
                   '<p>Errors Count: ' + this.currentSession.errors_count + '</p>' +
                   '<p>Average Command Execution Time: ' + aggregation.performance_summary.avg_command_execution_time + 'ms</p>' +
                   '</body></html>';
        }, 'AnalyticsService.generateDashboard', LogCategory.EXTENSION);
        
        return result || '<html><body><h1>Analytics Dashboard</h1><p>Error generating dashboard</p></body></html>';
    }
}
