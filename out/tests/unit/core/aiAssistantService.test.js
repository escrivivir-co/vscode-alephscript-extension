"use strict";
/**
 * Unit tests for AIAssistantService
 */
Object.defineProperty(exports, "__esModule", { value: true });
const aiAssistantService_1 = require("../../../src/core/aiAssistantService");
const services_mock_1 = require("../../mocks/services.mock");
const data_mock_1 = require("../../mocks/data.mock");
// Mock dependencies
jest.mock('../../../src/core/configurationService');
jest.mock('../../../src/core/analyticsService');
jest.mock('../../../src/loggingManager');
describe('AIAssistantService', () => {
    let aiAssistantService;
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        // Get fresh instance for each test
        aiAssistantService = aiAssistantService_1.AIAssistantService.getInstance(services_mock_1.mockLoggingManager, services_mock_1.mockConfigurationService, services_mock_1.mockAnalyticsService);
    });
    afterEach(() => {
        // Clean up after each test
        if (aiAssistantService) {
            aiAssistantService.dispose();
        }
    });
    describe('Singleton Pattern', () => {
        it('should return the same instance on multiple calls', () => {
            const instance1 = aiAssistantService_1.AIAssistantService.getInstance(services_mock_1.mockLoggingManager, services_mock_1.mockConfigurationService, services_mock_1.mockAnalyticsService);
            const instance2 = aiAssistantService_1.AIAssistantService.getInstance(services_mock_1.mockLoggingManager, services_mock_1.mockConfigurationService, services_mock_1.mockAnalyticsService);
            expect(instance1).toBe(instance2);
        });
        it('should initialize with required dependencies', () => {
            expect(aiAssistantService).toBeInstanceOf(aiAssistantService_1.AIAssistantService);
        });
    });
    describe('AI Request Processing', () => {
        it('should process a basic AI request successfully', async () => {
            const request = {
                ...data_mock_1.mockAIRequest,
                capability: aiAssistantService_1.AICapability.CODE_ANALYSIS,
                type: aiAssistantService_1.AIInteractionType.ANALYSIS
            };
            const response = await aiAssistantService.processRequest(request);
            expect(response).toBeDefined();
            expect(response.id).toBeDefined();
            expect(response.request_id).toBe(request.id);
            expect(response.status).toBe('success');
            expect(response.confidence).toBeGreaterThan(0);
            expect(response.content).toBeDefined();
            expect(response.metadata.processing_time).toBeGreaterThan(0);
        });
        it('should handle different AI capabilities', async () => {
            const capabilities = [
                aiAssistantService_1.AICapability.CODE_ANALYSIS,
                aiAssistantService_1.AICapability.COMMAND_SUGGESTION,
                aiAssistantService_1.AICapability.ERROR_DIAGNOSIS,
                aiAssistantService_1.AICapability.WORKFLOW_OPTIMIZATION
            ];
            for (const capability of capabilities) {
                const request = {
                    ...data_mock_1.mockAIRequest,
                    capability,
                    type: aiAssistantService_1.AIInteractionType.ANALYSIS
                };
                const response = await aiAssistantService.processRequest(request);
                expect(response.status).toBe('success');
                expect(response.confidence).toBeGreaterThan(0);
            }
        });
        it('should validate request structure', async () => {
            const invalidRequest = {
                id: '',
                type: aiAssistantService_1.AIInteractionType.ANALYSIS,
                capability: aiAssistantService_1.AICapability.CODE_ANALYSIS,
                context: {},
                data: {},
                timestamp: new Date().toISOString(),
                session_id: 'test'
            };
            await expect(aiAssistantService.processRequest(invalidRequest))
                .rejects.toThrow();
        });
        it('should handle errors gracefully', async () => {
            // Mock an error scenario
            const request = {
                ...data_mock_1.mockAIRequest,
                type: aiAssistantService_1.AIInteractionType.ANALYSIS,
                capability: aiAssistantService_1.AICapability.CODE_ANALYSIS,
                data: { invalid: 'data' }
            };
            const response = await aiAssistantService.processRequest(request);
            expect(response.status).toBe('error');
        });
    });
    describe('AI Statistics', () => {
        it('should return statistics object', () => {
            const stats = aiAssistantService.getStatistics();
            expect(stats).toBeDefined();
            expect(stats).toHaveProperty('total_requests');
            expect(stats).toHaveProperty('success_rate');
            expect(stats).toHaveProperty('avg_confidence');
            expect(stats).toHaveProperty('avg_processing_time');
            expect(stats).toHaveProperty('capabilities_used');
        });
        it('should track request statistics', async () => {
            const request = {
                ...data_mock_1.mockAIRequest,
                capability: aiAssistantService_1.AICapability.CODE_ANALYSIS,
                type: aiAssistantService_1.AIInteractionType.ANALYSIS
            };
            // Process a request
            await aiAssistantService.processRequest(request);
            const stats = aiAssistantService.getStatistics();
            expect(stats.total_requests).toBeGreaterThan(0);
        });
        it('should calculate success rate correctly', async () => {
            const request = {
                ...data_mock_1.mockAIRequest,
                capability: aiAssistantService_1.AICapability.CODE_ANALYSIS,
                type: aiAssistantService_1.AIInteractionType.ANALYSIS
            };
            // Process multiple requests
            await aiAssistantService.processRequest(request);
            await aiAssistantService.processRequest(request);
            const stats = aiAssistantService.getStatistics();
            expect(stats.success_rate).toBeGreaterThanOrEqual(0);
            expect(stats.success_rate).toBeLessThanOrEqual(1);
        });
    });
    describe('Performance', () => {
        it('should process requests within performance threshold', async () => {
            const request = {
                ...data_mock_1.mockAIRequest,
                capability: aiAssistantService_1.AICapability.COMMAND_SUGGESTION,
                type: aiAssistantService_1.AIInteractionType.SUGGESTION
            };
            const startTime = Date.now();
            const response = await aiAssistantService.processRequest(request);
            const endTime = Date.now();
            const processingTime = endTime - startTime;
            expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
            expect(response.metadata.processing_time).toBeLessThan(500); // Internal processing < 500ms
        });
        it('should handle concurrent requests', async () => {
            const requests = Array.from({ length: 5 }, (_, i) => ({
                ...data_mock_1.mockAIRequest,
                id: `test-request-${i}`,
                capability: aiAssistantService_1.AICapability.CODE_ANALYSIS,
                type: aiAssistantService_1.AIInteractionType.ANALYSIS
            }));
            const promises = requests.map(request => aiAssistantService.processRequest(request));
            const responses = await Promise.all(promises);
            expect(responses).toHaveLength(5);
            responses.forEach(response => {
                expect(response.status).toBe('success');
            });
        });
    });
    describe('Memory Management', () => {
        it('should cleanup resources on dispose', () => {
            expect(() => aiAssistantService.dispose()).not.toThrow();
        });
        it('should handle large number of requests without memory leaks', async () => {
            const initialMemory = process.memoryUsage();
            // Process many requests
            for (let i = 0; i < 100; i++) {
                const request = {
                    ...data_mock_1.mockAIRequest,
                    id: `request-${i}`,
                    capability: aiAssistantService_1.AICapability.CODE_ANALYSIS,
                    type: aiAssistantService_1.AIInteractionType.ANALYSIS
                };
                await aiAssistantService.processRequest(request);
            }
            const finalMemory = process.memoryUsage();
            const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
            // Memory growth should be reasonable (less than 10MB for 100 requests)
            expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
        });
    });
    describe('Integration with Analytics', () => {
        it('should track events in analytics service', async () => {
            const request = {
                ...data_mock_1.mockAIRequest,
                capability: aiAssistantService_1.AICapability.CODE_ANALYSIS,
                type: aiAssistantService_1.AIInteractionType.ANALYSIS
            };
            await aiAssistantService.processRequest(request);
            // Verify analytics tracking was called
            expect(services_mock_1.mockAnalyticsService.trackEvent).toHaveBeenCalled();
        });
    });
    describe('Configuration Integration', () => {
        it('should respect configuration settings', () => {
            services_mock_1.mockConfigurationService.get.mockReturnValue(true);
            // Test that configuration is being read
            expect(services_mock_1.mockConfigurationService.get).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=aiAssistantService.test.js.map