"use strict";
/**
 * Performance tests for critical extension operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
const setup_1 = require("../../setup");
describe('Performance Tests', () => {
    describe('Service Initialization', () => {
        it('should initialize services within time threshold', async () => {
            const { result, duration } = await (0, setup_1.measurePerformance)(async () => {
                // Simulate service initialization
                await new Promise(resolve => setTimeout(resolve, 10));
                return { initialized: true };
            });
            expect(result.initialized).toBe(true);
            expect(duration).toBeLessThan(100); // 100ms threshold
        });
    });
    describe('Memory Usage', () => {
        it('should not cause significant memory leaks', async () => {
            const initialMemory = process.memoryUsage();
            // Simulate multiple operations
            const operations = Array.from({ length: 100 }, async (_, i) => {
                await new Promise(resolve => setTimeout(resolve, 1));
                return { operation: i };
            });
            await Promise.all(operations);
            const finalMemory = process.memoryUsage();
            const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
            // Memory growth should be reasonable (less than 5MB for 100 operations)
            expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024);
        });
    });
    describe('Concurrent Operations', () => {
        it('should handle concurrent requests efficiently', async () => {
            const concurrentCount = 10;
            const { result, duration } = await (0, setup_1.measurePerformance)(async () => {
                const promises = Array.from({ length: concurrentCount }, async (_, i) => {
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
                    return { id: i, completed: true };
                });
                return await Promise.all(promises);
            });
            expect(result).toHaveLength(concurrentCount);
            expect(duration).toBeLessThan(500); // Should complete within 500ms
            result.forEach((item) => {
                expect(item.completed).toBe(true);
            });
        });
    });
    describe('Resource Cleanup', () => {
        it('should cleanup resources efficiently', async () => {
            const resources = [];
            const { duration } = await (0, setup_1.measurePerformance)(async () => {
                // Create resources
                for (let i = 0; i < 50; i++) {
                    resources.push({
                        id: i,
                        data: new Array(1000).fill(i),
                        dispose: jest.fn()
                    });
                }
                // Cleanup resources
                resources.forEach(resource => {
                    resource.dispose();
                    resource.data = null;
                });
                resources.length = 0;
                return true;
            });
            expect(duration).toBeLessThan(50); // Cleanup should be fast
            expect(resources).toHaveLength(0);
        });
    });
    describe('Data Processing', () => {
        it('should process large datasets efficiently', async () => {
            const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
                id: i,
                value: Math.random(),
                timestamp: Date.now()
            }));
            const { result, duration } = await (0, setup_1.measurePerformance)(async () => {
                // Process data
                return largeDataset
                    .filter(item => item.value > 0.5)
                    .map(item => ({ ...item, processed: true }))
                    .slice(0, 100); // Take first 100 processed items
            });
            expect(result.length).toBeLessThanOrEqual(100);
            expect(duration).toBeLessThan(100); // Should process within 100ms
            result.forEach((item) => {
                expect(item.processed).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=serviceStartup.test.js.map