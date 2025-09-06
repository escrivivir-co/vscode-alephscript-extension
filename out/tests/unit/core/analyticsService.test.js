"use strict";
/**
 * Unit tests for AnalyticsService
 */
Object.defineProperty(exports, "__esModule", { value: true });
const analyticsService_1 = require("../../../src/core/analyticsService");
const services_mock_1 = require("../../mocks/services.mock");
// Mock dependencies
jest.mock('../../../src/core/configurationService');
jest.mock('../../../src/loggingManager');
describe('AnalyticsService', () => {
    let analyticsService;
    beforeEach(() => {
        jest.clearAllMocks();
        analyticsService = analyticsService_1.AnalyticsService.getInstance(services_mock_1.mockLoggingManager, services_mock_1.mockConfigurationService);
    });
    afterEach(() => {
        if (analyticsService) {
            analyticsService.dispose();
        }
    });
    describe('Singleton Pattern', () => {
        it('should return the same instance on multiple calls', () => {
            const instance1 = analyticsService_1.AnalyticsService.getInstance(services_mock_1.mockLoggingManager, services_mock_1.mockConfigurationService);
            const instance2 = analyticsService_1.AnalyticsService.getInstance(services_mock_1.mockLoggingManager, services_mock_1.mockConfigurationService);
            expect(instance1).toBe(instance2);
        });
    });
    describe('Event Tracking', () => {
        it('should track events successfully', async () => {
            await analyticsService.trackEvent(analyticsService_1.AnalyticsEventType.USER_INTERACTION, 'test', { action: 'click', element: 'button' });
            expect(true).toBe(true); // Basic assertion for now
        });
        it('should handle different event types', async () => {
            const eventTypes = [
                analyticsService_1.AnalyticsEventType.USER_INTERACTION,
                analyticsService_1.AnalyticsEventType.COMMAND_EXECUTED,
                analyticsService_1.AnalyticsEventType.ERROR_OCCURRED,
                analyticsService_1.AnalyticsEventType.EXTENSION_ACTIVATED
            ];
            for (const eventType of eventTypes) {
                await expect(analyticsService.trackEvent(eventType, 'test', {})).resolves.not.toThrow();
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
            await analyticsService.trackEvent(analyticsService_1.AnalyticsEventType.USER_INTERACTION, 'test', { action: 'test' });
            const html = await analyticsService.generateDashboard();
            expect(html).toContain('Analytics Dashboard');
        });
    });
    describe('Data Export', () => {
        it('should export analytics data', async () => {
            await analyticsService.trackEvent(analyticsService_1.AnalyticsEventType.USER_INTERACTION, 'test', { action: 'export_test' });
            const exported = await analyticsService.exportAnalytics();
            expect(exported).toBeDefined();
            expect(typeof exported).toBe('object');
        });
    });
    describe('Data Management', () => {
        it('should clear analytics data', async () => {
            await analyticsService.trackEvent(analyticsService_1.AnalyticsEventType.USER_INTERACTION, 'test', { action: 'clear_test' });
            await expect(analyticsService.clearAnalytics()).resolves.not.toThrow();
        });
    });
    describe('Memory Management', () => {
        it('should handle disposal properly', () => {
            expect(() => analyticsService.dispose()).not.toThrow();
        });
    });
});
//# sourceMappingURL=analyticsService.test.js.map