"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionBootstrap = void 0;
const vscode = __importStar(require("vscode"));
const managerFactory_1 = require("./managerFactory");
const analyticsService_1 = require("./analyticsService");
const aiAssistantService_1 = require("./aiAssistantService");
const loggingManager_1 = require("../loggingManager");
class ExtensionBootstrap {
    constructor() { }
    static getInstance() {
        if (!ExtensionBootstrap.instance) {
            ExtensionBootstrap.instance = new ExtensionBootstrap();
        }
        return ExtensionBootstrap.instance;
    }
    /**
     * Initializes the extension with all managers and core services
     */
    async initialize(context) {
        this.vsCodeContext = context;
        const logger = (0, loggingManager_1.createLogger)(loggingManager_1.LogCategory.EXTENSION, 'Bootstrap');
        const startTime = Date.now();
        logger.info('AlephScript extension activation started');
        try {
            // Create all standard managers
            const managers = await (0, managerFactory_1.createStandardManagers)(context);
            this.extensionContext = {
                managers: {
                    factory: managers.factory,
                    errorBoundary: managers.errorBoundary,
                    config: managers.configService,
                    logging: managers.loggingManager,
                    process: managers.processManager,
                    webView: managers.webViewManager,
                    commandPalette: managers.commandPaletteManager,
                    analytics: managers.analyticsService,
                    aiAssistant: managers.aiAssistantService
                },
                logger
            };
            // Initialize core services
            await this.initializeCoreServices();
            // Track extension activation
            await this.extensionContext.managers.analytics.trackEvent(analyticsService_1.AnalyticsEventType.EXTENSION_ACTIVATED, 'extension', {
                activation_time: Date.now() - startTime,
                context_type: 'vscode_extension',
                managers_count: Object.keys(this.extensionContext.managers).length
            });
            // Register all commands
            await this.registerCommands();
            // Setup TreeViews
            await this.setupTreeViews();
            // Initialize auto-start if configured
            await this.handleAutoStart();
            logger.info('AlephScript extension activation completed successfully');
            if (!this.extensionContext) {
                throw new Error('Extension context not initialized');
            }
            return this.extensionContext;
        }
        catch (error) {
            const errorMessage = `Failed to initialize AlephScript extension: ${error}`;
            logger.error(errorMessage);
            // Try to show error to user
            try {
                vscode.window.showErrorMessage(errorMessage, 'Show Details').then(selection => {
                    if (selection === 'Show Details') {
                        logger.error('Extension initialization failed', error);
                    }
                });
            }
            catch (uiError) {
                console.error('Failed to show error UI:', uiError);
            }
            throw error;
        }
    }
    /**
     * Initializes core services
     */
    async initializeCoreServices() {
        if (!this.extensionContext)
            throw new Error('Extension context not initialized');
        const { managers } = this.extensionContext;
        // Configure logging based on user settings
        const logLevel = managers.config.get('logging.level');
        const enabledCategories = managers.config.get('logging.enabledCategories');
        managers.logging.setLogLevelFromString(logLevel);
        managers.logging.setEnabledCategories(this.stringArrayToLogCategories(enabledCategories));
        // Setup error handling
        managers.errorBoundary; // Just initialize it
        this.extensionContext.logger.info('Core services initialized');
    }
    /**
     * Registers all extension commands
     */
    async registerCommands() {
        if (!this.extensionContext || !this.vsCodeContext) {
            throw new Error('Extension context not initialized');
        }
        const { managers } = this.extensionContext;
        const commands = [];
        // WebView commands
        commands.push(vscode.commands.registerCommand('alephscript.webview.showDashboard', () => {
            const panel = vscode.window.createWebviewPanel('webview-dashboard', 'WebView Dashboard', vscode.ViewColumn.One, { enableScripts: true });
            panel.webview.html = '<h1>WebView Dashboard</h1><p>WebView management interface</p>';
        }), vscode.commands.registerCommand('alephscript.webview.openWebRTC', async () => {
            try {
                const config = managers.webView.getWebRTCConfig();
                const webview = await managers.webView.createWebView(config);
                if (webview) {
                    vscode.window.showInformationMessage('WebRTC UI opened successfully');
                }
                else {
                    vscode.window.showErrorMessage('Failed to open WebRTC UI');
                }
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'webview.openWebRTC', loggingManager_1.LogCategory.WEBVIEW);
            }
        }), vscode.commands.registerCommand('alephscript.webview.openThreeJS', async () => {
            try {
                const config = managers.webView.getThreeJSConfig();
                const webview = await managers.webView.createWebView(config);
                if (webview) {
                    vscode.window.showInformationMessage('ThreeJS UI opened successfully');
                }
                else {
                    vscode.window.showErrorMessage('Failed to open ThreeJS UI');
                }
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'webview.openThreeJS', loggingManager_1.LogCategory.WEBVIEW);
            }
        }), vscode.commands.registerCommand('alephscript.webview.openSocket', async () => {
            try {
                const config = managers.webView.getSocketWebAppConfig();
                const webview = await managers.webView.createWebView(config);
                if (webview) {
                    vscode.window.showInformationMessage('Socket WebApp opened successfully');
                }
                else {
                    vscode.window.showErrorMessage('Failed to open Socket WebApp');
                }
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'webview.openSocket', loggingManager_1.LogCategory.WEBVIEW);
            }
        }), vscode.commands.registerCommand('alephscript.webview.openDriver', async () => {
            try {
                const config = managers.webView.getDriverUIConfig();
                const webview = await managers.webView.createWebView(config);
                if (webview) {
                    vscode.window.showInformationMessage('Driver UI opened successfully');
                }
                else {
                    vscode.window.showErrorMessage('Failed to open Driver UI');
                }
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'webview.openDriver', loggingManager_1.LogCategory.WEBVIEW);
            }
        }), vscode.commands.registerCommand('alephscript.webview.reloadAll', async () => {
            try {
                const webviews = managers.webView.getAllWebViews();
                const reloadPromises = webviews.map((w) => managers.webView.reloadWebView(w.id));
                const results = await Promise.all(reloadPromises);
                const successCount = results.filter((r) => r).length;
                vscode.window.showInformationMessage(`Reloaded ${successCount} of ${webviews.length} webviews`);
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'webview.reloadAll', loggingManager_1.LogCategory.WEBVIEW);
            }
        }), 
        // Analytics Commands
        vscode.commands.registerCommand('alephscript.analytics.showDashboard', async () => {
            if (!this.extensionContext)
                return;
            const tracker = this.extensionContext.managers.analytics.startTracking('analytics_dashboard_open');
            try {
                const aggregation = await this.extensionContext.managers.analytics.getAnalyticsAggregation();
                const panel = vscode.window.createWebviewPanel('analytics-dashboard', 'AlephScript Analytics', vscode.ViewColumn.One, { enableScripts: true });
                panel.webview.html = this.generateAnalyticsDashboard(aggregation);
                await this.extensionContext.managers.analytics.trackEvent(analyticsService_1.AnalyticsEventType.WEBVIEW_OPENED, 'analytics', { webview_type: 'analytics_dashboard' });
                await tracker(true);
            }
            catch (error) {
                await tracker(false, error.message);
                throw error;
            }
        }), vscode.commands.registerCommand('alephscript.analytics.export', async () => {
            if (!this.extensionContext)
                return;
            const tracker = this.extensionContext.managers.analytics.startTracking('analytics_export');
            try {
                const exportData = await this.extensionContext.managers.analytics.exportAnalytics();
                const uri = await vscode.window.showSaveDialog({
                    defaultUri: vscode.Uri.file(`alephscript-analytics-${Date.now()}.json`),
                    filters: { 'JSON Files': ['json'] }
                });
                if (uri) {
                    await vscode.workspace.fs.writeFile(uri, Buffer.from(exportData, 'utf8'));
                    vscode.window.showInformationMessage(`Analytics exported to ${uri.fsPath}`);
                    await this.extensionContext.managers.analytics.trackEvent(analyticsService_1.AnalyticsEventType.USER_INTERACTION, 'analytics', { action: 'export', file_path: uri.fsPath });
                    await tracker(true);
                }
                else {
                    await tracker(false, 'Export cancelled');
                }
            }
            catch (error) {
                await tracker(false, error.message);
                throw error;
            }
        }), vscode.commands.registerCommand('alephscript.analytics.clear', async () => {
            if (!this.extensionContext)
                return;
            const tracker = this.extensionContext.managers.analytics.startTracking('analytics_clear');
            try {
                const confirmation = await vscode.window.showWarningMessage('Are you sure you want to clear all analytics data?', { modal: true }, 'Yes, Clear Data');
                if (confirmation === 'Yes, Clear Data') {
                    await this.extensionContext.managers.analytics.clearAnalytics();
                    vscode.window.showInformationMessage('Analytics data cleared successfully');
                    await this.extensionContext.managers.analytics.trackEvent(analyticsService_1.AnalyticsEventType.USER_INTERACTION, 'analytics', { action: 'clear_data' });
                    await tracker(true);
                }
                else {
                    await tracker(false, 'Clear cancelled');
                }
            }
            catch (error) {
                await tracker(false, error.message);
                throw error;
            }
        }), 
        // Process management commands
        vscode.commands.registerCommand('alephscript.process.startLauncher', async () => {
            try {
                const configPath = managers.config.get('process.configPath');
                if (!configPath) {
                    const result = await vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false,
                        filters: { 'JSON Files': ['json'] }
                    });
                    if (result && result[0]) {
                        await managers.process.startLauncher(result[0].fsPath);
                    }
                }
                else {
                    await managers.process.startLauncher(configPath);
                }
                vscode.window.showInformationMessage('Launcher started successfully');
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'process.startLauncher', loggingManager_1.LogCategory.PROCESS);
            }
        }), vscode.commands.registerCommand('alephscript.process.stopLauncher', async () => {
            try {
                await managers.process.stopLauncher();
                vscode.window.showInformationMessage('Launcher stopped successfully');
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'process.stopLauncher', loggingManager_1.LogCategory.PROCESS);
            }
        }), 
        // System commands
        vscode.commands.registerCommand('alephscript.system.showStatus', () => {
            this.showSystemStatus();
        }), vscode.commands.registerCommand('alephscript.system.restart', async () => {
            try {
                await this.restartExtension();
                vscode.window.showInformationMessage('AlephScript extension restarted successfully');
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'system.restart', loggingManager_1.LogCategory.EXTENSION);
            }
        }), 
        // AI Assistant commands
        vscode.commands.registerCommand('alephscript.ai.askAssistant', async () => {
            try {
                const input = await vscode.window.showInputBox({
                    prompt: 'Ask the AI Assistant a question',
                    placeHolder: 'e.g., How can I optimize my code?'
                });
                if (input) {
                    const response = await managers.aiAssistant.processRequest({
                        id: Date.now().toString(),
                        type: aiAssistantService_1.AIInteractionType.CHAT,
                        capability: aiAssistantService_1.AICapability.COMMAND_SUGGESTION,
                        context: {
                            workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                            activeFile: vscode.window.activeTextEditor?.document.uri.fsPath,
                            userIntent: input
                        },
                        data: {
                            query: input,
                            editor_language: vscode.window.activeTextEditor?.document.languageId
                        },
                        timestamp: new Date().toISOString(),
                        session_id: 'default'
                    });
                    const panel = vscode.window.createWebviewPanel('ai-assistant-response', 'AI Assistant Response', vscode.ViewColumn.Two, { enableScripts: true });
                    panel.webview.html = `
                            <html>
                            <head>
                                <style>
                                    body { font-family: Arial, sans-serif; padding: 20px; }
                                    .response { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
                                    .confidence { color: ${response.confidence > 70 ? 'green' : response.confidence > 40 ? 'orange' : 'red'}; }
                                    .metadata { font-size: 0.9em; color: #666; margin-top: 10px; }
                                </style>
                            </head>
                            <body>
                                <h2>AI Assistant Response</h2>
                                <div class="response">
                                    <h3>Answer:</h3>
                                    <p>${response.content.message || 'No response message available'}</p>
                                    <div class="metadata">
                                        <span class="confidence">Confidence: ${Math.round(response.confidence)}%</span> | 
                                        Processing Time: ${response.metadata.processing_time}ms
                                    </div>
                                </div>
                            </body>
                            </html>
                        `;
                }
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'ai.askAssistant', loggingManager_1.LogCategory.EXTENSION);
            }
        }), vscode.commands.registerCommand('alephscript.ai.codeAnalysis', async () => {
            try {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active text editor found');
                    return;
                }
                const selection = editor.selection;
                const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
                if (!code.trim()) {
                    vscode.window.showErrorMessage('No code selected for analysis');
                    return;
                }
                const response = await managers.aiAssistant.processRequest({
                    id: Date.now().toString(),
                    type: aiAssistantService_1.AIInteractionType.ANALYSIS,
                    capability: aiAssistantService_1.AICapability.CODE_ANALYSIS,
                    context: {
                        activeFile: editor.document.uri.fsPath,
                        selection: code,
                        workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
                    },
                    data: {
                        code,
                        language: editor.document.languageId,
                        file_path: editor.document.uri.fsPath
                    },
                    timestamp: new Date().toISOString(),
                    session_id: 'default'
                });
                const panel = vscode.window.createWebviewPanel('ai-code-analysis', 'AI Code Analysis', vscode.ViewColumn.Two, { enableScripts: true });
                panel.webview.html = `
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                .analysis { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
                                .code-block { background: #2d2d30; color: #cccccc; padding: 10px; border-radius: 3px; font-family: monospace; white-space: pre-wrap; }
                                .confidence { color: ${response.confidence > 70 ? 'green' : response.confidence > 40 ? 'orange' : 'red'}; }
                            </style>
                        </head>
                        <body>
                            <h2>AI Code Analysis Results</h2>
                            <div class="analysis">
                                <h3>Analysis:</h3>
                                <p>${response.content.message || response.content.analysis?.summary || 'No analysis available'}</p>
                                <div style="font-size: 0.9em; color: #666; margin-top: 10px;">
                                    <span class="confidence">Confidence: ${Math.round(response.confidence)}%</span> | 
                                    Language: ${editor.document.languageId} |
                                    Processing Time: ${response.metadata.processing_time}ms
                                </div>
                            </div>
                            <div>
                                <h3>Analyzed Code:</h3>
                                <div class="code-block">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                            </div>
                        </body>
                        </html>
                    `;
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'ai.codeAnalysis', loggingManager_1.LogCategory.EXTENSION);
            }
        }), vscode.commands.registerCommand('alephscript.ai.optimizeWorkflow', async () => {
            try {
                const response = await managers.aiAssistant.processRequest({
                    id: Date.now().toString(),
                    type: aiAssistantService_1.AIInteractionType.OPTIMIZATION,
                    capability: aiAssistantService_1.AICapability.WORKFLOW_OPTIMIZATION,
                    context: {
                        workspace: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
                        userIntent: 'workflow optimization analysis'
                    },
                    data: {
                        workspace_folders: vscode.workspace.workspaceFolders?.map(f => f.uri.fsPath),
                        extensions: vscode.extensions.all.filter(ext => ext.isActive).map(ext => ext.id),
                        settings: vscode.workspace.getConfiguration().get('alephscript') || {}
                    },
                    timestamp: new Date().toISOString(),
                    session_id: 'default'
                });
                const panel = vscode.window.createWebviewPanel('ai-workflow-optimization', 'AI Workflow Optimization', vscode.ViewColumn.Two, { enableScripts: true });
                panel.webview.html = `
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                .optimization { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 10px 0; border-left: 4px solid #28a745; }
                                .confidence { color: ${response.confidence > 70 ? 'green' : response.confidence > 40 ? 'orange' : 'red'}; }
                            </style>
                        </head>
                        <body>
                            <h2>AI Workflow Optimization Suggestions</h2>
                            <div class="optimization">
                                <h3>Optimization Recommendations:</h3>
                                <p>${response.content.message || 'No optimization suggestions available'}</p>
                                <div style="font-size: 0.9em; color: #666; margin-top: 10px;">
                                    <span class="confidence">Confidence: ${Math.round(response.confidence)}%</span> | 
                                    Processing Time: ${response.metadata.processing_time}ms
                                </div>
                            </div>
                        </body>
                        </html>
                    `;
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'ai.optimizeWorkflow', loggingManager_1.LogCategory.EXTENSION);
            }
        }), vscode.commands.registerCommand('alephscript.ai.viewStats', async () => {
            try {
                const stats = managers.aiAssistant.getStatistics();
                const panel = vscode.window.createWebviewPanel('ai-assistant-stats', 'AI Assistant Statistics', vscode.ViewColumn.Two, { enableScripts: true });
                panel.webview.html = `
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; padding: 20px; }
                                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
                                .stat-card { background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007acc; }
                                .stat-title { font-weight: bold; color: #333; margin-bottom: 5px; }
                                .stat-value { font-size: 1.2em; color: #007acc; }
                                .capabilities { background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; }
                                .capability-list { list-style-type: none; padding: 0; }
                                .capability-list li { background: #b3d9ff; margin: 5px 0; padding: 8px; border-radius: 3px; }
                            </style>
                        </head>
                        <body>
                            <h2>AI Assistant Statistics</h2>
                            
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-title">Total Requests</div>
                                    <div class="stat-value">${stats.total_requests}</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-title">Success Rate</div>
                                    <div class="stat-value">${Math.round(stats.success_rate * 100)}%</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-title">Avg Confidence</div>
                                    <div class="stat-value">${Math.round(stats.avg_confidence * 100)}%</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-title">Avg Processing Time</div>
                                    <div class="stat-value">${Math.round(stats.avg_processing_time)}ms</div>
                                </div>
                            </div>

                            <div class="capabilities">
                                <h3>Capabilities Usage</h3>
                                <ul class="capability-list">
                                    ${Object.entries(stats.capabilities_used).map(([capability, count]) => `<li>${capability}: ${count} uses</li>`).join('')}
                                </ul>
                            </div>
                        </body>
                        </html>
                    `;
            }
            catch (error) {
                await managers.errorBoundary.handleError(error, 'ai.viewStats', loggingManager_1.LogCategory.EXTENSION);
            }
        }));
        // Add all commands to context subscriptions
        this.vsCodeContext.subscriptions.push(...commands);
        this.extensionContext.logger.info(`Registered ${commands.length} commands`);
    }
    /**
     * Sets up TreeViews and related UI elements
     */
    async setupTreeViews() {
        if (!this.extensionContext || !this.vsCodeContext) {
            throw new Error('Extension context not initialized');
        }
        // TreeViews will be implemented separately
        // This is a placeholder for the TreeView setup
        this.extensionContext.logger.info('TreeViews setup completed');
    }
    /**
     * Handles auto-start configuration
     */
    async handleAutoStart() {
        if (!this.extensionContext)
            return;
        const { managers } = this.extensionContext;
        if (managers.config.get('process.autoStart')) {
            const configPath = managers.config.get('process.configPath');
            if (configPath) {
                try {
                    await managers.process.startLauncher(configPath);
                    this.extensionContext.logger.info('Auto-start completed successfully');
                }
                catch (error) {
                    await managers.errorBoundary.handleError(error, 'autoStart', loggingManager_1.LogCategory.PROCESS, { showToUser: false } // Don't show auto-start errors to user
                    );
                }
            }
        }
    }
    /**
     * Shows system status
     */
    showSystemStatus() {
        if (!this.extensionContext)
            return;
        const { managers } = this.extensionContext;
        const healthStatus = managers.factory.getHealthStatus();
        const activeManagers = managers.factory.getActiveManagers();
        const statusInfo = {
            activeManagers: activeManagers.length,
            managerHealth: healthStatus,
            webViewCount: managers.webView.getAllWebViews().length,
            processCount: managers.process.getRunningProcessesCount(),
        };
        const statusMessage = `
AlephScript Extension Status:
- Active Managers: ${statusInfo.activeManagers}
- WebViews: ${statusInfo.webViewCount}
- Running Processes: ${statusInfo.processCount}
        `.trim();
        vscode.window.showInformationMessage(statusMessage, 'Show Details').then(selection => {
            if (selection === 'Show Details') {
                vscode.workspace.openTextDocument({
                    content: JSON.stringify(statusInfo, null, 2),
                    language: 'json'
                }).then(doc => {
                    vscode.window.showTextDocument(doc, { preview: true });
                });
            }
        });
    }
    /**
     * Restarts the extension
     */
    async restartExtension() {
        if (!this.extensionContext)
            return;
        const { managers } = this.extensionContext;
        this.extensionContext.logger.info('Restarting extension...');
        // Dispose all managers
        await managers.factory.disposeAll();
        // Reinitialize
        if (this.vsCodeContext) {
            await this.initialize(this.vsCodeContext);
        }
    }
    /**
     * Converts string log level to LogLevel enum
     */
    stringToLogLevel(level) {
        switch (level.toLowerCase()) {
            case 'error': return loggingManager_1.LogLevel.ERROR;
            case 'warn': return loggingManager_1.LogLevel.WARN;
            case 'info': return loggingManager_1.LogLevel.INFO;
            case 'debug': return loggingManager_1.LogLevel.DEBUG;
            case 'trace': return loggingManager_1.LogLevel.TRACE;
            default: return loggingManager_1.LogLevel.INFO;
        }
    }
    /**
     * Converts string array to LogCategory array
     */
    stringArrayToLogCategories(categories) {
        return categories.map(cat => {
            const upperCat = cat.toUpperCase();
            return Object.values(loggingManager_1.LogCategory).find(lc => lc.toUpperCase() === upperCat) || loggingManager_1.LogCategory.GENERAL;
        });
    }
    /**
     * Gets the current extension context
     */
    getExtensionContext() {
        return this.extensionContext;
    }
    /**
     * Generates HTML for analytics dashboard
     */
    generateAnalyticsDashboard(aggregation) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>AlephScript Analytics</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0; padding: 20px; background: #1e1e1e; color: #d4d4d4; 
                }
                .header { margin-bottom: 30px; }
                .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
                .metric-card { 
                    background: #2d2d30; border-radius: 8px; padding: 20px; border: 1px solid #404040; 
                }
                .metric-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #4fc1ff; }
                .metric-value { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
                .metric-list { list-style: none; padding: 0; margin: 0; }
                .metric-list li { 
                    display: flex; justify-content: space-between; padding: 8px 0; 
                    border-bottom: 1px solid #404040; 
                }
                .metric-list li:last-child { border-bottom: none; }
                .usage-bar { 
                    background: #404040; height: 8px; border-radius: 4px; margin-top: 5px; 
                }
                .usage-fill { 
                    background: #4fc1ff; height: 100%; border-radius: 4px; 
                }
                .error-item { color: #ff6b6b; }
                .success-item { color: #51cf66; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🔍 AlephScript Analytics Dashboard</h1>
                <p>Extension usage metrics and performance insights</p>
            </div>
            
            <div class="metric-grid">
                <div class="metric-card">
                    <div class="metric-title">Most Used Commands</div>
                    <ul class="metric-list">
                        ${aggregation.most_used_commands.map((cmd) => `
                            <li>
                                <span>${cmd.command}</span>
                                <span>${cmd.count} uses (${cmd.percentage}%)</span>
                            </li>
                            <div class="usage-bar">
                                <div class="usage-fill" style="width: ${cmd.percentage}%"></div>
                            </div>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">WebView Usage</div>
                    <ul class="metric-list">
                        ${aggregation.most_opened_webviews.map((wv) => `
                            <li>
                                <span>${wv.webview}</span>
                                <span>${wv.count} opens (${wv.avg_duration}ms avg)</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Performance Metrics</div>
                    <ul class="metric-list">
                        <li><span>Avg Startup Time</span><span class="success-item">${aggregation.performance_summary.avg_startup_time}ms</span></li>
                        <li><span>Avg Command Time</span><span class="success-item">${aggregation.performance_summary.avg_command_execution_time}ms</span></li>
                        <li><span>Memory Usage Trend</span><span>${aggregation.performance_summary.memory_usage_trend.length} samples</span></li>
                    </ul>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Error Summary</div>
                    <ul class="metric-list">
                        ${aggregation.error_frequency.map((err) => `
                            <li class="error-item">
                                <span>${err.error_type}</span>
                                <span>${err.count} occurrences</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Usage Patterns</div>
                    <ul class="metric-list">
                        <li><span>Peak Hours</span><span>${aggregation.usage_patterns.peak_usage_hours.join(', ')}</span></li>
                        <li><span>Active Days</span><span>${aggregation.usage_patterns.most_active_days.join(', ')}</span></li>
                        <li><span>Session Duration</span><span>${Math.round(aggregation.usage_patterns.session_duration_avg / 1000)}s</span></li>
                    </ul>
                </div>
                
                <div class="metric-card">
                    <div class="metric-title">Slowest Operations</div>
                    <ul class="metric-list">
                        ${aggregation.performance_summary.slowest_operations.slice(0, 5).map((op) => `
                            <li>
                                <span>${op.operation}</span>
                                <span>${op.avg_duration}ms</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        </body>
        </html>
        `;
    }
    /**
     * Disposes the extension
     */
    async dispose() {
        if (this.extensionContext) {
            this.extensionContext.logger.info('AlephScript extension deactivation started');
            try {
                await this.extensionContext.managers.factory.disposeAll();
                this.extensionContext.logger.info('AlephScript extension deactivation completed');
            }
            catch (error) {
                console.error('Error during extension disposal:', error);
            }
        }
    }
}
exports.ExtensionBootstrap = ExtensionBootstrap;
//# sourceMappingURL=extensionBootstrap.js.map