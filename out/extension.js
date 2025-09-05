"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
const configEditor_1 = require("./configEditor");
const processManager_1 = require("./processManager");
const socketMonitor_1 = require("./socketMonitor");
const uiManager_1 = require("./uiManager");
const mcpServerManager_1 = require("./mcpServerManager");
function activate(context) {
    console.log('MCP Socket Gamification Manager extension is now active!');
    // Initialize managers
    const processManager = new processManager_1.ProcessManager();
    const socketMonitor = new socketMonitor_1.SocketMonitor();
    const uiManager = new uiManager_1.UIManager(processManager);
    const mcpServerManager = new mcpServerManager_1.MCPServerManager(processManager);
    const configEditorProvider = new configEditor_1.ConfigEditorProvider(context.extensionUri);
    // Register commands
    const commands = [
        vscode.commands.registerCommand('mcpSocketManager.openConfigEditor', () => {
            configEditorProvider.createOrShowPanel();
        }),
        vscode.commands.registerCommand('mcpSocketManager.startLauncher', async () => {
            try {
                const config = vscode.workspace.getConfiguration('mcpSocketManager');
                const configPath = config.get('configPath');
                if (!configPath) {
                    const result = await vscode.window.showOpenDialog({
                        canSelectFiles: true,
                        canSelectFolders: false,
                        canSelectMany: false,
                        filters: {
                            'JSON files': ['json']
                        }
                    });
                    if (result && result[0]) {
                        await config.update('configPath', result[0].fsPath, vscode.ConfigurationTarget.Workspace);
                        await processManager.startLauncher(result[0].fsPath);
                    }
                }
                else {
                    await processManager.startLauncher(configPath);
                }
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to start launcher: ${error}`);
            }
        }),
        vscode.commands.registerCommand('mcpSocketManager.stopLauncher', async () => {
            try {
                await processManager.stopLauncher();
                vscode.window.showInformationMessage('Launcher stopped successfully');
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to stop launcher: ${error}`);
            }
        }),
        vscode.commands.registerCommand('mcpSocketManager.openSocketMonitor', () => {
            socketMonitor.createOrShowPanel(context.extensionUri);
        }),
        vscode.commands.registerCommand('mcpSocketManager.manageUIs', () => {
            uiManager.showUIManager();
        }),
        vscode.commands.registerCommand('mcpSocketManager.manageMCPServers', () => {
            mcpServerManager.showMCPManager();
        })
    ];
    context.subscriptions.push(...commands);
    // Auto-start if configured
    const config = vscode.workspace.getConfiguration('mcpSocketManager');
    if (config.get('autoStart')) {
        const configPath = config.get('configPath');
        if (configPath) {
            processManager.startLauncher(configPath);
        }
    }
}
function deactivate() {
    console.log('MCP Socket Gamification Manager extension is being deactivated');
}
//# sourceMappingURL=extension.js.map