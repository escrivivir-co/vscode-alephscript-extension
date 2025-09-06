import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { LogCategory, createLogger, CategoryLogger } from './loggingManager';

export interface TerminalInfo {
    id: string;
    name: string;
    terminal: vscode.Terminal;
    status: 'running' | 'stopped' | 'error';
    command?: string;
}

export class TerminalManager {
    private terminals: Map<string, TerminalInfo> = new Map();
    private outputChannel: vscode.OutputChannel;
    private logger: CategoryLogger;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('AlephScript Terminals');
        this.logger = createLogger(LogCategory.TERMINAL, 'TerminalManager');
        
        // Listen for terminal close events
        vscode.window.onDidCloseTerminal((terminal) => {
            for (const [id, termInfo] of this.terminals.entries()) {
                if (termInfo.terminal === terminal) {
                    termInfo.status = 'stopped';
                    this.logger.info(`Terminal ${termInfo.name} closed`, { terminalId: id, terminalName: termInfo.name });
                    this.outputChannel.appendLine(`Terminal ${termInfo.name} closed`);
                    this.terminals.delete(id);
                    break;
                }
            }
        });
    }

    public async startMCPDriver(): Promise<vscode.Terminal> {
        const terminalId = 'mcp-driver';
        const name = 'AlephScript Driver';
        
        // Find the driver script
        const scriptPath = await this.findDriverScript();
        if (!scriptPath) {
            throw new Error('Could not find iniciar-driver.sh script');
        }

        return this.createAndRunTerminal(terminalId, name, scriptPath, path.dirname(scriptPath));
    }

    public async startSocketServer(): Promise<vscode.Terminal> {
        const terminalId = 'socket-server';
        const name = 'Socket.IO Server';
        
        const scriptPath = await this.findSocketScript('arrancar_server.sh');
        if (!scriptPath) {
            throw new Error('Could not find arrancar_server.sh script');
        }

        return this.createAndRunTerminal(terminalId, name, scriptPath, path.dirname(scriptPath));
    }

    public async startSocketAdmin(): Promise<vscode.Terminal> {
        const terminalId = 'socket-admin';
        const name = 'Socket.IO Admin';
        
        const scriptPath = await this.findSocketScript('arrancar_admin.sh');
        if (!scriptPath) {
            throw new Error('Could not find arrancar_admin.sh script');
        }

        return this.createAndRunTerminal(terminalId, name, scriptPath, path.dirname(scriptPath));
    }

    public async startUIProcess(uiId: string, uiType: string, port?: number): Promise<vscode.Terminal> {
        const terminalId = `ui-${uiId}`;
        const name = `UI: ${uiId}`;
        
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        // Build command based on UI type
        let command: string;
        switch (uiType) {
            case 'threejs':
                command = `cd ../threejs-gamify-ui && npm start`;
                break;
            case 'unity':
                command = `cd ../unity-gamify-ui && npm run build`;
                break;
            case 'webrtc':
                command = `cd ../web-rtc-gamify-ui && npm start${port ? ` -- --port=${port}` : ''}`;
                break;
            case 'blockly-gamify-ui':
                command = `cd ../blockly-alephscript-sdk && npm run serve${port ? ` -- --port=${port}` : ''}`;
                break;
            case 'node-red-gamify-ui':
                command = `cd ../node-red-alephscript-sdk && npm start`;
                break;
            default:
                command = `echo "UI type ${uiType} not supported yet"`;
        }

        return this.createAndRunTerminal(terminalId, name, command, workspaceFolder.uri.fsPath);
    }

    private createAndRunTerminal(id: string, name: string, command: string, cwd: string): vscode.Terminal {
        // Close existing terminal if running
        if (this.terminals.has(id)) {
            const existing = this.terminals.get(id)!;
            existing.terminal.dispose();
            this.terminals.delete(id);
        }

        // Create new terminal
        const terminal = vscode.window.createTerminal({
            name: name,
            cwd: cwd,
            shellPath: this.getShellPath(),
            env: {
                ...process.env,
                ALEPHSCRIPT_TERMINAL: 'true'
            }
        });

        // Store terminal info
        const terminalInfo: TerminalInfo = {
            id,
            name,
            terminal,
            status: 'running',
            command
        };
        this.terminals.set(id, terminalInfo);

        // Show and run command
        terminal.show();
        terminal.sendText(command);

        this.outputChannel.appendLine(`Started terminal ${name}: ${command}`);
        
        return terminal;
    }

    private getShellPath(): string {
        // For Windows with bash.exe (user preference)
        if (process.platform === 'win32') {
            // Try common bash locations
            const bashPaths = [
                'C:\\Program Files\\Git\\bin\\bash.exe',
                'C:\\Windows\\System32\\bash.exe',
                'bash.exe' // Let PATH resolve it
            ];
            
            for (const bashPath of bashPaths) {
                if (bashPath === 'bash.exe' || fs.existsSync(bashPath)) {
                    return bashPath;
                }
            }
        }
        
        // Default shell for other platforms
        return process.env.SHELL || '/bin/bash';
    }

    private async findDriverScript(): Promise<string | null> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return null;

        const possiblePaths = [
            '../state-machine-mcp-driver/iniciar-driver.sh',
            '../../state-machine-mcp-driver/iniciar-driver.sh',
            'iniciar-driver.sh'
        ];

        for (const relativePath of possiblePaths) {
            const fullPath = path.resolve(workspaceFolder.uri.fsPath, relativePath);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }

        return null;
    }

    private async findSocketScript(scriptName: string): Promise<string | null> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return null;

        const possiblePaths = [
            `../socket-gym/${scriptName}`,
            `../../socket-gym/${scriptName}`,
            scriptName
        ];

        for (const relativePath of possiblePaths) {
            const fullPath = path.resolve(workspaceFolder.uri.fsPath, relativePath);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }

        return null;
    }

    public getTerminal(id: string): TerminalInfo | undefined {
        return this.terminals.get(id);
    }

    public getTerminals(): TerminalInfo[] {
        return Array.from(this.terminals.values());
    }

    public stopTerminal(id: string): void {
        const terminalInfo = this.terminals.get(id);
        if (terminalInfo) {
            terminalInfo.terminal.dispose();
            terminalInfo.status = 'stopped';
            this.terminals.delete(id);
            this.outputChannel.appendLine(`Stopped terminal ${terminalInfo.name}`);
        }
    }

    public dispose(): void {
        for (const terminalInfo of this.terminals.values()) {
            terminalInfo.terminal.dispose();
        }
        this.terminals.clear();
        this.outputChannel.dispose();
    }
}
