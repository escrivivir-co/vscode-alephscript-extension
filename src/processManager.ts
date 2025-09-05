import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

export interface ProcessInfo {
    id: string;
    name: string;
    process: ChildProcess;
    status: 'running' | 'stopped' | 'error';
    port?: number;
    logs: string[];
}

export class ProcessManager {
    private processes: Map<string, ProcessInfo> = new Map();
    private outputChannel: vscode.OutputChannel;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('MCP Socket Manager');
    }

    public async startLauncher(configPath: string): Promise<void> {
        try {
            this.log(`Starting launcher with config: ${configPath}`);
            
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const cwd = workspaceFolder.uri.fsPath;
            
            // Try different launch methods based on what's available
            let command = 'npx';
            let args = ['tsx', 'xplus1-app.ts', configPath];
            
            // Check if we have a package.json with scripts
            try {
                const packageJson = require(path.join(cwd, 'package.json'));
                if (packageJson.scripts && packageJson.scripts['start:launcher']) {
                    command = 'npm';
                    args = ['run', 'start:launcher', configPath];
                }
            } catch (e) {
                // No package.json or no start script, use npx tsx
            }

            const launcherProcess = spawn(command, args, {
                cwd: cwd,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });

            const processInfo: ProcessInfo = {
                id: 'launcher',
                name: 'X+1 Launcher',
                process: launcherProcess,
                status: 'running',
                logs: []
            };

            this.processes.set('launcher', processInfo);

            launcherProcess.stdout?.on('data', (data) => {
                const message = data.toString();
                this.log(`[Launcher] ${message}`);
                processInfo.logs.push(message);
            });

            launcherProcess.stderr?.on('data', (data) => {
                const message = data.toString();
                this.log(`[Launcher Error] ${message}`);
                processInfo.logs.push(`ERROR: ${message}`);
            });

            launcherProcess.on('close', (code) => {
                processInfo.status = code === 0 ? 'stopped' : 'error';
                this.log(`[Launcher] Process exited with code ${code}`);
                
                if (code !== 0) {
                    vscode.window.showErrorMessage(`Launcher exited with code ${code}`);
                }
            });

            launcherProcess.on('error', (error) => {
                processInfo.status = 'error';
                this.log(`[Launcher] Process error: ${error.message}`);
                vscode.window.showErrorMessage(`Launcher error: ${error.message}`);
            });

            vscode.window.showInformationMessage('Launcher started successfully');

        } catch (error) {
            this.log(`Failed to start launcher: ${error}`);
            throw error;
        }
    }

    public async stopLauncher(): Promise<void> {
        const processInfo = this.processes.get('launcher');
        if (processInfo && processInfo.status === 'running') {
            processInfo.process.kill('SIGTERM');
            processInfo.status = 'stopped';
            this.processes.delete('launcher');
            this.log('Launcher stopped');
        }
    }

    public async startMCPServer(serverId: string, port: number): Promise<void> {
        try {
            this.log(`Starting MCP server: ${serverId} on port ${port}`);
            
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const cwd = workspaceFolder.uri.fsPath;
            
            // Common MCP server start patterns
            let command = 'npm';
            let args = ['run', `mcp:${serverId}`];
            
            const mcpProcess = spawn(command, args, {
                cwd: cwd,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                env: { ...process.env, PORT: port.toString() }
            });

            const processInfo: ProcessInfo = {
                id: serverId,
                name: `MCP Server: ${serverId}`,
                process: mcpProcess,
                status: 'running',
                port: port,
                logs: []
            };

            this.processes.set(serverId, processInfo);

            mcpProcess.stdout?.on('data', (data) => {
                const message = data.toString();
                this.log(`[${serverId}] ${message}`);
                processInfo.logs.push(message);
            });

            mcpProcess.stderr?.on('data', (data) => {
                const message = data.toString();
                this.log(`[${serverId} Error] ${message}`);
                processInfo.logs.push(`ERROR: ${message}`);
            });

            mcpProcess.on('close', (code) => {
                processInfo.status = code === 0 ? 'stopped' : 'error';
                this.log(`[${serverId}] Process exited with code ${code}`);
            });

            mcpProcess.on('error', (error) => {
                processInfo.status = 'error';
                this.log(`[${serverId}] Process error: ${error.message}`);
            });

        } catch (error) {
            this.log(`Failed to start MCP server ${serverId}: ${error}`);
            throw error;
        }
    }

    public async stopMCPServer(serverId: string): Promise<void> {
        const processInfo = this.processes.get(serverId);
        if (processInfo && processInfo.status === 'running') {
            processInfo.process.kill('SIGTERM');
            processInfo.status = 'stopped';
            this.processes.delete(serverId);
            this.log(`MCP server ${serverId} stopped`);
        }
    }

    public getProcesses(): ProcessInfo[] {
        return Array.from(this.processes.values());
    }

    public getProcess(id: string): ProcessInfo | undefined {
        return this.processes.get(id);
    }

    public showProcessLogs(id: string): void {
        const processInfo = this.processes.get(id);
        if (processInfo) {
            this.outputChannel.clear();
            this.outputChannel.appendLine(`=== Logs for ${processInfo.name} ===`);
            processInfo.logs.forEach(log => this.outputChannel.appendLine(log));
            this.outputChannel.show();
        }
    }

    private log(message: string): void {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
    }

    public dispose(): void {
        // Stop all processes
        for (const [id, processInfo] of this.processes) {
            if (processInfo.status === 'running') {
                processInfo.process.kill('SIGTERM');
            }
        }
        this.processes.clear();
        this.outputChannel.dispose();
    }
}