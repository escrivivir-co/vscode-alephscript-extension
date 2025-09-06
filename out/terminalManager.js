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
exports.TerminalManager = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const loggingManager_1 = require("./loggingManager");
class TerminalManager {
    constructor() {
        this.terminals = new Map();
        this.outputChannel = vscode.window.createOutputChannel('AlephScript Terminals');
        this.logger = (0, loggingManager_1.createLogger)(loggingManager_1.LogCategory.TERMINAL, 'TerminalManager');
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
    async startMCPDriver() {
        const terminalId = 'mcp-driver';
        const name = 'AlephScript Driver';
        // Find the driver script
        const scriptPath = await this.findDriverScript();
        if (!scriptPath) {
            throw new Error('Could not find iniciar-driver.sh script');
        }
        return this.createAndRunTerminal(terminalId, name, scriptPath, path.dirname(scriptPath));
    }
    async startSocketServer() {
        const terminalId = 'socket-server';
        const name = 'Socket.IO Server';
        const scriptPath = await this.findSocketScript('arrancar_server.sh');
        if (!scriptPath) {
            throw new Error('Could not find arrancar_server.sh script');
        }
        return this.createAndRunTerminal(terminalId, name, scriptPath, path.dirname(scriptPath));
    }
    async startSocketAdmin() {
        const terminalId = 'socket-admin';
        const name = 'Socket.IO Admin';
        const scriptPath = await this.findSocketScript('arrancar_admin.sh');
        if (!scriptPath) {
            throw new Error('Could not find arrancar_admin.sh script');
        }
        return this.createAndRunTerminal(terminalId, name, scriptPath, path.dirname(scriptPath));
    }
    async startUIProcess(uiId, uiType, port) {
        const terminalId = `ui-${uiId}`;
        const name = `UI: ${uiId}`;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }
        // Build command based on UI type
        let command;
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
    createAndRunTerminal(id, name, command, cwd) {
        // Close existing terminal if running
        if (this.terminals.has(id)) {
            const existing = this.terminals.get(id);
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
        const terminalInfo = {
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
    getShellPath() {
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
    async findDriverScript() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder)
            return null;
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
    async findSocketScript(scriptName) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder)
            return null;
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
    getTerminal(id) {
        return this.terminals.get(id);
    }
    getTerminals() {
        return Array.from(this.terminals.values());
    }
    stopTerminal(id) {
        const terminalInfo = this.terminals.get(id);
        if (terminalInfo) {
            terminalInfo.terminal.dispose();
            terminalInfo.status = 'stopped';
            this.terminals.delete(id);
            this.outputChannel.appendLine(`Stopped terminal ${terminalInfo.name}`);
        }
    }
    dispose() {
        for (const terminalInfo of this.terminals.values()) {
            terminalInfo.terminal.dispose();
        }
        this.terminals.clear();
        this.outputChannel.dispose();
    }
}
exports.TerminalManager = TerminalManager;
//# sourceMappingURL=terminalManager.js.map