"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessManager = void 0;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const path = require("path");
class ProcessManager {
    constructor() {
        this.processes = new Map();
        this.outputChannel = vscode.window.createOutputChannel('MCP Socket Manager');
    }
    async startLauncher(configPath) {
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
            }
            catch (e) {
                // No package.json or no start script, use npx tsx
            }
            const launcherProcess = (0, child_process_1.spawn)(command, args, {
                cwd: cwd,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });
            const processInfo = {
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
        }
        catch (error) {
            this.log(`Failed to start launcher: ${error}`);
            throw error;
        }
    }
    async stopLauncher() {
        const processInfo = this.processes.get('launcher');
        if (processInfo && processInfo.status === 'running') {
            processInfo.process.kill('SIGTERM');
            processInfo.status = 'stopped';
            this.processes.delete('launcher');
            this.log('Launcher stopped');
        }
    }
    async startMCPServer(serverId, port) {
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
            const mcpProcess = (0, child_process_1.spawn)(command, args, {
                cwd: cwd,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true,
                env: { ...process.env, PORT: port.toString() }
            });
            const processInfo = {
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
        }
        catch (error) {
            this.log(`Failed to start MCP server ${serverId}: ${error}`);
            throw error;
        }
    }
    async stopMCPServer(serverId) {
        const processInfo = this.processes.get(serverId);
        if (processInfo && processInfo.status === 'running') {
            processInfo.process.kill('SIGTERM');
            processInfo.status = 'stopped';
            this.processes.delete(serverId);
            this.log(`MCP server ${serverId} stopped`);
        }
    }
    getProcesses() {
        return Array.from(this.processes.values());
    }
    getProcess(id) {
        return this.processes.get(id);
    }
    showProcessLogs(id) {
        const processInfo = this.processes.get(id);
        if (processInfo) {
            this.outputChannel.clear();
            this.outputChannel.appendLine(`=== Logs for ${processInfo.name} ===`);
            processInfo.logs.forEach(log => this.outputChannel.appendLine(log));
            this.outputChannel.show();
        }
    }
    log(message) {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] ${message}`);
    }
    dispose() {
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
exports.ProcessManager = ProcessManager;
//# sourceMappingURL=processManager.js.map