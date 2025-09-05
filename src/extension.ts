import * as vscode from 'vscode';
import { ConfigEditorProvider } from './configEditor';
import { ProcessManager } from './processManager';
import { SocketMonitor } from './socketMonitor';
import { UIManager } from './uiManager';
import { MCPServerManager } from './mcpServerManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('MCP Socket Gamification Manager extension is now active!');

    // Initialize managers
    const processManager = new ProcessManager();
    const socketMonitor = new SocketMonitor();
    const uiManager = new UIManager(processManager);
    const mcpServerManager = new MCPServerManager(processManager);
    const configEditorProvider = new ConfigEditorProvider(context.extensionUri);

    // Register commands
    const commands = [
        vscode.commands.registerCommand('mcpSocketManager.openConfigEditor', () => {
            configEditorProvider.createOrShowPanel();
        }),
        
        vscode.commands.registerCommand('mcpSocketManager.startLauncher', async () => {
            try {
                const config = vscode.workspace.getConfiguration('mcpSocketManager');
                const configPath = config.get<string>('configPath');
                
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
                } else {
                    await processManager.startLauncher(configPath);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to start launcher: ${error}`);
            }
        }),
        
        vscode.commands.registerCommand('mcpSocketManager.stopLauncher', async () => {
            try {
                await processManager.stopLauncher();
                vscode.window.showInformationMessage('Launcher stopped successfully');
            } catch (error) {
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
    if (config.get<boolean>('autoStart')) {
        const configPath = config.get<string>('configPath');
        if (configPath) {
            processManager.startLauncher(configPath);
        }
    }
}

export function deactivate() {
    console.log('MCP Socket Gamification Manager extension is being deactivated');
}