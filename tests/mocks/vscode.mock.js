/**
 * Mock VS Code API for testing
 */

const EventEmitter = require('events');

const mockWebviewPanel = {
    webview: {
        html: '',
        options: {},
        asWebviewUri: jest.fn(uri => uri),
        postMessage: jest.fn(),
        onDidReceiveMessage: new EventEmitter().on.bind(new EventEmitter())
    },
    title: 'Test Panel',
    viewType: 'testView',
    active: true,
    visible: true,
    viewColumn: 1,
    onDidDispose: new EventEmitter().on.bind(new EventEmitter()),
    onDidChangeViewState: new EventEmitter().on.bind(new EventEmitter()),
    reveal: jest.fn(),
    dispose: jest.fn()
};

const vscode = {
    // Enums
    ViewColumn: {
        Active: -1,
        Beside: -2,
        One: 1,
        Two: 2,
        Three: 3
    },
    
    ConfigurationTarget: {
        Global: 1,
        Workspace: 2,
        WorkspaceFolder: 3
    },
    
    // Window API
    window: {
        showInformationMessage: jest.fn().mockResolvedValue(undefined),
        showWarningMessage: jest.fn().mockResolvedValue(undefined),
        showErrorMessage: jest.fn().mockResolvedValue(undefined),
        showInputBox: jest.fn().mockResolvedValue('test input'),
        showQuickPick: jest.fn().mockResolvedValue('test pick'),
        showOpenDialog: jest.fn().mockResolvedValue([{ fsPath: '/test/path' }]),
        showSaveDialog: jest.fn().mockResolvedValue({ fsPath: '/test/save/path' }),
        createWebviewPanel: jest.fn().mockReturnValue(mockWebviewPanel),
        createTerminal: jest.fn().mockReturnValue({
            name: 'test terminal',
            processId: Promise.resolve(12345),
            creationOptions: {},
            exitStatus: undefined,
            sendText: jest.fn(),
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn()
        }),
        createOutputChannel: jest.fn().mockReturnValue({
            name: 'test channel',
            append: jest.fn(),
            appendLine: jest.fn(),
            clear: jest.fn(),
            show: jest.fn(),
            hide: jest.fn(),
            dispose: jest.fn()
        }),
        activeTextEditor: {
            document: {
                uri: { fsPath: '/test/file.ts', path: '/test/file.ts' },
                languageId: 'typescript',
                getText: jest.fn().mockReturnValue('test code'),
                lineCount: 10
            },
            selection: {
                isEmpty: false,
                active: { line: 0, character: 0 },
                start: { line: 0, character: 0 },
                end: { line: 1, character: 0 }
            }
        },
        visibleTextEditors: []
    },
    
    // Workspace API
    workspace: {
        workspaceFolders: [{
            uri: { fsPath: '/test/workspace', path: '/test/workspace' },
            name: 'test-workspace',
            index: 0
        }],
        rootPath: '/test/workspace',
        name: 'test-workspace',
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn().mockReturnValue('test-value'),
            update: jest.fn().mockResolvedValue(undefined),
            has: jest.fn().mockReturnValue(true),
            inspect: jest.fn().mockReturnValue({
                key: 'test.setting',
                defaultValue: 'default',
                globalValue: 'global',
                workspaceValue: 'workspace'
            })
        }),
        onDidChangeConfiguration: jest.fn(),
        onDidChangeWorkspaceFolders: jest.fn(),
        openTextDocument: jest.fn().mockResolvedValue({
            uri: { fsPath: '/test/doc.ts' },
            getText: jest.fn().mockReturnValue('document text'),
            save: jest.fn()
        }),
        saveAll: jest.fn().mockResolvedValue(true),
        findFiles: jest.fn().mockResolvedValue([]),
        createFileSystemWatcher: jest.fn().mockReturnValue({
            onDidCreate: jest.fn(),
            onDidChange: jest.fn(),
            onDidDelete: jest.fn(),
            dispose: jest.fn()
        })
    },
    
    // Commands API
    commands: {
        registerCommand: jest.fn().mockReturnValue({ dispose: jest.fn() }),
        executeCommand: jest.fn().mockResolvedValue(undefined),
        getCommands: jest.fn().mockResolvedValue([])
    },
    
    // Extensions API
    extensions: {
        all: [],
        getExtension: jest.fn(),
        onDidChange: jest.fn()
    },
    
    // Uri API
    Uri: {
        file: jest.fn().mockImplementation(path => ({
            fsPath: path,
            path: path,
            scheme: 'file',
            authority: '',
            query: '',
            fragment: '',
            toString: () => `file://${path}`,
            toJSON: () => ({ $mid: 1, fsPath: path, path: path, scheme: 'file' })
        })),
        parse: jest.fn().mockImplementation(uri => ({
            fsPath: uri.replace('file://', ''),
            path: uri.replace('file://', ''),
            scheme: 'file'
        })),
        joinPath: jest.fn().mockImplementation((base, ...parts) => ({
            fsPath: `${base.fsPath}/${parts.join('/')}`,
            path: `${base.path}/${parts.join('/')}`
        }))
    },
    
    // Other classes
    Range: jest.fn(),
    Position: jest.fn(),
    Selection: jest.fn(),
    Location: jest.fn(),
    Diagnostic: jest.fn(),
    DiagnosticSeverity: {
        Error: 0,
        Warning: 1,
        Information: 2,
        Hint: 3
    },
    
    // Event Emitter
    EventEmitter: EventEmitter
};

module.exports = vscode;
