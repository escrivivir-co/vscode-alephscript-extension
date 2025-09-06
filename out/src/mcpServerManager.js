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
exports.MCPServerManager = void 0;
const vscode = __importStar(require("vscode"));
class MCPServerManager {
    constructor(processManager) {
        this.processManager = processManager;
        this.servers = new Map();
    }
    async showMCPManager() {
        const panel = vscode.window.createWebviewPanel('mcpServerManager', 'MCP Server Manager', vscode.ViewColumn.One, {
            enableScripts: true
        });
        panel.webview.html = this.getMCPManagerWebview();
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'loadServers':
                    await this.loadServersFromConfig();
                    panel.webview.postMessage({
                        command: 'serversLoaded',
                        servers: Array.from(this.servers.values())
                    });
                    break;
                case 'startServer':
                    await this.startServer(message.serverId);
                    break;
                case 'stopServer':
                    await this.stopServer(message.serverId);
                    break;
                case 'showLogs':
                    this.processManager.showProcessLogs(message.serverId);
                    break;
                case 'testConnection':
                    await this.testConnection(message.serverId);
                    break;
            }
        });
        // Load servers on panel creation
        await this.loadServersFromConfig();
        panel.webview.postMessage({
            command: 'serversLoaded',
            servers: Array.from(this.servers.values())
        });
    }
    async loadServersFromConfig() {
        try {
            const config = vscode.workspace.getConfiguration('mcpSocketManager');
            const configPath = config.get('configPath');
            if (configPath) {
                const fs = require('fs');
                const configContent = fs.readFileSync(configPath, 'utf8');
                const configData = JSON.parse(configContent);
                this.servers.clear();
                if (configData.mcp && configData.mcp.servers) {
                    // Standard MCP server ports
                    const defaultPorts = {
                        'state-machine-server': 3001,
                        'wiki-mcp-browser': 3002,
                        'devops-mcp-server': 3003
                    };
                    Object.keys(configData.mcp.servers).forEach((serverId, index) => {
                        const serverConfig = configData.mcp.servers[serverId];
                        const server = {
                            id: serverId,
                            name: this.formatServerName(serverId),
                            port: serverConfig.port || defaultPorts[serverId] || (3001 + index),
                            status: 'stopped',
                            config: serverConfig
                        };
                        this.servers.set(serverId, server);
                        // Check if process is already running
                        const processInfo = this.processManager.getProcess(serverId);
                        if (processInfo && processInfo.status === 'running') {
                            server.status = 'running';
                        }
                    });
                }
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to load MCP servers from config: ${error}`);
        }
    }
    formatServerName(serverId) {
        return serverId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    async startServer(serverId) {
        try {
            const server = this.servers.get(serverId);
            if (!server) {
                throw new Error(`Server ${serverId} not found`);
            }
            if (server.status === 'running') {
                vscode.window.showInformationMessage(`MCP Server ${server.name} is already running`);
                return;
            }
            await this.processManager.startMCPServer(serverId, server.port || 3001);
            server.status = 'running';
            vscode.window.showInformationMessage(`MCP Server ${server.name} started on port ${server.port}`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to start MCP server ${serverId}: ${error}`);
        }
    }
    async stopServer(serverId) {
        try {
            const server = this.servers.get(serverId);
            if (!server) {
                throw new Error(`Server ${serverId} not found`);
            }
            await this.processManager.stopMCPServer(serverId);
            server.status = 'stopped';
            vscode.window.showInformationMessage(`MCP Server ${server.name} stopped`);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to stop MCP server ${serverId}: ${error}`);
        }
    }
    async testConnection(serverId) {
        try {
            const server = this.servers.get(serverId);
            if (!server || !server.port) {
                throw new Error(`Server ${serverId} not found or no port configured`);
            }
            // Simple HTTP health check
            const http = require('http');
            const options = {
                hostname: 'localhost',
                port: server.port,
                path: '/health',
                method: 'GET',
                timeout: 5000
            };
            const req = http.request(options, (res) => {
                if (res.statusCode === 200) {
                    vscode.window.showInformationMessage(`MCP Server ${server.name} is responding`);
                }
                else {
                    vscode.window.showWarningMessage(`MCP Server ${server.name} responded with status ${res.statusCode}`);
                }
            });
            req.on('error', (error) => {
                vscode.window.showErrorMessage(`MCP Server ${server.name} connection failed: ${error.message}`);
            });
            req.on('timeout', () => {
                vscode.window.showErrorMessage(`MCP Server ${server.name} connection timed out`);
                req.destroy();
            });
            req.end();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to test connection to ${serverId}: ${error}`);
        }
    }
    getMCPManagerWebview() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MCP Server Manager</title>
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
                .server-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }
                .server-card {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 15px;
                    background: var(--vscode-panel-background);
                }
                .server-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }
                .server-title {
                    font-weight: bold;
                    font-size: 16px;
                }
                .server-id {
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-family: monospace;
                }
                .server-status {
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
                .server-details {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                    margin-bottom: 15px;
                }
                .server-actions {
                    display: flex;
                    gap: 5px;
                    flex-wrap: wrap;
                }
                .info-section {
                    background: var(--vscode-textCodeBlock-background);
                    padding: 15px;
                    border-radius: 4px;
                    margin-bottom: 20px;
                }
                .info-section h3 {
                    margin-top: 0;
                    color: var(--vscode-textLink-foreground);
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>MCP Server Manager</h1>
                <button class="btn" onclick="refreshServers()">Refresh</button>
            </div>

            <div class="info-section">
                <h3>MCP (Model Context Protocol) Servers</h3>
                <p>These servers provide different capabilities to your gamification system:</p>
                <ul>
                    <li><strong>State Machine Server:</strong> Manages game state and transitions</li>
                    <li><strong>Wiki MCP Browser:</strong> Provides web browsing and knowledge access</li>
                    <li><strong>DevOps MCP Server:</strong> Handles system operations and deployment</li>
                </ul>
            </div>

            <div id="server-container" class="server-grid">
                <div style="text-align: center; color: var(--vscode-descriptionForeground); padding: 40px;">
                    Loading servers...
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let servers = [];

                function refreshServers() {
                    vscode.postMessage({ command: 'loadServers' });
                }

                function startServer(serverId) {
                    vscode.postMessage({ command: 'startServer', serverId: serverId });
                }

                function stopServer(serverId) {
                    vscode.postMessage({ command: 'stopServer', serverId: serverId });
                }

                function showLogs(serverId) {
                    vscode.postMessage({ command: 'showLogs', serverId: serverId });
                }

                function testConnection(serverId) {
                    vscode.postMessage({ command: 'testConnection', serverId: serverId });
                }

                function renderServers(serverList) {
                    servers = serverList;
                    const container = document.getElementById('server-container');
                    
                    if (servers.length === 0) {
                        container.innerHTML = '<div style="text-align: center; color: var(--vscode-descriptionForeground); padding: 40px;">No MCP servers configured. Check your config file.</div>';
                        return;
                    }
                    
                    container.innerHTML = servers.map(server => \`
                        <div class="server-card">
                            <div class="server-header">
                                <div class="server-title">\${server.name}</div>
                                <span class="server-id">\${server.id}</span>
                            </div>
                            
                            <div class="server-status status-\${server.status}">
                                Status: \${server.status.toUpperCase()}
                            </div>
                            
                            <div class="server-details">
                                \${server.port ? \`<div><strong>Port:</strong> \${server.port}</div>\` : ''}
                                <div><strong>Endpoint:</strong> http://localhost:\${server.port || 'N/A'}</div>
                            </div>
                            
                            <div class="server-actions">
                                \${server.status === 'running' ? 
                                    \`<button class="btn danger" onclick="stopServer('\${server.id}')">Stop</button>\` :
                                    \`<button class="btn success" onclick="startServer('\${server.id}')">Start</button>\`
                                }
                                <button class="btn" onclick="testConnection('\${server.id}')">Test</button>
                                <button class="btn" onclick="showLogs('\${server.id}')">Logs</button>
                            </div>
                        </div>
                    \`).join('');
                }

                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'serversLoaded':
                            renderServers(message.servers);
                            break;
                    }
                });

                // Load servers on startup
                refreshServers();
            </script>
        </body>
        </html>`;
    }
}
exports.MCPServerManager = MCPServerManager;
//# sourceMappingURL=mcpServerManager.js.map