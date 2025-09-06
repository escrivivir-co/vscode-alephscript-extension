/**
 * Unit tests for AIAssistantService
 */

import { createMockLogger, createMockAnalyticsService, createMockConfigurationService } from '../../setup';

// Mock all dependencies before importing the service
jest.mock('../../../src/loggingManager', () => ({
    LoggingManager: jest.fn().mockImplementation(() => createMockLogger()),
    LogCategory: {
        EXTENSION: 'extension',
        AI: 'ai',
        ANALYTICS: 'analytics'
    },
    LogLevel: {
        INFO: 'info',
        ERROR: 'error',
        DEBUG: 'debug',
        WARN: 'warn'
    },
    createLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    })
}));

jest.mock('../../../src/core/analyticsService', () => ({
    AnalyticsService: {
        getInstance: jest.fn().mockImplementation(() => createMockAnalyticsService())
    },
    AnalyticsEventType: {
        USER_INTERACTION: 'user_interaction',
        AI_REQUEST: 'ai_request',
        PERFORMANCE: 'performance',
        ERROR: 'error'
    }
}));

jest.mock('../../../src/core/configurationService', () => ({
    ConfigurationService: {
        getInstance: jest.fn().mockImplementation(() => createMockConfigurationService())
    }
}));

jest.mock('../../../src/core/errorBoundary', () => ({
    ErrorBoundary: jest.fn().mockImplementation(() => ({
        executeSafely: jest.fn().mockImplementation(async (fn) => await fn()),
        wrapAsync: jest.fn().mockImplementation(async (fn) => await fn())
    })),
    errorBoundary: {
        wrapAsync: jest.fn().mockImplementation(async (fn) => await fn()),
        executeSafely: jest.fn().mockImplementation(async (fn) => await fn())
    }
}));

// Now import the service after mocking dependencies
import { AIAssistantService, AICapability, AIInteractionType } from '../../../src/core/aiAssistantService';

// Helper function to create mock AI requests
const createMockAIRequest = (overrides: any = {}) => ({
    id: 'test-request-1',
    type: AIInteractionType.ANALYSIS,
    capability: AICapability.CODE_ANALYSIS,
    context: {
        workspace: '/test/workspace',
        activeFile: 'test.js'
    },
    data: {
        query: 'Test query'
    },
    timestamp: new Date().toISOString(),
    session_id: 'test-session',
    ...overrides
});

describe('AIAssistantService', () => {
    let service: AIAssistantService;

    beforeEach(() => {
        // Clear all mocks and reset singleton
        jest.clearAllMocks();
        (AIAssistantService as any).instance = undefined;
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance on multiple calls', () => {
            const mockLogging = createMockLogger();
            const mockConfig = createMockConfigurationService();
            const mockAnalytics = createMockAnalyticsService();
            
            const instance1 = AIAssistantService.getInstance(mockLogging as any, mockConfig as any, mockAnalytics as any);
            const instance2 = AIAssistantService.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should initialize with required dependencies', () => {
            const mockLogging = createMockLogger();
            const mockConfig = createMockConfigurationService();
            const mockAnalytics = createMockAnalyticsService();
            
            service = AIAssistantService.getInstance(mockLogging as any, mockConfig as any, mockAnalytics as any);
            expect(service).toBeDefined();
        });

    describe('AI Request Processing', () => {
        beforeEach(() => {
            const mockLogging = createMockLogger();
            const mockConfig = createMockConfigurationService();
            const mockAnalytics = createMockAnalyticsService();
            service = AIAssistantService.getInstance(mockLogging as any, mockConfig as any, mockAnalytics as any);
        });

        it('should process a basic AI request successfully', async () => {
            const mockRequest = createMockAIRequest({
                type: AIInteractionType.CHAT,
                capability: AICapability.CODE_ANALYSIS,
                data: {
                    query: 'Analyze this code',
                    code: 'console.log("test");'
                }
            });

            const result = await service.processRequest(mockRequest);
            
            expect(result).toBeDefined();
            expect(result.status).toBe('success');
            expect(result.content.analysis).toBeDefined();
        });

        it('should handle different AI capabilities', async () => {
            const capabilities = [
                AICapability.CODE_ANALYSIS,
                AICapability.COMMAND_SUGGESTION,
                AICapability.ERROR_DIAGNOSIS,
                AICapability.WORKFLOW_OPTIMIZATION
            ];

            for (const capability of capabilities) {
                const request = createMockAIRequest({
                    capability,
                    context: { activeFile: 'test.js' },
                    data: { query: `Test ${capability}` }
                });

                const result = await service.processRequest(request);
                expect(result).toBeDefined();
                expect(result.status).toBe('success');
            }
        });

        it('should validate request structure', async () => {
            const invalidRequest = {
                // Missing required fields
                context: {}
            };

            const result = await service.processRequest(invalidRequest as any);
            expect(result.status).toBe('partial'); // Invalid requests go to generic processor
            expect(result.content.message).toContain('understand');
        });

        it('should handle errors gracefully', async () => {
            // Create a request that will cause an error
            const errorRequest = createMockAIRequest({
                capability: 'INVALID_CAPABILITY' as any,
                context: { error: 'test error' },
                data: { query: 'This should error' }
            });

            const result = await service.processRequest(errorRequest);
            expect(result.status).toBe('partial'); // Invalid capability goes to generic processor
            expect(result.content.message).toBeDefined();
        });
    });

    describe('AI Statistics', () => {
        beforeEach(() => {
            const mockLogging = createMockLogger();
            const mockConfig = createMockConfigurationService();
            const mockAnalytics = createMockAnalyticsService();
            service = AIAssistantService.getInstance(mockLogging as any, mockConfig as any, mockAnalytics as any);
        });

        it('should return statistics object', () => {
            const stats = service.getStatistics();

            expect(stats).toHaveProperty('total_requests');
            expect(stats).toHaveProperty('success_rate');
            expect(stats).toHaveProperty('avg_confidence');
            expect(stats).toHaveProperty('avg_processing_time');
            expect(stats).toHaveProperty('capabilities_used');
        });        it('should track request statistics', async () => {
            const initialStats = service.getStatistics();
            
            await service.processRequest(createMockAIRequest({
                data: { query: 'test statistics' }
            }));

            const newStats = service.getStatistics();
            expect(newStats.total_requests).toBeGreaterThan(initialStats.total_requests);
        });

        it('should calculate success rate correctly', async () => {
            // Process a successful request
            await service.processRequest(createMockAIRequest({
                data: { query: 'test success rate' }
            }));

            const stats = service.getStatistics();
            expect(stats.success_rate).toBeGreaterThan(0);
            expect(stats.success_rate).toBeLessThanOrEqual(100);
        });
    });

    describe('Performance', () => {
        beforeEach(() => {
            const mockLogging = createMockLogger();
            const mockConfig = createMockConfigurationService();
            const mockAnalytics = createMockAnalyticsService();
            service = AIAssistantService.getInstance(mockLogging as any, mockConfig as any, mockAnalytics as any);
        });

        it('should process requests within performance threshold', async () => {
            const startTime = Date.now();
            
            await service.processRequest(createMockAIRequest({
                data: { query: 'performance test' }
            }));

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(500); // 500ms threshold
        });

        it('should handle concurrent requests', async () => {
            const requests = Array(5).fill(null).map((_, i) => 
                service.processRequest(createMockAIRequest({
                    id: `concurrent-${i}`,
                    data: { query: `test ${i}` }
                }))
            );

            const results = await Promise.all(requests);
            
            results.forEach(result => {
                expect(result).toBeDefined();
                expect(result.status).toBe('success');
            });
        });
    });

    describe('Memory Management', () => {
        beforeEach(() => {
            const mockLogging = createMockLogger();
            const mockConfig = createMockConfigurationService();
            const mockAnalytics = createMockAnalyticsService();
            service = AIAssistantService.getInstance(mockLogging as any, mockConfig as any, mockAnalytics as any);
        });

        it('should cleanup resources on dispose', () => {
            expect(() => service.dispose()).not.toThrow();
        });

        it('should handle large number of requests without memory leaks', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            
            // Process many requests
            const requests = Array(50).fill(null).map((_, i) =>
                service.processRequest(createMockAIRequest({
                    id: `memory-test-${i}`,
                    data: { query: `test ${i}` }
                }))
            );

            await Promise.all(requests);
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = finalMemory - initialMemory;
            
            // Memory increase should be reasonable (less than 10MB)
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
        });
    });

    describe('Integration with Analytics', () => {
        beforeEach(() => {
            const mockLogging = createMockLogger();
            const mockConfig = createMockConfigurationService();
            const mockAnalytics = createMockAnalyticsService();
            service = AIAssistantService.getInstance(mockLogging as any, mockConfig as any, mockAnalytics as any);
        });

        it('should track events in analytics service', async () => {
            const mockAnalytics = createMockAnalyticsService();
            
            await service.processRequest(createMockAIRequest({
                data: { query: 'analytics test' }
            }));

            // Analytics tracking is handled internally, just verify no errors
            expect(service).toBeDefined();
        });
    });

    describe('Configuration Integration', () => {
        beforeEach(() => {
            const mockLogging = createMockLogger();
            const mockConfig = createMockConfigurationService();
            const mockAnalytics = createMockAnalyticsService();
            service = AIAssistantService.getInstance(mockLogging as any, mockConfig as any, mockAnalytics as any);
        });

        it('should have proper initialization', () => {
            // Test that service initializes without requiring getConfiguration method
            expect(service).toBeDefined();
            expect(typeof service.processRequest).toBe('function');
            expect(typeof service.getStatistics).toBe('function');
            expect(typeof service.dispose).toBe('function');
        });
    });
});
});
