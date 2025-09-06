import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

export interface ProcessInfo {
    id?: string;
    name: string;
    pid: number;
    command: string;
    status: 'running' | 'stopped' | 'unknown';
    port?: number;
    workingDirectory: string;
    startTime?: Date;
}

export class ProcessManager {
    private static instance: ProcessManager;
    private processes: Map<string, cp.ChildProcess> = new Map();
    private processInfo: Map<string, ProcessInfo> = new Map();

    private constructor() {}

    static getInstance(): ProcessManager {
        if (!ProcessManager.instance) {
            ProcessManager.instance = new ProcessManager();
        }
        return ProcessManager.instance;
    }

    async startProcess(name: string, command: string, args: string[], workingDir: string, port?: number): Promise<boolean> {
        try {
            if (this.processes.has(name)) {
                console.log(`Process ${name} is already running`);
                return false;
            }

            const process = cp.spawn(command, args, {
                cwd: workingDir,
                shell: true
            });

            if (process.pid) {
                this.processes.set(name, process);
                this.processInfo.set(name, {
                    id: name,
                    name,
                    pid: process.pid,
                    command: `${command} ${args.join(' ')}`,
                    status: 'running',
                    port,
                    workingDirectory: workingDir,
                    startTime: new Date()
                });

                process.on('exit', (code) => {
                    console.log(`Process ${name} exited with code ${code}`);
                    this.processes.delete(name);
                    if (this.processInfo.has(name)) {
                        const info = this.processInfo.get(name)!;
                        info.status = 'stopped';
                        this.processInfo.set(name, info);
                    }
                });

                console.log(`Process ${name} started with PID ${process.pid}`);
                return true;
            }

            return false;
        } catch (error) {
            console.error(`Failed to start process ${name}:`, error);
            return false;
        }
    }

    async stopProcess(name: string): Promise<boolean> {
        try {
            const process = this.processes.get(name);
            if (process && !process.killed) {
                process.kill('SIGTERM');
                this.processes.delete(name);
                
                if (this.processInfo.has(name)) {
                    const info = this.processInfo.get(name)!;
                    info.status = 'stopped';
                    this.processInfo.set(name, info);
                }
                
                console.log(`Process ${name} stopped`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Failed to stop process ${name}:`, error);
            return false;
        }
    }

    getProcessInfo(name: string): ProcessInfo | undefined {
        return this.processInfo.get(name);
    }

    getAllProcesses(): ProcessInfo[] {
        return Array.from(this.processInfo.values());
    }

    isProcessRunning(name: string): boolean {
        const process = this.processes.get(name);
        return process !== undefined && !process.killed;
    }

    async killAllProcesses(): Promise<void> {
        const promises = Array.from(this.processes.keys()).map(name => this.stopProcess(name));
        await Promise.all(promises);
    }

    getRunningProcessesCount(): number {
        return Array.from(this.processInfo.values())
            .filter(info => info.status === 'running').length;
    }

    async getPortStatus(port: number): Promise<boolean> {
        // Simple implementation - could be enhanced with actual port checking
        return Array.from(this.processInfo.values())
            .some(info => info.port === port && info.status === 'running');
    }

    // Launcher-specific methods
    async startLauncher(configPath: string): Promise<boolean> {
        const workingDir = path.dirname(configPath);
        return await this.startProcess('launcher', 'node', ['launcher.js', configPath], workingDir, 3050);
    }

    async stopLauncher(): Promise<boolean> {
        return await this.stopProcess('launcher');
    }

    // MCP Server methods
    async startMCPServer(serverId: string, port: number): Promise<boolean> {
        const workingDir = path.join(__dirname, '..', '..', 'mcp-servers', serverId);
        return await this.startProcess(serverId, 'node', ['index.js'], workingDir, port);
    }

    async stopMCPServer(serverId: string): Promise<boolean> {
        return await this.stopProcess(serverId);
    }

    // UI-specific methods (reusing MCP server logic for now)
    async startUI(uiId: string, port: number): Promise<boolean> {
        const workingDir = path.join(__dirname, '..', '..', 'ui-servers', uiId);
        return await this.startProcess(uiId, 'node', ['server.js'], workingDir, port);
    }

    async stopUI(uiId: string): Promise<boolean> {
        return await this.stopProcess(uiId);
    }

    // Process information methods
    getProcess(processId: string): ProcessInfo | undefined {
        return this.getProcessInfo(processId);
    }

    getProcesses(): ProcessInfo[] {
        return this.getAllProcesses();
    }

    // Show process logs (placeholder - could be enhanced)
    showProcessLogs(processId: string): void {
        const processInfo = this.getProcessInfo(processId);
        if (processInfo) {
            console.log(`Logs for process ${processId}:`, processInfo);
        }
    }

    // Dispose method for cleanup
    dispose(): void {
        this.killAllProcesses();
        this.processes.clear();
        this.processInfo.clear();
    }
}