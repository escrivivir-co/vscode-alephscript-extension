"use strict";
/**
 * Global test setup configuration
 * This file runs before all tests to configure the testing environment
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_CONSTANTS = exports.measurePerformance = exports.createMockContext = void 0;
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
        file: jest.fn().mockImplementation((path) => ({ fsPath: path, path })),
        parse: mockFunction(),
        joinPath: mockFunction()
    }
};
// Make vscode available globally
global.vscode = vscode;
// Global test utilities
const createMockContext = () => ({
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
    asAbsolutePath: jest.fn((relativePath) => `/mock/extension/path/${relativePath}`)
});
exports.createMockContext = createMockContext;
// Performance measurement utilities for tests
const measurePerformance = async (fn) => {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    return { result, duration };
};
exports.measurePerformance = measurePerformance;
// Global test constants
exports.TEST_CONSTANTS = {
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
//# sourceMappingURL=setup.js.map