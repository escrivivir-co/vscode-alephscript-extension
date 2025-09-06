"use strict";
/**
 * Mock implementations of VS Code API and extension services
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockManagerFactory = exports.mockProcessManager = exports.mockWebViewManager = exports.mockErrorBoundary = exports.mockAIAssistantService = exports.mockAnalyticsService = exports.mockConfigurationService = exports.mockLoggingManager = exports.mockVSCode = void 0;
// Mock VS Code API
exports.mockVSCode = {
    window: {
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showInputBox: jest.fn(),
        createWebviewPanel: jest.fn().mockReturnValue({
            webview: { html: '' },
            dispose: jest.fn()
        })
    },
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn(),
            update: jest.fn()
        }),
        workspaceFolders: [{
                uri: { fsPath: '/mock/workspace' }
            }]
    },
    commands: {
        registerCommand: jest.fn()
    },
    Uri: {
        file: jest.fn((path) => ({ fsPath: path }))
    },
    ViewColumn: { One: 1, Two: 2 },
    ConfigurationTarget: { Global: 1 }
};
// Mock LoggingManager
exports.mockLoggingManager = {
    getLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
    }),
    setLogLevel: jest.fn(),
    setEnabledCategories: jest.fn(),
    setLogLevelFromString: jest.fn(),
    dispose: jest.fn()
};
// Mock ConfigurationService
exports.mockConfigurationService = {
    getInstance: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    has: jest.fn(),
    dispose: jest.fn()
};
// Mock AnalyticsService
exports.mockAnalyticsService = {
    getInstance: jest.fn(),
    trackEvent: jest.fn(),
    startTracking: jest.fn().mockReturnValue(jest.fn()),
    generateDashboard: jest.fn().mockResolvedValue('<html></html>'),
    exportAnalytics: jest.fn(),
    clearAnalytics: jest.fn(),
    dispose: jest.fn()
};
// Mock AIAssistantService
exports.mockAIAssistantService = {
    getInstance: jest.fn(),
    processRequest: jest.fn().mockResolvedValue({
        id: 'test-response',
        status: 'success',
        confidence: 85,
        content: { message: 'Mock response' },
        metadata: { processing_time: 100 }
    }),
    getStatistics: jest.fn().mockReturnValue({
        total_requests: 10,
        success_rate: 0.9,
        avg_confidence: 0.8,
        avg_processing_time: 150,
        capabilities_used: {}
    }),
    dispose: jest.fn()
};
// Mock ErrorBoundary
exports.mockErrorBoundary = {
    getInstance: jest.fn(),
    handleError: jest.fn(),
    wrapAsync: jest.fn(),
    dispose: jest.fn()
};
// Mock WebViewManager
exports.mockWebViewManager = {
    getInstance: jest.fn(),
    createWebView: jest.fn().mockResolvedValue({ id: 'test-webview' }),
    getAllWebViews: jest.fn().mockReturnValue([]),
    reloadWebView: jest.fn(),
    dispose: jest.fn()
};
// Mock ProcessManager
exports.mockProcessManager = {
    getInstance: jest.fn(),
    startLauncher: jest.fn(),
    stopLauncher: jest.fn(),
    getProcessStatus: jest.fn(),
    dispose: jest.fn()
};
// Mock ManagerFactory
exports.mockManagerFactory = {
    getInstance: jest.fn(),
    createManager: jest.fn(),
    getManager: jest.fn(),
    disposeAll: jest.fn()
};
//# sourceMappingURL=services.mock.js.map