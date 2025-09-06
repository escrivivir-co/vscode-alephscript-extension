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
exports.ConfigEditorProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
class ConfigEditorProvider {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    createOrShowPanel() {
        if (this.panel) {
            this.panel.reveal();
            return;
        }
        this.panel = vscode.window.createWebviewPanel('mcpConfigEditor', 'MCP Config Editor', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        });
        this.panel.webview.html = this.getWebviewContent();
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'loadConfig':
                    this.loadConfig();
                    break;
                case 'saveConfig':
                    this.saveConfig(message.config);
                    break;
                case 'selectConfigFile':
                    this.selectConfigFile();
                    break;
            }
        });
    }
    async loadConfig() {
        try {
            const config = vscode.workspace.getConfiguration('mcpSocketManager');
            const configPath = config.get('configPath');
            if (configPath && fs.existsSync(configPath)) {
                const configContent = fs.readFileSync(configPath, 'utf8');
                const configData = JSON.parse(configContent);
                this.panel?.webview.postMessage({
                    command: 'configLoaded',
                    config: configData,
                    path: configPath
                });
            }
            else {
                this.panel?.webview.postMessage({
                    command: 'configError',
                    error: 'No config file selected or file not found'
                });
            }
        }
        catch (error) {
            this.panel?.webview.postMessage({
                command: 'configError',
                error: `Failed to load config: ${error}`
            });
        }
    }
    async saveConfig(configData) {
        try {
            const config = vscode.workspace.getConfiguration('mcpSocketManager');
            const configPath = config.get('configPath');
            if (configPath) {
                fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
                vscode.window.showInformationMessage('Configuration saved successfully');
                this.panel?.webview.postMessage({
                    command: 'configSaved'
                });
            }
            else {
                throw new Error('No config file path specified');
            }
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to save config: ${error}`);
            this.panel?.webview.postMessage({
                command: 'configError',
                error: `Failed to save config: ${error}`
            });
        }
    }
    async selectConfigFile() {
        const result = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'JSON files': ['json']
            }
        });
        if (result && result[0]) {
            const config = vscode.workspace.getConfiguration('mcpSocketManager');
            await config.update('configPath', result[0].fsPath, vscode.ConfigurationTarget.Workspace);
            this.loadConfig();
        }
    }
    getWebviewContent() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MCP Config Editor</title>
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
                    padding: 8px 16px;
                    cursor: pointer;
                    border-radius: 4px;
                    margin: 0 5px;
                }
                .btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .config-section {
                    margin-bottom: 30px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 15px;
                }
                .config-section h3 {
                    margin-top: 0;
                    color: var(--vscode-textLink-foreground);
                }
                .form-group {
                    margin-bottom: 15px;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                .form-group input, .form-group textarea, .form-group select {
                    width: 100%;
                    padding: 8px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                }
                .agent-item {
                    border: 1px solid var(--vscode-list-hoverBackground);
                    margin-bottom: 10px;
                    padding: 10px;
                    border-radius: 4px;
                }
                .ui-item {
                    border: 1px solid var(--vscode-list-hoverBackground);
                    margin-bottom: 10px;
                    padding: 10px;
                    border-radius: 4px;
                }
                .error {
                    color: var(--vscode-errorForeground);
                    background: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    padding: 10px;
                    border-radius: 4px;
                }
                .success {
                    color: var(--vscode-terminal-ansiGreen);
                    padding: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>MCP Socket.io Gamification Config Editor</h1>
                <div>
                    <button class="btn" onclick="selectConfigFile()">Select Config File</button>
                    <button class="btn" onclick="loadConfig()">Reload</button>
                    <button class="btn" onclick="saveConfig()">Save</button>
                </div>
            </div>

            <div id="error-message" class="error" style="display: none;"></div>
            <div id="success-message" class="success" style="display: none;"></div>

            <div id="config-content">
                <p>Select a configuration file to begin editing...</p>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let currentConfig = null;

                function selectConfigFile() {
                    vscode.postMessage({ command: 'selectConfigFile' });
                }

                function loadConfig() {
                    vscode.postMessage({ command: 'loadConfig' });
                }

                function saveConfig() {
                    if (currentConfig) {
                        vscode.postMessage({ 
                            command: 'saveConfig', 
                            config: currentConfig 
                        });
                    }
                }

                function showError(message) {
                    const errorDiv = document.getElementById('error-message');
                    errorDiv.textContent = message;
                    errorDiv.style.display = 'block';
                    document.getElementById('success-message').style.display = 'none';
                }

                function showSuccess(message) {
                    const successDiv = document.getElementById('success-message');
                    successDiv.textContent = message;
                    successDiv.style.display = 'block';
                    document.getElementById('error-message').style.display = 'none';
                }

                function renderConfig(config) {
                    currentConfig = config;
                    const content = document.getElementById('config-content');
                    
                    content.innerHTML = \`
                        <div class="config-section">
                            <h3>Application Settings</h3>
                            <div class="form-group">
                                <label>App Type:</label>
                                <input type="text" value="\${config.app?.type || ''}" onchange="updateConfig('app.type', this.value)">
                            </div>
                        </div>

                        <div class="config-section">
                            <h3>Game Configuration</h3>
                            <div class="form-group">
                                <label>Game ID:</label>
                                <input type="text" value="\${config.game?.id || ''}" onchange="updateConfig('game.id', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Game Name:</label>
                                <input type="text" value="\${config.game?.name || ''}" onchange="updateConfig('game.name', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Description:</label>
                                <textarea onchange="updateConfig('game.description', this.value)">\${config.game?.description || ''}</textarea>
                            </div>
                        </div>

                        <div class="config-section">
                            <h3>Agent Configurations</h3>
                            <div id="agents-container">
                                \${renderAgents(config.game?.agentConfigs || [])}
                            </div>
                            <button class="btn" onclick="addAgent()">Add Agent</button>
                        </div>

                        <div class="config-section">
                            <h3>UI Configurations</h3>
                            <div id="ui-container">
                                \${renderUIs(config.ui || [])}
                            </div>
                            <button class="btn" onclick="addUI()">Add UI</button>
                        </div>

                        <div class="config-section">
                            <h3>MCP Servers</h3>
                            <div id="mcp-container">
                                \${renderMCPServers(config.mcp?.servers || {})}
                            </div>
                            <button class="btn" onclick="addMCPServer()">Add MCP Server</button>
                        </div>
                    \`;
                }

                function renderAgents(agents) {
                    return agents.map((agent, index) => \`
                        <div class="agent-item">
                            <h4>Agent: \${agent.name || agent.id}</h4>
                            <div class="form-group">
                                <label>ID:</label>
                                <input type="text" value="\${agent.id || ''}" onchange="updateAgentConfig(\${index}, 'id', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Name:</label>
                                <input type="text" value="\${agent.name || ''}" onchange="updateAgentConfig(\${index}, 'name', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Role:</label>
                                <input type="text" value="\${agent.role || ''}" onchange="updateAgentConfig(\${index}, 'role', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Description:</label>
                                <textarea onchange="updateAgentConfig(\${index}, 'description', this.value)">\${agent.description || ''}</textarea>
                            </div>
                            <button class="btn" onclick="removeAgent(\${index})">Remove Agent</button>
                        </div>
                    \`).join('');
                }

                function renderUIs(uis) {
                    return uis.map((ui, index) => \`
                        <div class="ui-item">
                            <h4>UI: \${ui.name || ui.id}</h4>
                            <div class="form-group">
                                <label>ID:</label>
                                <input type="text" value="\${ui.id || ''}" onchange="updateUIConfig(\${index}, 'id', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Name:</label>
                                <input type="text" value="\${ui.name || ''}" onchange="updateUIConfig(\${index}, 'name', this.value)">
                            </div>
                            <div class="form-group">
                                <label>Type:</label>
                                <select onchange="updateUIConfig(\${index}, 'type', this.value)">
                                    <option value="custom" \${ui.type === 'custom' ? 'selected' : ''}>Custom</option>
                                    <option value="html5" \${ui.type === 'html5' ? 'selected' : ''}>HTML5</option>
                                    <option value="threejs" \${ui.type === 'threejs' ? 'selected' : ''}>ThreeJS</option>
                                    <option value="unity" \${ui.type === 'unity' ? 'selected' : ''}>Unity</option>
                                    <option value="webrtc" \${ui.type === 'webrtc' ? 'selected' : ''}>WebRTC</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Enabled:</label>
                                <input type="checkbox" \${ui.enabled ? 'checked' : ''} onchange="updateUIConfig(\${index}, 'enabled', this.checked)">
                            </div>
                            <button class="btn" onclick="removeUI(\${index})">Remove UI</button>
                        </div>
                    \`).join('');
                }

                function renderMCPServers(servers) {
                    return Object.keys(servers).map(serverId => \`
                        <div class="ui-item">
                            <h4>MCP Server: \${serverId}</h4>
                            <div class="form-group">
                                <label>Server ID:</label>
                                <input type="text" value="\${serverId}" readonly>
                            </div>
                            <button class="btn" onclick="removeMCPServer('\${serverId}')">Remove Server</button>
                        </div>
                    \`).join('');
                }

                function updateConfig(path, value) {
                    const keys = path.split('.');
                    let obj = currentConfig;
                    for (let i = 0; i < keys.length - 1; i++) {
                        if (!obj[keys[i]]) obj[keys[i]] = {};
                        obj = obj[keys[i]];
                    }
                    obj[keys[keys.length - 1]] = value;
                }

                function updateAgentConfig(index, field, value) {
                    if (!currentConfig.game) currentConfig.game = {};
                    if (!currentConfig.game.agentConfigs) currentConfig.game.agentConfigs = [];
                    if (!currentConfig.game.agentConfigs[index]) currentConfig.game.agentConfigs[index] = {};
                    currentConfig.game.agentConfigs[index][field] = value;
                }

                function updateUIConfig(index, field, value) {
                    if (!currentConfig.ui) currentConfig.ui = [];
                    if (!currentConfig.ui[index]) currentConfig.ui[index] = {};
                    currentConfig.ui[index][field] = value;
                }

                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'configLoaded':
                            renderConfig(message.config);
                            showSuccess(\`Config loaded from: \${message.path}\`);
                            break;
                        case 'configSaved':
                            showSuccess('Configuration saved successfully');
                            break;
                        case 'configError':
                            showError(message.error);
                            break;
                    }
                });

                // Load config on startup
                loadConfig();
            </script>
        </body>
        </html>`;
    }
}
exports.ConfigEditorProvider = ConfigEditorProvider;
//# sourceMappingURL=configEditor.js.map