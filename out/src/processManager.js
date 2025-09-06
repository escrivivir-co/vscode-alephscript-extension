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
exports.ProcessManager = void 0;
const cp = __importStar(require("child_process"));
const path = __importStar(require("path"));
class ProcessManager {
    constructor() {
        this.processes = new Map();
        this.processInfo = new Map();
    }
    static getInstance() {
        if (!ProcessManager.instance) {
            ProcessManager.instance = new ProcessManager();
        }
        return ProcessManager.instance;
    }
    async startProcess(name, command, args, workingDir, port) {
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
                        const info = this.processInfo.get(name);
                        info.status = 'stopped';
                        this.processInfo.set(name, info);
                    }
                });
                console.log(`Process ${name} started with PID ${process.pid}`);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`Failed to start process ${name}:`, error);
            return false;
        }
    }
    async stopProcess(name) {
        try {
            const process = this.processes.get(name);
            if (process && !process.killed) {
                process.kill('SIGTERM');
                this.processes.delete(name);
                if (this.processInfo.has(name)) {
                    const info = this.processInfo.get(name);
                    info.status = 'stopped';
                    this.processInfo.set(name, info);
                }
                console.log(`Process ${name} stopped`);
                return true;
            }
            return false;
        }
        catch (error) {
            console.error(`Failed to stop process ${name}:`, error);
            return false;
        }
    }
    getProcessInfo(name) {
        return this.processInfo.get(name);
    }
    getAllProcesses() {
        return Array.from(this.processInfo.values());
    }
    isProcessRunning(name) {
        const process = this.processes.get(name);
        return process !== undefined && !process.killed;
    }
    async killAllProcesses() {
        const promises = Array.from(this.processes.keys()).map(name => this.stopProcess(name));
        await Promise.all(promises);
    }
    getRunningProcessesCount() {
        return Array.from(this.processInfo.values())
            .filter(info => info.status === 'running').length;
    }
    async getPortStatus(port) {
        // Simple implementation - could be enhanced with actual port checking
        return Array.from(this.processInfo.values())
            .some(info => info.port === port && info.status === 'running');
    }
    // Launcher-specific methods
    async startLauncher(configPath) {
        const workingDir = path.dirname(configPath);
        return await this.startProcess('launcher', 'node', ['launcher.js', configPath], workingDir, 3050);
    }
    async stopLauncher() {
        return await this.stopProcess('launcher');
    }
    // MCP Server methods
    async startMCPServer(serverId, port) {
        const workingDir = path.join(__dirname, '..', '..', 'mcp-servers', serverId);
        return await this.startProcess(serverId, 'node', ['index.js'], workingDir, port);
    }
    async stopMCPServer(serverId) {
        return await this.stopProcess(serverId);
    }
    // UI-specific methods (reusing MCP server logic for now)
    async startUI(uiId, port) {
        const workingDir = path.join(__dirname, '..', '..', 'ui-servers', uiId);
        return await this.startProcess(uiId, 'node', ['server.js'], workingDir, port);
    }
    async stopUI(uiId) {
        return await this.stopProcess(uiId);
    }
    // Process information methods
    getProcess(processId) {
        return this.getProcessInfo(processId);
    }
    getProcesses() {
        return this.getAllProcesses();
    }
    // Show process logs (placeholder - could be enhanced)
    showProcessLogs(processId) {
        const processInfo = this.getProcessInfo(processId);
        if (processInfo) {
            console.log(`Logs for process ${processId}:`, processInfo);
        }
    }
    // Dispose method for cleanup
    dispose() {
        this.killAllProcesses();
        this.processes.clear();
        this.processInfo.clear();
    }
}
exports.ProcessManager = ProcessManager;
//# sourceMappingURL=processManager.js.map