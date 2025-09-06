/**
 * Mock implementations of VS Code API and extension services
 */

// Mock VS Code API
export const mockVSCode = {
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
        file: jest.fn((path: string) => ({ fsPath: path }))
    },
    ViewColumn: { One: 1, Two: 2 },
    ConfigurationTarget: { Global: 1 }
};

// Mock LoggingManager
export const mockLoggingManager = {
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
export const mockConfigurationService = {
    getInstance: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    has: jest.fn(),
    dispose: jest.fn()
};

// Mock AnalyticsService
export const mockAnalyticsService = {
    getInstance: jest.fn(),
    trackEvent: jest.fn(),
    startTracking: jest.fn().mockReturnValue(jest.fn()),
    generateDashboard: jest.fn().mockResolvedValue('<html></html>'),
    exportAnalytics: jest.fn(),
    clearAnalytics: jest.fn(),
    dispose: jest.fn()
};

// Mock AIAssistantService
export const mockAIAssistantService = {
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
export const mockErrorBoundary = {
    getInstance: jest.fn(),
    handleError: jest.fn(),
    wrapAsync: jest.fn(),
    dispose: jest.fn()
};

// Mock WebViewManager
export const mockWebViewManager = {
    getInstance: jest.fn(),
    createWebView: jest.fn().mockResolvedValue({ id: 'test-webview' }),
    getAllWebViews: jest.fn().mockReturnValue([]),
    reloadWebView: jest.fn(),
    dispose: jest.fn()
};

// Mock ProcessManager
export const mockProcessManager = {
    getInstance: jest.fn(),
    startLauncher: jest.fn(),
    stopLauncher: jest.fn(),
    getProcessStatus: jest.fn(),
    dispose: jest.fn()
};

// Mock ManagerFactory
export const mockManagerFactory = {
    getInstance: jest.fn(),
    createManager: jest.fn(),
    getManager: jest.fn(),
    disposeAll: jest.fn()
};
