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
exports.AnalyticsService = exports.AnalyticsEventType = void 0;
const vscode = __importStar(require("vscode"));
const loggingManager_1 = require("../loggingManager");
const errorBoundary_1 = require("./errorBoundary");
/**
 * Analytics event types for tracking user interactions
 */
var AnalyticsEventType;
(function (AnalyticsEventType) {
    AnalyticsEventType["EXTENSION_ACTIVATED"] = "extension_activated";
    AnalyticsEventType["EXTENSION_DEACTIVATED"] = "extension_deactivated";
    AnalyticsEventType["WEBVIEW_OPENED"] = "webview_opened";
    AnalyticsEventType["WEBVIEW_CLOSED"] = "webview_closed";
    AnalyticsEventType["COMMAND_EXECUTED"] = "command_executed";
    AnalyticsEventType["CONFIGURATION_CHANGED"] = "configuration_changed";
    AnalyticsEventType["ERROR_OCCURRED"] = "error_occurred";
    AnalyticsEventType["PERFORMANCE_METRIC"] = "performance_metric";
    AnalyticsEventType["USER_INTERACTION"] = "user_interaction";
    AnalyticsEventType["PROCESS_STARTED"] = "process_started";
    AnalyticsEventType["PROCESS_STOPPED"] = "process_stopped";
})(AnalyticsEventType || (exports.AnalyticsEventType = AnalyticsEventType = {}));
/**
 * Analytics Service for tracking user behavior and system performance
 */
class AnalyticsService {
    constructor(loggingManager, configService) {
        this.events = [];
        this.performanceMetrics = [];
        this.eventCounter = 0;
        this.maxEvents = 10000;
        this.maxMetrics = 5000;
        this.loggingManager = loggingManager;
        this.configService = configService;
        this.logger = (0, loggingManager_1.createLogger)(loggingManager_1.LogCategory.EXTENSION, 'AnalyticsService');
        this.sessionStartTime = Date.now();
        this.currentSession = this.initializeSession();
        this.logger.info('AnalyticsService initialized');
    }
    /**
     * Get singleton instance
     */
    static getInstance(loggingManager, configService) {
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
    initializeSession() {
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
    generateSessionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `session_${timestamp}_${random}`;
    }
    /**
     * Generate unique event ID
     */
    generateEventId() {
        this.eventCounter++;
        return `evt_${this.currentSession.session_id}_${this.eventCounter}`;
    }
    /**
     * Track an analytics event
     */
    async trackEvent(type, category, data = {}, metadata = {}) {
        return await errorBoundary_1.errorBoundary.wrapAsync(async () => {
            // Check if analytics is enabled
            if (!this.configService.get('analytics.enabled')) {
                return;
            }
            const event = {
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
        }, 'AnalyticsService.trackEvent', loggingManager_1.LogCategory.EXTENSION);
    }
    /**
     * Track performance metric
     */
    async trackPerformance(operation, startTime, success = true, error, additionalData) {
        return await errorBoundary_1.errorBoundary.wrapAsync(async () => {
            if (!this.configService.get('analytics.enabled')) {
                return;
            }
            const endTime = Date.now();
            const metric = {
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
            await this.trackEvent(AnalyticsEventType.PERFORMANCE_METRIC, 'performance', {
                operation,
                duration: metric.duration,
                success,
                error,
                ...additionalData
            });
            // Rotate metrics if we reach max limit
            if (this.performanceMetrics.length > this.maxMetrics) {
                this.performanceMetrics = this.performanceMetrics.slice(-Math.floor(this.maxMetrics * 0.8));
            }
            this.logger.debug(`Performance tracked: ${operation} (${metric.duration}ms)`);
        }, 'AnalyticsService.trackPerformance', loggingManager_1.LogCategory.EXTENSION);
    }
    /**
     * Start tracking an operation (returns a function to end tracking)
     */
    startTracking(operation) {
        const startTime = Date.now();
        return async (success = true, error) => {
            await this.trackPerformance(operation, startTime, success, error);
        };
    }
    /**
     * Get analytics aggregation
     */
    async getAnalyticsAggregation() {
        const result = await errorBoundary_1.errorBoundary.wrapAsync(async () => {
            // Most used commands
            const commandEvents = this.events.filter(e => e.type === AnalyticsEventType.COMMAND_EXECUTED);
            const commandCounts = this.aggregateByField(commandEvents, 'data.command');
            const totalCommands = commandEvents.length;
            const most_used_commands = Object.entries(commandCounts)
                .map(([command, count]) => ({
                command,
                count: count,
                percentage: Math.round((count / totalCommands) * 100)
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
                count: count,
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
                count: count,
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
        }, 'AnalyticsService.getAnalyticsAggregation', loggingManager_1.LogCategory.EXTENSION);
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
    aggregateByField(events, fieldPath) {
        const result = {};
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
    aggregateAverageByField(events, groupField, valueField) {
        const groups = {};
        events.forEach(event => {
            const groupValue = this.getNestedValue(event, groupField);
            const value = this.getNestedValue(event, valueField);
            if (groupValue && typeof value === 'number') {
                if (!groups[groupValue])
                    groups[groupValue] = [];
                groups[groupValue].push(value);
            }
        });
        const result = {};
        Object.entries(groups).forEach(([key, values]) => {
            result[key] = this.calculateAverage(values);
        });
        return result;
    }
    /**
     * Get last occurrence timestamp by field
     */
    getLastOccurrenceByField(events, fieldPath) {
        const result = {};
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
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    /**
     * Calculate average of number array
     */
    calculateAverage(numbers) {
        if (numbers.length === 0)
            return 0;
        return Math.round(numbers.reduce((sum, num) => sum + num, 0) / numbers.length);
    }
    /**
     * Get memory usage trend
     */
    getMemoryUsageTrend() {
        const memoryMetrics = this.performanceMetrics
            .filter(m => m.memory_usage)
            .map(m => m.memory_usage)
            .slice(-20); // Last 20 metrics
        return memoryMetrics;
    }
    /**
     * Get slowest operations
     */
    getSlowestOperations() {
        const operationDurations = {};
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
    getPeakUsageHours() {
        // This would analyze event timestamps to find peak hours
        // For now, return mock data
        return [9, 10, 11, 14, 15, 16];
    }
    /**
     * Get most active days (mock implementation)
     */
    getMostActiveDays() {
        // This would analyze event timestamps to find most active days
        // For now, return mock data
        return ['Monday', 'Tuesday', 'Wednesday'];
    }
    /**
     * Export analytics data
     */
    async exportAnalytics() {
        const result = await errorBoundary_1.errorBoundary.wrapAsync(async () => {
            const exportData = {
                session: this.currentSession,
                events: this.events,
                performance_metrics: this.performanceMetrics,
                aggregation: await this.getAnalyticsAggregation(),
                export_timestamp: new Date().toISOString()
            };
            return JSON.stringify(exportData, null, 2);
        }, 'AnalyticsService.exportAnalytics', loggingManager_1.LogCategory.EXTENSION);
        return result || '{}';
    }
    /**
     * Clear analytics data
     */
    async clearAnalytics() {
        return await errorBoundary_1.errorBoundary.wrapAsync(async () => {
            this.events = [];
            this.performanceMetrics = [];
            this.currentSession = this.initializeSession();
            this.sessionStartTime = Date.now();
            this.eventCounter = 0;
            this.logger.info('Analytics data cleared');
        }, 'AnalyticsService.clearAnalytics', loggingManager_1.LogCategory.EXTENSION);
    }
    /**
     * End current session
     */
    async endSession() {
        await errorBoundary_1.errorBoundary.wrapAsync(async () => {
            this.currentSession.end_time = new Date().toISOString();
            this.currentSession.total_duration = Date.now() - this.sessionStartTime;
            await this.trackEvent(AnalyticsEventType.EXTENSION_DEACTIVATED, 'extension', {
                session_duration: this.currentSession.total_duration,
                events_count: this.currentSession.events_count,
                user_actions: this.currentSession.user_actions,
                errors_count: this.currentSession.errors_count
            });
            this.logger.info(`Session ended: ${this.currentSession.session_id}`);
        }, 'AnalyticsService.endSession', loggingManager_1.LogCategory.EXTENSION);
    }
    /**
     * Dispose resources
     */
    dispose() {
        // Save analytics data if needed
        this.logger.info('AnalyticsService disposed');
    }
    /**
     * Generate HTML dashboard for analytics
     */
    async generateDashboard() {
        const result = await errorBoundary_1.errorBoundary.wrapAsync(async () => {
            const aggregation = await this.getAnalyticsAggregation();
            return '<html><body><h1>Analytics Dashboard</h1>' +
                '<p>Total Events: ' + this.events.length + '</p>' +
                '<p>Session ID: ' + this.currentSession.session_id + '</p>' +
                '<p>User Actions: ' + this.currentSession.user_actions + '</p>' +
                '<p>Errors Count: ' + this.currentSession.errors_count + '</p>' +
                '<p>Average Command Execution Time: ' + aggregation.performance_summary.avg_command_execution_time + 'ms</p>' +
                '</body></html>';
        }, 'AnalyticsService.generateDashboard', loggingManager_1.LogCategory.EXTENSION);
        return result || '<html><body><h1>Analytics Dashboard</h1><p>Error generating dashboard</p></body></html>';
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analyticsService.js.map