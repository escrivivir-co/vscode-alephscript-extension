import * as vscode from 'vscode';
import * as path from 'path';
import * as cp from 'child_process';
import { ProcessManager } from './processManager';
import { LoggingManager, LogCategory, LogLevel } from './loggingManager';

export interface WebViewInstance {
    id: string;
    type: 'webrtc' | 'threejs' | 'socket' | 'driver' | 'custom';
    panel: vscode.WebviewPanel;
    url?: string;
    process?: cp.ChildProcess;
    status: 'loading' | 'ready' | 'error' | 'closed';
    port?: number;
    workingDirectory?: string;
}

export interface WebViewConfig {
    id: string;
    type: 'webrtc' | 'threejs' | 'socket' | 'driver' | 'custom';
    title: string;
    url?: string;
    localPath?: string;
    port?: number;
    startCommand?: string;
    workingDirectory?: string;
    enableScripts?: boolean;
    retainContextWhenHidden?: boolean;
}

export class WebViewManager {
    private static instance: WebViewManager;
    private webviews: Map<string, WebViewInstance> = new Map();
    private processManager: ProcessManager;
    private loggingManager: LoggingManager;
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.processManager = ProcessManager.getInstance();
        this.loggingManager = LoggingManager.getInstance();
    }

    static getInstance(context?: vscode.ExtensionContext): WebViewManager {
        if (!WebViewManager.instance) {
            if (!context) {
                throw new Error('WebViewManager requires context for first initialization');
            }
            WebViewManager.instance = new WebViewManager(context);
        }
        return WebViewManager.instance;
    }

    async createWebView(config: WebViewConfig): Promise<WebViewInstance | undefined> {
        try {
            this.loggingManager.log(LogLevel.INFO, LogCategory.WEBVIEW, `Creating webview: ${config.id}`);

            // Check if webview already exists
            if (this.webviews.has(config.id)) {
                const existing = this.webviews.get(config.id)!;
                if (existing.status !== 'closed') {
                    existing.panel.reveal();
                    return existing;
                }
                // Remove closed webview
                this.webviews.delete(config.id);
            }

            // Create the webview panel
            const panel = vscode.window.createWebviewPanel(
                config.type,
                config.title,
                vscode.ViewColumn.One,
                {
                    enableScripts: config.enableScripts !== false,
                    retainContextWhenHidden: config.retainContextWhenHidden !== false,
                    localResourceRoots: config.localPath ? [
                        vscode.Uri.file(config.localPath),
                        vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
                    ] : [
                        vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
                    ]
                }
            );

            // Create webview instance
            const webview: WebViewInstance = {
                id: config.id,
                type: config.type,
                panel,
                url: config.url,
                status: 'loading',
                port: config.port,
                workingDirectory: config.workingDirectory
            };

            // Setup panel event handlers
            this.setupWebViewHandlers(webview);

            // Start local server if needed
            if (config.startCommand && config.workingDirectory) {
                await this.startLocalServer(webview, config);
            }

            // Set webview content
            await this.setWebViewContent(webview, config);

            this.webviews.set(config.id, webview);
            this.loggingManager.log(LogLevel.INFO, LogCategory.WEBVIEW, `WebView ${config.id} created successfully`);

            return webview;

        } catch (error) {
            this.loggingManager.log(LogLevel.ERROR, LogCategory.WEBVIEW, `Failed to create webview ${config.id}: ${error}`);
            return undefined;
        }
    }

    private setupWebViewHandlers(webview: WebViewInstance): void {
        const { panel } = webview;

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(
            (message) => this.handleWebViewMessage(webview, message),
            undefined,
            this.context.subscriptions
        );

        // Handle panel disposal
        panel.onDidDispose(
            () => this.disposeWebView(webview.id),
            null,
            this.context.subscriptions
        );

        // Handle visibility changes
        panel.onDidChangeViewState(
            (e) => {
                if (e.webviewPanel.visible) {
                    this.loggingManager.log(LogLevel.DEBUG, LogCategory.WEBVIEW, `WebView ${webview.id} became visible`);
                } else {
                    this.loggingManager.log(LogLevel.DEBUG, LogCategory.WEBVIEW, `WebView ${webview.id} became hidden`);
                }
            },
            null,
            this.context.subscriptions
        );
    }

    private async startLocalServer(webview: WebViewInstance, config: WebViewConfig): Promise<void> {
        if (!config.startCommand || !config.workingDirectory) {
            return;
        }

        try {
            this.loggingManager.log(LogLevel.INFO, LogCategory.WEBVIEW, `Starting server for ${webview.id}...`);

            const serverStarted = await this.processManager.startProcess(
                `webview-${webview.id}`,
                config.startCommand.split(' ')[0],
                config.startCommand.split(' ').slice(1),
                config.workingDirectory,
                config.port
            );

            if (serverStarted) {
                webview.process = this.processManager.getProcess(`webview-${webview.id}`) as any;
                this.loggingManager.log(LogLevel.INFO, LogCategory.WEBVIEW, `Server for ${webview.id} started on port ${config.port}`);
                
                // Wait for server to be ready
                await this.waitForServer(config.port || 3000, 10000);
                webview.status = 'ready';
            } else {
                throw new Error('Failed to start server process');
            }

        } catch (error) {
            this.loggingManager.log(LogLevel.ERROR, LogCategory.WEBVIEW, `Failed to start server for ${webview.id}: ${error}`);
            webview.status = 'error';
        }
    }

    private async waitForServer(port: number, timeout: number): Promise<void> {
        const start = Date.now();
        
        while (Date.now() - start < timeout) {
            try {
                const isReady = await this.processManager.getPortStatus(port);
                if (isReady) {
                    return;
                }
            } catch (error) {
                // Continue trying
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        throw new Error(`Server did not start within ${timeout}ms`);
    }

    private async setWebViewContent(webview: WebViewInstance, config: WebViewConfig): Promise<void> {
        const { panel } = webview;

        if (config.url) {
            // External URL - create iframe
            const html = this.generateIframeHtml(config.url, config.title);
            panel.webview.html = html;
        } else if (config.localPath) {
            // Local HTML file
            const htmlPath = vscode.Uri.file(path.join(config.localPath, 'index.html'));
            try {
                const htmlContent = await vscode.workspace.fs.readFile(htmlPath);
                panel.webview.html = htmlContent.toString();
            } catch (error) {
                panel.webview.html = this.generateErrorHtml(`Failed to load local content: ${error}`);
                webview.status = 'error';
            }
        } else if (config.port) {
            // Local server URL
            const localUrl = `http://localhost:${config.port}`;
            const html = this.generateIframeHtml(localUrl, config.title);
            panel.webview.html = html;
        } else {
            // Default content
            panel.webview.html = this.generateDefaultHtml(config.title);
        }
    }

    private generateIframeHtml(url: string, title: string): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body, html {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                    overflow: hidden;
                }
                iframe {
                    width: 100%;
                    height: 100vh;
                    border: none;
                }
                .loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                }
            </style>
        </head>
        <body>
            <div class="loading">Loading ${title}...</div>
            <iframe id="webview-frame" src="${url}" style="display:none;"></iframe>
            <script>
                const vscode = acquireVsCodeApi();
                const frame = document.getElementById('webview-frame');
                const loading = document.querySelector('.loading');
                
                frame.onload = function() {
                    loading.style.display = 'none';
                    frame.style.display = 'block';
                    vscode.postMessage({
                        type: 'webview-ready',
                        url: '${url}'
                    });
                };
                
                frame.onerror = function() {
                    loading.textContent = 'Failed to load ${title}';
                    vscode.postMessage({
                        type: 'webview-error',
                        url: '${url}'
                    });
                };
            </script>
        </body>
        </html>`;
    }

    private generateErrorHtml(error: string): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>WebView Error</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-errorForeground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <h2>WebView Error</h2>
            <p>${error}</p>
        </body>
        </html>`;
    }

    private generateDefaultHtml(title: string): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <h2>${title}</h2>
            <p>WebView content will be loaded here.</p>
        </body>
        </html>`;
    }

    private handleWebViewMessage(webview: WebViewInstance, message: any): void {
        this.loggingManager.log(LogLevel.DEBUG, LogCategory.WEBVIEW, `Message from ${webview.id}: ${JSON.stringify(message)}`);

        switch (message.type) {
            case 'webview-ready':
                webview.status = 'ready';
                this.loggingManager.log(LogLevel.INFO, LogCategory.WEBVIEW, `WebView ${webview.id} is ready`);
                break;
                
            case 'webview-error':
                webview.status = 'error';
                this.loggingManager.log(LogLevel.ERROR, LogCategory.WEBVIEW, `WebView ${webview.id} error: ${message.error}`);
                break;

            default:
                // Handle custom messages
                this.loggingManager.log(LogLevel.DEBUG, LogCategory.WEBVIEW, `Custom message from ${webview.id}: ${message.type}`);
        }
    }

    async disposeWebView(id: string): Promise<void> {
        const webview = this.webviews.get(id);
        if (!webview) {
            return;
        }

        this.loggingManager.log(LogLevel.INFO, LogCategory.WEBVIEW, `Disposing webview: ${id}`);

        // Stop associated process
        if (webview.process) {
            await this.processManager.stopProcess(`webview-${id}`);
        }

        // Update status
        webview.status = 'closed';

        // Remove from map
        this.webviews.delete(id);

        this.loggingManager.log(LogLevel.INFO, LogCategory.WEBVIEW, `WebView ${id} disposed`);
    }

    getWebView(id: string): WebViewInstance | undefined {
        return this.webviews.get(id);
    }

    getAllWebViews(): WebViewInstance[] {
        return Array.from(this.webviews.values());
    }

    getWebViewsByType(type: string): WebViewInstance[] {
        return Array.from(this.webviews.values()).filter(w => w.type === type);
    }

    async sendMessageToWebView(id: string, message: any): Promise<boolean> {
        const webview = this.webviews.get(id);
        if (!webview || webview.status === 'closed') {
            return false;
        }

        try {
            webview.panel.webview.postMessage(message);
            return true;
        } catch (error) {
            this.loggingManager.log(LogLevel.ERROR, LogCategory.WEBVIEW, `Failed to send message to ${id}: ${error}`);
            return false;
        }
    }

    async reloadWebView(id: string): Promise<boolean> {
        const webview = this.webviews.get(id);
        if (!webview) {
            return false;
        }

        try {
            // Re-set the HTML content to reload the iframe
            if (webview.url) {
                const html = this.generateIframeHtml(webview.url, webview.panel.title);
                webview.panel.webview.html = html;
                webview.status = 'loading';
                return true;
            }
        } catch (error) {
            this.loggingManager.log(LogLevel.ERROR, LogCategory.WEBVIEW, `Failed to reload ${id}: ${error}`);
        }

        return false;
    }

    // Predefined UI configurations
    getWebRTCConfig(): WebViewConfig {
        return {
            id: 'webrtc-ui',
            type: 'webrtc',
            title: 'WebRTC Gamification UI',
            port: 4201,
            startCommand: 'npm run start',
            workingDirectory: path.join(this.context.extensionPath, '../../web-rtc-gamify-ui'),
            enableScripts: true,
            retainContextWhenHidden: true
        };
    }

    getThreeJSConfig(): WebViewConfig {
        return {
            id: 'threejs-ui',
            type: 'threejs', 
            title: 'ThreeJS Gamification UI',
            port: 4202,
            startCommand: 'npm run devapp',
            workingDirectory: path.join(this.context.extensionPath, '../../threejs-gamify-ui'),
            enableScripts: true,
            retainContextWhenHidden: true
        };
    }

    getSocketWebAppConfig(): WebViewConfig {
        return {
            id: 'socket-webapp',
            type: 'socket',
            title: 'Socket Gym WebApp',
            port: 4200,
            startCommand: 'npm run start',
            workingDirectory: path.join(this.context.extensionPath, '../../socket-gym/webapp'),
            enableScripts: true,
            retainContextWhenHidden: true
        };
    }

    getDriverUIConfig(): WebViewConfig {
        return {
            id: 'driver-ui',
            type: 'driver',
            title: 'State Machine Driver UI',
            localPath: path.join(this.context.extensionPath, '../../state-machine-mcp-driver/public'),
            enableScripts: true,
            retainContextWhenHidden: false
        };
    }

    dispose(): void {
        this.loggingManager.log(LogLevel.INFO, LogCategory.WEBVIEW, 'Disposing all webviews...');
        
        const disposePromises = Array.from(this.webviews.keys()).map(id => this.disposeWebView(id));
        Promise.all(disposePromises).then(() => {
            this.loggingManager.log(LogLevel.INFO, LogCategory.WEBVIEW, 'All webviews disposed');
        });
    }
}
