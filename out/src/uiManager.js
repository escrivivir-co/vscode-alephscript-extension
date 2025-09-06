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
exports.UIManager = void 0;
const vscode = __importStar(require("vscode"));
class UIManager {
    constructor(processManager) {
        this.processManager = processManager;
        this.uis = new Map();
    }
    async showUIManager() {
        const panel = vscode.window.createWebviewPanel('mcpUIManager', 'UI Manager', vscode.ViewColumn.One, {
            enableScripts: true
        });
        panel.webview.html = this.getUIManagerWebview();
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'loadUIs':
                    await this.loadUIsFromConfig();
                    panel.webview.postMessage({
                        command: 'uisLoaded',
                        uis: Array.from(this.uis.values())
                    });
                    break;
                case 'startUI':
                    await this.startUI(message.uiId);
                    break;
                case 'stopUI':
                    await this.stopUI(message.uiId);
                    break;
                case 'openUI':
                    this.openUI(message.uiId);
                    break;
                case 'showLogs':
                    this.processManager.showProcessLogs(message.uiId);
                    break;
            }
        });
        // Load UIs on panel creation
        await this.loadUIsFromConfig();
        panel.webview.postMessage({
            command: 'uisLoaded',
            uis: Array.from(this.uis.values())
        });
    }
    async loadUIsFromConfig() {
        try {
            const config = vscode.workspace.getConfiguration('mcpSocketManager');
            const configPath = config.get('configPath');
            if (configPath) {
                const fs = require('fs');
                const configContent = fs.readFileSync(configPath, 'utf8');
                const configData = JSON.parse(configContent);
                this.uis.clear();
                if (configData.ui && Array.isArray(configData.ui)) {
                    configData.ui.forEach((uiConfig) => {
                        const ui = {
                            id: uiConfig.id,
                            name: uiConfig.name,
                            type: uiConfig.type,
                            enabled: uiConfig.enabled,
                            port: uiConfig.config?.port,
                            status: 'stopped',
                            config: uiConfig.config
                        };
                        this.uis.set(ui.id, ui);
                        // Check if process is already running
                        const processInfo = this.processManager.getProcess(ui.id);
                        if (processInfo && processInfo.status === 'running') {
                            ui.status = 'running';
                        }
                    });
                }
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to load UIs from config: ${error}`);
        }
    }
    async startUI(uiId) {
        try {
            const ui = this.uis.get(uiId);
            if (!ui) {
                throw new Error(`UI ${uiId} not found`);
            }
            if (ui.status === 'running') {
                vscode.window.showInformationMessage(`UI ${ui.name} is already running`);
                return;
            }
            // Different start methods based on UI type
            let command = 'npm';
            let args = [];
            switch (ui.type) {
                case 'custom':
                    args = ['run', `ui:${uiId}`];
                    break;
                case 'html5':
                case 'threejs':
                case 'webrtc':
                case 'blockly-gamify-ui':
                case 'node-red-gamify-ui':
                    args = ['run', `start:${ui.type}`, '--', `--port=${ui.port || 8080}`];
                    break;
                case 'unity':
                    args = ['run', 'build:unity', ui.config?.unityProjectPath || '../unity-project'];
                    break;
                default:
                    args = ['run', `start:${uiId}`];
            }
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }
            // Use process manager to start the UI
            const { spawn } = require('child_process');
            const uiProcess = spawn(command, args, {
                cwd: workspaceFolder.uri.fsPath,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                env: {
                    ...process.env,
                    PORT: (ui.port || 8080).toString(),
                    UI_ID: ui.id,
                    UI_TYPE: ui.type
                }
            });
            const processInfo = {
                id: ui.id,
                name: `UI: ${ui.name}`,
                pid: uiProcess.pid || 0,
                command: `${command} ${args.join(' ')}`,
                status: 'running',
                port: ui.port,
                workingDirectory: process.cwd(),
                startTime: new Date()
            };
            // Update UI status
            ui.status = 'running';
            uiProcess.on('close', (code) => {
                ui.status = code === 0 ? 'stopped' : 'error';
            });
            uiProcess.on('error', (error) => {
                ui.status = 'error';
                vscode.window.showErrorMessage(`UI ${ui.name} error: ${error.message}`);
            });
            vscode.window.showInformationMessage(`UI ${ui.name} started successfully`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start UI ${uiId}: ${error}`);
        }
    }
    async stopUI(uiId) {
        try {
            const ui = this.uis.get(uiId);
            if (!ui) {
                throw new Error(`UI ${uiId} not found`);
            }
            await this.processManager.stopMCPServer(uiId); // Reuse the stop logic
            ui.status = 'stopped';
            vscode.window.showInformationMessage(`UI ${ui.name} stopped`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to stop UI ${uiId}: ${error}`);
        }
    }
    openUI(uiId) {
        const ui = this.uis.get(uiId);
        if (!ui || !ui.port) {
            vscode.window.showErrorMessage(`UI ${uiId} not found or no port configured`);
            return;
        }
        if (ui.status !== 'running') {
            vscode.window.showWarningMessage(`UI ${ui.name} is not running. Start it first.`);
            return;
        }
        const url = `http://localhost:${ui.port}`;
        vscode.env.openExternal(vscode.Uri.parse(url));
    }
    getUIManagerWebview() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>UI Manager</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    cursor: pointer;
                    border-radius: 4px;
                    margin: 0 3px;
                    font-size: 12px;
                }
                .btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .btn.danger {
                    background: var(--vscode-terminal-ansiRed);
                    color: white;
                }
                .btn.success {
                    background: var(--vscode-terminal-ansiGreen);
                    color: black;
                }
                .ui-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 20px;
                }
                .ui-card {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 15px;
                    background: var(--vscode-panel-background);
                }
                .ui-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .ui-title {
                    font-weight: bold;
                    font-size: 16px;
                }
                .ui-type {
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .ui-status {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .status-running {
                    background: var(--vscode-terminal-ansiGreen);
                    color: black;
                }
                .status-stopped {
                    background: var(--vscode-terminal-ansiYellow);
                    color: black;
                }
                .status-error {
                    background: var(--vscode-terminal-ansiRed);
                    color: white;
                }
                .ui-details {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 15px;
                }
                .ui-actions {
                    display: flex;
                    gap: 5px;
                    flex-wrap: wrap;
                }
                .enabled-indicator {
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    margin-right: 5px;
                }
                .enabled-true {
                    background: var(--vscode-terminal-ansiGreen);
                }
                .enabled-false {
                    background: var(--vscode-terminal-ansiRed);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Gamification UI Manager</h1>
                <button class="btn" onclick="refreshUIs()">Refresh</button>
            </div>

            <div id="ui-container" class="ui-grid">
                <div style="text-align: center; color: var(--vscode-descriptionForeground); padding: 40px;">
                    Loading UIs...
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let uis = [];

                function refreshUIs() {
                    vscode.postMessage({ command: 'loadUIs' });
                }

                function startUI(uiId) {
                    vscode.postMessage({ command: 'startUI', uiId: uiId });
                }

                function stopUI(uiId) {
                    vscode.postMessage({ command: 'stopUI', uiId: uiId });
                }

                function openUI(uiId) {
                    vscode.postMessage({ command: 'openUI', uiId: uiId });
                }

                function showLogs(uiId) {
                    vscode.postMessage({ command: 'showLogs', uiId: uiId });
                }

                function renderUIs(uiList) {
                    uis = uiList;
                    const container = document.getElementById('ui-container');
                    
                    if (uis.length === 0) {
                        container.innerHTML = '<div style="text-align: center; color: var(--vscode-descriptionForeground); padding: 40px;">No UIs configured. Check your config file.</div>';
                        return;
                    }
                    
                    container.innerHTML = uis.map(ui => \`
                        <div class="ui-card">
                            <div class="ui-header">
                                <div class="ui-title">
                                    <span class="enabled-indicator enabled-\${ui.enabled}"></span>
                                    \${ui.name}
                                </div>
                                <span class="ui-type">\${ui.type}</span>
                            </div>
                            
                            <div class="ui-status status-\${ui.status}">
                                Status: \${ui.status.toUpperCase()}
                            </div>
                            
                            <div class="ui-details">
                                <div><strong>ID:</strong> \${ui.id}</div>
                                \${ui.port ? \`<div><strong>Port:</strong> \${ui.port}</div>\` : ''}
                                <div><strong>Enabled:</strong> \${ui.enabled ? 'Yes' : 'No'}</div>
                            </div>
                            
                            <div class="ui-actions">
                                \${ui.status === 'running' ? 
                                    \`<button class="btn danger" onclick="stopUI('\${ui.id}')">Stop</button>\` :
                                    \`<button class="btn success" onclick="startUI('\${ui.id}')">Start</button>\`
                                }
                                \${ui.port && ui.status === 'running' ? 
                                    \`<button class="btn" onclick="openUI('\${ui.id}')">Open</button>\` : ''
                                }
                                <button class="btn" onclick="showLogs('\${ui.id}')">Logs</button>
                            </div>
                        </div>
                    \`).join('');
                }

                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'uisLoaded':
                            renderUIs(message.uis);
                            break;
                    }
                });

                // Load UIs on startup
                refreshUIs();
            </script>
        </body>
        </html>`;
    }
}
exports.UIManager = UIManager;
//# sourceMappingURL=uiManager.js.map