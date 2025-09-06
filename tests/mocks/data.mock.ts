/**
 * Mock data for testing
 */

export const mockVSCodeContext = {
    subscriptions: [],
    workspaceState: {
        get: jest.fn(),
        update: jest.fn(),
        keys: jest.fn().mockReturnValue([])
    },
    globalState: {
        get: jest.fn(),
        update: jest.fn(),
        keys: jest.fn().mockReturnValue([])
    },
    extensionPath: '/mock/extension/path',
    asAbsolutePath: jest.fn((path: string) => `/mock/extension/path/${path}`)
};

export const mockAnalyticsData = {
    events: [
        {
            id: 'test-event-1',
            type: 'user_interaction',
            category: 'test',
            data: { action: 'click' },
            timestamp: '2025-09-06T12:00:00.000Z'
        }
    ],
    metrics: {
        total_events: 1,
        session_duration: 1000,
        performance_avg: 250
    }
};

export const mockAIRequest = {
    id: 'test-request-1',
    type: 'chat' as const,
    capability: 'CODE_ANALYSIS' as const,
    context: {
        workspace: '/mock/workspace',
        activeFile: '/mock/file.ts'
    },
    data: {
        query: 'Analyze this code',
        code: 'function test() { return true; }'
    },
    timestamp: '2025-09-06T12:00:00.000Z',
    session_id: 'test-session'
};

export const mockAIResponse = {
    id: 'test-response-1',
    request_id: 'test-request-1',
    type: 'chat' as const,
    status: 'success' as const,
    confidence: 85,
    content: {
        message: 'Code analysis complete',
        analysis: {
            summary: 'Function looks good',
            issues: [],
            suggestions: []
        }
    },
    metadata: {
        processing_time: 150,
        model_used: 'test-model'
    },
    timestamp: '2025-09-06T12:00:01.000Z'
};

export const mockWebViewConfig = {
    title: 'Test WebView',
    url: 'http://localhost:3000',
    viewColumn: 1,
    options: {
        enableScripts: true,
        retainContextWhenHidden: true
    }
};

export const mockProcessConfig = {
    command: 'node',
    args: ['test.js'],
    cwd: '/mock/workspace',
    env: {}
};
