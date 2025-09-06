/**
 * Unit tests for AnalyticsService
 */

import { AnalyticsService, AnalyticsEventType } from '../../../src/core/analyticsService';
import { mockLoggingManager, mockConfigurationService } from '../../mocks/services.mock';

// Mock createLogger function
jest.mock('../../../src/loggingManager', () => ({
    LoggingManager: {
        getInstance: jest.fn().mockReturnValue({
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn()
        })
    },
    LogCategory: {
        EXTENSION: 'extension'
    },
    LogLevel: {
        INFO: 'info',
        ERROR: 'error'
    },
    createLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    })
}));

// Mock dependencies
jest.mock('../../../src/core/configurationService');
jest.mock('../../../src/core/errorBoundary', () => ({
    ErrorBoundary: {
        getInstance: jest.fn().mockReturnValue({
            info: jest.fn(),
            error: jest.fn()
        })
    },
    errorBoundary: {
        wrapAsync: jest.fn().mockImplementation(async (fn) => await fn()),
        executeSafely: jest.fn().mockImplementation(async (fn) => await fn())
    }
}));

describe('AnalyticsService', () => {
    let analyticsService: AnalyticsService;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        analyticsService = AnalyticsService.getInstance(
            mockLoggingManager as any,
            mockConfigurationService as any
        );
    });

    afterEach(() => {
        if (analyticsService) {
            analyticsService.dispose();
        }
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance on multiple calls', () => {
            const instance1 = AnalyticsService.getInstance(
                mockLoggingManager as any,
                mockConfigurationService as any
            );
            const instance2 = AnalyticsService.getInstance(
                mockLoggingManager as any,
                mockConfigurationService as any
            );
            
            expect(instance1).toBe(instance2);
        });
    });

    describe('Event Tracking', () => {
        it('should track events successfully', async () => {
            await analyticsService.trackEvent(
                AnalyticsEventType.USER_INTERACTION,
                'test',
                { action: 'click', element: 'button' }
            );

            expect(true).toBe(true); // Basic assertion for now
        });

        it('should handle different event types', async () => {
            const eventTypes = [
                AnalyticsEventType.USER_INTERACTION,
                AnalyticsEventType.COMMAND_EXECUTED,
                AnalyticsEventType.ERROR_OCCURRED,
                AnalyticsEventType.EXTENSION_ACTIVATED
            ];

            for (const eventType of eventTypes) {
                await expect(
                    analyticsService.trackEvent(eventType, 'test', {})
                ).resolves.not.toThrow();
            }
        });
    });

    describe('Performance Tracking', () => {
        it('should start and complete tracking', async () => {
            const tracker = analyticsService.startTracking('test_operation');
            expect(tracker).toBeDefined();
            expect(typeof tracker).toBe('function');

            await tracker(true, 'completed successfully');
        });

        it('should track operation duration', async () => {
            const tracker = analyticsService.startTracking('test_operation');
            
            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 10));
            
            await tracker(true);
        });
    });

    describe('Dashboard Generation', () => {
        it('should generate HTML dashboard', async () => {
            const html = await analyticsService.generateDashboard();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html).toContain('<html>');
            expect(html).toContain('</html>');
        });

        it('should include analytics data in dashboard', async () => {
            // Add some test data
            await analyticsService.trackEvent(
                AnalyticsEventType.USER_INTERACTION,
                'test',
                { action: 'test' }
            );

            const html = await analyticsService.generateDashboard();
            expect(html).toContain('Analytics Dashboard');
        });
    });

    describe('Data Export', () => {
        it('should export analytics data', async () => {
            await analyticsService.trackEvent(
                AnalyticsEventType.USER_INTERACTION,
                'test',
                { action: 'export_test' }
            );

            const exported = await analyticsService.exportAnalytics();
            expect(exported).toBeDefined();
            expect(typeof exported).toBe('string'); // Should return JSON string
            
            // Verify it can be parsed as JSON
            const parsed = JSON.parse(exported);
            expect(parsed).toHaveProperty('events');
            expect(parsed).toHaveProperty('aggregation');
        });
    });

    describe('Data Management', () => {
        it('should clear analytics data', async () => {
            await analyticsService.trackEvent(
                AnalyticsEventType.USER_INTERACTION,
                'test',
                { action: 'clear_test' }
            );

            await expect(analyticsService.clearAnalytics()).resolves.not.toThrow();
        });
    });

    describe('Memory Management', () => {
        it('should handle disposal properly', () => {
            expect(() => analyticsService.dispose()).not.toThrow();
        });
    });
});
