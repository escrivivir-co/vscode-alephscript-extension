"use strict";
/**
 * Integration tests for ManagerFactory
 */
Object.defineProperty(exports, "__esModule", { value: true });
const managerFactory_1 = require("../../../src/core/managerFactory");
const data_mock_1 = require("../../mocks/data.mock");
// Mock vscode module
jest.mock('vscode', () => require('../../mocks/vscode.mock'), { virtual: true });
describe('ManagerFactory Integration Tests', () => {
    let mockContext;
    let factory;
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = (0, data_mock_1.createMockContext)();
    });
    afterEach(async () => {
        if (factory) {
            await factory.disposeAll();
        }
    });
    describe('Factory Creation', () => {
        it('should create factory instance with context', () => {
            factory = managerFactory_1.ManagerFactory.getInstance({
                context: mockContext
            });
            expect(factory).toBeInstanceOf(managerFactory_1.ManagerFactory);
        });
        it('should return same instance (singleton)', () => {
            const factory1 = managerFactory_1.ManagerFactory.getInstance({
                context: mockContext
            });
            const factory2 = managerFactory_1.ManagerFactory.getInstance({
                context: mockContext
            });
            expect(factory1).toBe(factory2);
            factory = factory1;
        });
    });
    describe('Manager Creation', () => {
        beforeEach(() => {
            factory = managerFactory_1.ManagerFactory.getInstance({
                context: mockContext
            });
        });
        it('should create logging manager', async () => {
            const loggingManager = await factory.createManager('logging');
            expect(loggingManager).toBeDefined();
            expect(loggingManager).toHaveProperty('dispose');
        });
        it('should create configuration service', async () => {
            const configService = await factory.createManager('config');
            expect(configService).toBeDefined();
            expect(configService).toHaveProperty('dispose');
        });
        it('should create error boundary', async () => {
            const errorBoundary = await factory.createManager('error-boundary');
            expect(errorBoundary).toBeDefined();
            expect(errorBoundary).toHaveProperty('dispose');
        });
        it('should create process manager', async () => {
            const processManager = await factory.createManager('process');
            expect(processManager).toBeDefined();
            expect(processManager).toHaveProperty('dispose');
        });
        it('should create webview manager', async () => {
            const webViewManager = await factory.createManager('webview');
            expect(webViewManager).toBeDefined();
            expect(webViewManager).toHaveProperty('dispose');
        });
        it('should throw error for unknown manager type', async () => {
            await expect(factory.createManager('unknown')).rejects.toThrow('Unknown manager type: unknown');
        });
    });
    describe('Manager Dependencies', () => {
        beforeEach(() => {
            factory = managerFactory_1.ManagerFactory.getInstance({
                context: mockContext
            });
        });
        it('should create analytics after logging and config', async () => {
            // Create dependencies first
            const loggingManager = await factory.createManager('logging');
            const configService = await factory.createManager('config');
            // Set dependencies
            factory.config.loggingManager = loggingManager;
            factory.config.configService = configService;
            // Create analytics
            const analytics = await factory.createManager('analytics');
            expect(analytics).toBeDefined();
        });
        it('should create AI assistant after prerequisites', async () => {
            // Create all dependencies
            const loggingManager = await factory.createManager('logging');
            const configService = await factory.createManager('config');
            factory.config.loggingManager = loggingManager;
            factory.config.configService = configService;
            const analytics = await factory.createManager('analytics');
            const aiAssistant = await factory.createManager('ai-assistant');
            expect(aiAssistant).toBeDefined();
        });
    });
    describe('Standard Managers Creation', () => {
        it('should create all standard managers', async () => {
            const managers = await (0, managerFactory_1.createStandardManagers)(mockContext);
            expect(managers).toBeDefined();
            expect(managers.factory).toBeDefined();
            expect(managers.errorBoundary).toBeDefined();
            expect(managers.configService).toBeDefined();
            expect(managers.loggingManager).toBeDefined();
            expect(managers.processManager).toBeDefined();
            expect(managers.webViewManager).toBeDefined();
            expect(managers.commandPaletteManager).toBeDefined();
            expect(managers.analyticsService).toBeDefined();
            expect(managers.aiAssistantService).toBeDefined();
            // Cleanup
            await managers.factory.disposeAll();
        });
        it('should have proper dependency chain in standard managers', async () => {
            const managers = await (0, managerFactory_1.createStandardManagers)(mockContext);
            // Verify all managers are initialized
            expect(managers.factory.hasManager('logging')).toBe(true);
            expect(managers.factory.hasManager('config')).toBe(true);
            expect(managers.factory.hasManager('analytics')).toBe(true);
            expect(managers.factory.hasManager('ai-assistant')).toBe(true);
            await managers.factory.disposeAll();
        });
    });
    describe('Manager Lifecycle', () => {
        beforeEach(() => {
            factory = managerFactory_1.ManagerFactory.getInstance({
                context: mockContext
            });
        });
        it('should track active managers', async () => {
            const loggingManager = await factory.createManager('logging');
            const configManager = await factory.createManager('config');
            const activeManagers = factory.getActiveManagers();
            expect(activeManagers).toContain('logging');
            expect(activeManagers).toContain('config');
            expect(activeManagers.length).toBe(2);
        });
        it('should dispose specific manager', async () => {
            const loggingManager = await factory.createManager('logging');
            expect(factory.hasManager('logging')).toBe(true);
            await factory.disposeManager('logging');
            expect(factory.hasManager('logging')).toBe(false);
        });
        it('should dispose all managers', async () => {
            await factory.createManager('logging');
            await factory.createManager('config');
            expect(factory.getActiveManagers().length).toBe(2);
            await factory.disposeAll();
            expect(factory.getActiveManagers().length).toBe(0);
        });
    });
    describe('Error Handling', () => {
        beforeEach(() => {
            factory = managerFactory_1.ManagerFactory.getInstance({
                context: mockContext
            });
        });
        it('should handle analytics creation without dependencies', async () => {
            // Try to create analytics without setting dependencies
            await expect(factory.createManager('analytics')).rejects.toThrow('Analytics manager requires logging and config services');
        });
        it('should handle AI assistant creation without dependencies', async () => {
            await expect(factory.createManager('ai-assistant')).rejects.toThrow('AI Assistant manager requires logging and config services');
        });
    });
    describe('Performance', () => {
        beforeEach(() => {
            factory = managerFactory_1.ManagerFactory.getInstance({
                context: mockContext
            });
        });
        it('should create managers within performance threshold', async () => {
            const startTime = Date.now();
            await factory.createManager('logging');
            const endTime = Date.now();
            const creationTime = endTime - startTime;
            expect(creationTime).toBeLessThan(100); // Should create within 100ms
        });
        it('should handle concurrent manager creation', async () => {
            const promises = [
                factory.createManager('logging'),
                factory.createManager('config'),
                factory.createManager('error-boundary'),
                factory.createManager('process'),
                factory.createManager('webview')
            ];
            const managers = await Promise.all(promises);
            expect(managers).toHaveLength(5);
            managers.forEach(manager => {
                expect(manager).toBeDefined();
                expect(manager).toHaveProperty('dispose');
            });
        });
    });
});
//# sourceMappingURL=managerFactory.test.js.map