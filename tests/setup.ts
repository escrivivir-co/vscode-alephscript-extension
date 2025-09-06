/**
 * Global test setup configuration
 * This file runs before all tests to configure the testing environment
 */

// Mock VS Code API globally
const mockFunction = () => jest.fn();

const vscode = {
    // Mock window object
    window: {
        showInformationMessage: mockFunction(),
        showWarningMessage: mockFunction(),
        showErrorMessage: mockFunction(),
        showInputBox: mockFunction(),
        showQuickPick: mockFunction(),
        showOpenDialog: mockFunction(),
        showSaveDialog: mockFunction(),
        createWebviewPanel: mockFunction(),
        createTerminal: mockFunction(),
        createOutputChannel: mockFunction(),
        createStatusBarItem: mockFunction(),
        activeTextEditor: undefined,
        visibleTextEditors: [],
        onDidChangeActiveTextEditor: mockFunction(),
        onDidChangeVisibleTextEditors: mockFunction()
    },
    
    // Mock workspace object
    workspace: {
        workspaceFolders: undefined,
        rootPath: undefined,
        name: undefined,
        getConfiguration: jest.fn().mockReturnValue({
            get: mockFunction(),
            update: mockFunction(),
            inspect: mockFunction(),
            has: mockFunction()
        }),
        onDidChangeConfiguration: mockFunction(),
        onDidChangeWorkspaceFolders: mockFunction(),
        openTextDocument: mockFunction(),
        saveAll: mockFunction(),
        findFiles: mockFunction(),
        createFileSystemWatcher: mockFunction()
    },
    
    // Mock commands object
    commands: {
        registerCommand: mockFunction(),
        executeCommand: mockFunction(),
        getCommands: mockFunction()
    },
    
    // Mock extensions object
    extensions: {
        all: [],
        getExtension: mockFunction(),
        onDidChange: mockFunction()
    },
    
    // Mock ViewColumn enum
    ViewColumn: {
        Active: -1,
        Beside: -2,
        One: 1,
        Two: 2,
        Three: 3
    },
    
    // Mock ConfigurationTarget enum
    ConfigurationTarget: {
        Global: 1,
        Workspace: 2,
        WorkspaceFolder: 3
    },
    
    // Mock Uri object
    Uri: {
        file: jest.fn().mockImplementation((path: string) => ({ fsPath: path, path })),
        parse: mockFunction(),
        joinPath: mockFunction()
    }
};

// Make vscode available globally
(global as any).vscode = vscode;

// Global test utilities
export const createMockContext = () => ({
    subscriptions: [],
    workspaceState: {
        get: mockFunction(),
        update: mockFunction(),
        keys: jest.fn().mockReturnValue([])
    },
    globalState: {
        get: mockFunction(),
        update: mockFunction(),
        keys: jest.fn().mockReturnValue([]),
        setKeysForSync: mockFunction()
    },
    extensionUri: vscode.Uri.file('/mock/extension/path'),
    extensionPath: '/mock/extension/path',
    storagePath: '/mock/storage/path',
    globalStoragePath: '/mock/global/storage/path',
    asAbsolutePath: jest.fn((relativePath: string) => `/mock/extension/path/${relativePath}`)
});

// Performance measurement utilities for tests
export const measurePerformance = async (fn: Function): Promise<{ result: any; duration: number }> => {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    return { result, duration };
};

// Global test constants
export const TEST_CONSTANTS = {
    MOCK_WORKSPACE_PATH: '/mock/workspace',
    MOCK_FILE_PATH: '/mock/workspace/test.ts',
    TIMEOUT: {
        SHORT: 1000,
        MEDIUM: 5000,
        LONG: 10000
    },
    PERFORMANCE_THRESHOLDS: {
        SERVICE_INITIALIZATION: 100, // ms
        COMMAND_EXECUTION: 200, // ms
        AI_RESPONSE: 500, // ms
        WEBVIEW_CREATION: 300 // ms
    }
};

// Global mock for logger service
export const createMockLogger = () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    level: 'info',
    addConsoleHandler: jest.fn(),
    addFileHandler: jest.fn(),
    clearHandlers: jest.fn(),
    getLogLevel: jest.fn(),
    setLogLevel: jest.fn()
});

// Global mock for analytics service
export const createMockAnalyticsService = () => ({
    getInstance: jest.fn(),
    trackEvent: jest.fn(),
    trackUserAction: jest.fn(),
    trackError: jest.fn(),
    startSession: jest.fn(),
    endSession: jest.fn(),
    getStatistics: jest.fn().mockReturnValue({
        totalEvents: 0,
        sessionsCount: 0,
        averageSessionDuration: 0,
        errorCount: 0
    }),
    getEvents: jest.fn().mockReturnValue([]),
    generateDashboard: jest.fn().mockResolvedValue('<html>Mock Dashboard</html>'),
    dispose: jest.fn()
});

// Global mock for configuration service  
export const createMockConfigurationService = () => ({
    getInstance: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
    getAll: jest.fn().mockReturnValue({}),
    dispose: jest.fn(),
    onDidChange: jest.fn()
});

// Setup global mocks before tests
beforeAll(() => {
    // Mock console methods to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Cleanup after tests
afterAll(() => {
    jest.restoreAllMocks();
});
