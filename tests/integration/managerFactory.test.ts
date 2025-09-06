/**
 * Integration tests for ManagerFactory
 */

import { ManagerFactory, createStandardManagers } from '../../src/core/managerFactory';
import { createMockContext } from '../setup';

// Mock vscode module
jest.mock('vscode', () => ({
    window: {
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        createOutputChannel: jest.fn().mockReturnValue({
            appendLine: jest.fn(),
            show: jest.fn(),
            clear: jest.fn(),
            dispose: jest.fn()
        }),
        createWebviewPanel: jest.fn().mockReturnValue({
            webview: { html: '' },
            dispose: jest.fn()
        })
    },
    workspace: {
        getConfiguration: jest.fn().mockImplementation((section?: string) => ({
            get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
                // Return appropriate values based on the section and key
                if (section === 'alephscript.logging') {
                    switch (key) {
                        case 'level': return 'info';
                        case 'enabledCategories': return ['general', 'extension', 'ui'];
                        case 'showTimestamp': return true;
                        case 'showLevel': return true; 
                        case 'showCategory': return true;
                        default: return defaultValue;
                    }
                }
                return defaultValue || true;
            }),
            update: jest.fn()
        })),
        onDidChangeConfiguration: jest.fn().mockReturnValue({
            dispose: jest.fn()
        })
    },
    commands: {
        registerCommand: jest.fn(),
    },
    Uri: {
        file: jest.fn().mockImplementation((path: string) => ({ fsPath: path, path })),
    },
    ExtensionContext: jest.fn()
}), { virtual: true });

describe('ManagerFactory Integration Tests', () => {
    let mockContext: any;
    let factory: ManagerFactory;

    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = createMockContext();
        
        // Ensure clean factory state
        if (factory) {
            factory.disposeAll().catch(() => {});
        }
    });

    afterEach(async () => {
        if (factory) {
            await factory.disposeAll();
        }
    });

    describe('Factory Creation', () => {
        it('should create factory instance with context', () => {
            factory = ManagerFactory.getInstance({
                context: mockContext
            });

            expect(factory).toBeInstanceOf(ManagerFactory);
        });

        it('should return same instance (singleton)', () => {
            const factory1 = ManagerFactory.getInstance({
                context: mockContext
            });
            const factory2 = ManagerFactory.getInstance({
                context: mockContext
            });

            expect(factory1).toBe(factory2);
            factory = factory1;
        });
    });

    describe('Manager Creation', () => {
        beforeEach(() => {
            factory = ManagerFactory.getInstance({
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
            await expect(
                factory.createManager('unknown' as any)
            ).rejects.toThrow('Unknown manager type: unknown');
        });
    });

    describe('Manager Dependencies', () => {
        beforeEach(() => {
            factory = ManagerFactory.getInstance({
                context: mockContext
            });
        });

        it('should create analytics after logging and config', async () => {
            // Create dependencies first
            const loggingManager = await factory.createManager('logging');
            const configService = await factory.createManager('config');
            
            // Set dependencies with proper type casting
            factory.config.loggingManager = loggingManager as any;
            factory.config.configService = configService as any;
            
            // Create analytics
            const analytics = await factory.createManager('analytics');
            expect(analytics).toBeDefined();
        });

        it('should create AI assistant after prerequisites', async () => {
            // Create all dependencies
            const loggingManager = await factory.createManager('logging');
            const configService = await factory.createManager('config');
            
            factory.config.loggingManager = loggingManager as any;
            factory.config.configService = configService as any;
            
            const analytics = await factory.createManager('analytics');
            const aiAssistant = await factory.createManager('ai-assistant');
            
            expect(aiAssistant).toBeDefined();
        });
    });

    describe('Standard Managers Creation', () => {
        it('should create all standard managers', async () => {
            const managers = await createStandardManagers(mockContext);

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
            const managers = await createStandardManagers(mockContext);

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
            factory = ManagerFactory.getInstance({
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
            factory = ManagerFactory.getInstance({
                context: mockContext
            });
        });

        describe('Error Handling', () => {
        it('should handle analytics creation without dependencies', async () => {
            // Create a separate factory instance for error testing
            // Clear dependencies to test error conditions
            const originalLogging = factory.config.loggingManager;
            const originalConfig = factory.config.configService;
            
            factory.config.loggingManager = undefined;
            factory.config.configService = undefined;
            
            await expect(
                factory.createManager('analytics')
            ).rejects.toThrow('Analytics manager requires logging and config services');
            
            // Restore dependencies
            factory.config.loggingManager = originalLogging;
            factory.config.configService = originalConfig;
        });

        it('should handle AI assistant creation without dependencies', async () => {
            // Clear dependencies to test error conditions  
            const originalLogging = factory.config.loggingManager;
            const originalConfig = factory.config.configService;
            
            factory.config.loggingManager = undefined;
            factory.config.configService = undefined;
            
            await expect(
                factory.createManager('ai-assistant')
            ).rejects.toThrow('AI Assistant manager requires logging and config services');
            
            // Restore dependencies
            factory.config.loggingManager = originalLogging;
            factory.config.configService = originalConfig;
        });
    });
    });

    describe('Performance', () => {
        beforeEach(() => {
            factory = ManagerFactory.getInstance({
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
