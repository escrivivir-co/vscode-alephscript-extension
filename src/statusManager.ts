import * as vscode from 'vscode';
import { TerminalManager, TerminalInfo } from './terminalManager';
import { ProcessManager, ProcessInfo } from './processManager';
import { SocketMonitor, SocketRoomInfo } from './socketMonitor';

export interface SystemStatus {
    terminals: TerminalInfo[];
    processes: ProcessInfo[];
    mcpServers: ServiceStatus[];
    gameUIs: ServiceStatus[];
    socketIO: SocketIOStatus;
    timestamp: Date;
}

export interface ServiceStatus {
    id: string;
    name: string;
    status: 'running' | 'stopped' | 'error' | 'unknown';
    port?: number;
    uptime?: number;
    lastCheck?: Date;
    details?: any;
}

export interface SocketIOStatus extends ServiceStatus {
    isConnected: boolean;
    rooms: SocketRoomInfo[];
    messageCount: number;
    connectionUrl?: string;
}

export class StatusManager {
    private statusBarItem: vscode.StatusBarItem;
    private outputChannel: vscode.OutputChannel;
    private statusPanel: vscode.WebviewPanel | undefined;
    private refreshInterval: NodeJS.Timeout | undefined;
    private currentStatus: SystemStatus | undefined;

    constructor(
        private terminalManager: TerminalManager,
        private processManager: ProcessManager,
        private socketMonitor?: SocketMonitor
    ) {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'alephscript.showStatusPanel';
        
        this.outputChannel = vscode.window.createOutputChannel('AlephScript Status');
        
        this.startPeriodicRefresh();
        this.updateStatus(); // Initial update
    }

    private startPeriodicRefresh(): void {
        // Update every 10 seconds
        this.refreshInterval = setInterval(() => {
            this.updateStatus();
        }, 10000);
    }

    public async updateStatus(): Promise<void> {
        try {
            const status: SystemStatus = {
                terminals: this.terminalManager.getTerminals(),
                processes: this.processManager.getProcesses(),
                mcpServers: await this.getMCPServerStatus(),
                gameUIs: await this.getGameUIStatus(),
                socketIO: await this.getSocketIOStatus(),
                timestamp: new Date()
            };

            this.currentStatus = status;
            this.updateStatusBar(status);
            this.updateStatusPanel(status);
            this.logStatusChange(status);
            
        } catch (error) {
            this.outputChannel.appendLine(`Error updating status: ${error}`);
        }
    }

    private updateStatusBar(status: SystemStatus): void {
        const runningTerminals = status.terminals.filter(t => t.status === 'running').length;
        const totalTerminals = status.terminals.length;
        
        const runningMCP = status.mcpServers.filter(s => s.status === 'running').length;
        const totalMCP = status.mcpServers.length;
        
        const runningUIs = status.gameUIs.filter(s => s.status === 'running').length;
        const totalUIs = status.gameUIs.length;

        const statusText = `AlephScript: T:${runningTerminals}/${totalTerminals} MCP:${runningMCP}/${totalMCP} UI:${runningUIs}/${totalUIs}`;
        
        this.statusBarItem.text = `$(server) ${statusText}`;
        this.statusBarItem.tooltip = `AlephScript System Status\n` +
            `Terminals: ${runningTerminals}/${totalTerminals} running\n` +
            `MCP Servers: ${runningMCP}/${totalMCP} running\n` +
            `Game UIs: ${runningUIs}/${totalUIs} running\n` +
            `Socket.IO: ${status.socketIO.status}\n` +
            `Last updated: ${status.timestamp.toLocaleTimeString()}`;
        
        // Color coding based on overall health
        const healthScore = (runningTerminals + runningMCP + runningUIs) / (totalTerminals + totalMCP + totalUIs);
        if (healthScore > 0.8) {
            this.statusBarItem.backgroundColor = undefined; // Default
        } else if (healthScore > 0.5) {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        } else {
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
        
        this.statusBarItem.show();
    }

    public showStatusPanel(): void {
        if (this.statusPanel) {
            this.statusPanel.reveal();
            return;
        }

        this.statusPanel = vscode.window.createWebviewPanel(
            'alephscriptStatus',
            'AlephScript System Status',
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );

        this.statusPanel.onDidDispose(() => {
            this.statusPanel = undefined;
        });

        if (this.currentStatus) {
            this.updateStatusPanel(this.currentStatus);
        }
    }

    private updateStatusPanel(status: SystemStatus): void {
        if (!this.statusPanel) return;

        this.statusPanel.webview.html = this.generateStatusHTML(status);
    }

    private generateStatusHTML(status: SystemStatus): string {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AlephScript System Status</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 20px;
                    line-height: 1.6;
                }
                .header {
                    border-bottom: 2px solid var(--vscode-panel-border);
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                }
                .status-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .status-card {
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 15px;
                    background: var(--vscode-panel-background);
                }
                .status-card h3 {
                    margin-top: 0;
                    color: var(--vscode-textLink-foreground);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .status-indicator {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    display: inline-block;
                }
                .status-running { background: var(--vscode-terminal-ansiGreen); }
                .status-stopped { background: var(--vscode-terminal-ansiYellow); }
                .status-error { background: var(--vscode-terminal-ansiRed); }
                .status-unknown { background: var(--vscode-descriptionForeground); }
                .service-list {
                    list-style: none;
                    padding: 0;
                }
                .service-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 0;
                    border-bottom: 1px solid var(--vscode-list-hoverBackground);
                }
                .service-item:last-child {
                    border-bottom: none;
                }
                .service-name {
                    font-weight: bold;
                }
                .service-details {
                    font-size: 0.9em;
                    color: var(--vscode-descriptionForeground);
                }
                .timestamp {
                    text-align: right;
                    color: var(--vscode-descriptionForeground);
                    font-size: 0.9em;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎮 AlephScript System Status</h1>
                <p>Real-time monitoring of MCP servers, game UIs, and system processes</p>
            </div>

            <div class="status-grid">
                <div class="status-card">
                    <h3>
                        <span class="status-indicator status-${this.getOverallTerminalStatus(status.terminals)}"></span>
                        Active Terminals (${status.terminals.filter(t => t.status === 'running').length}/${status.terminals.length})
                    </h3>
                    <ul class="service-list">
                        ${status.terminals.map(terminal => `
                            <li class="service-item">
                                <div>
                                    <div class="service-name">${terminal.name}</div>
                                    <div class="service-details">${terminal.command || 'No command'}</div>
                                </div>
                                <span class="status-indicator status-${terminal.status}"></span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="status-card">
                    <h3>
                        <span class="status-indicator status-${this.getOverallServiceStatus(status.mcpServers)}"></span>
                        MCP Servers (${status.mcpServers.filter(s => s.status === 'running').length}/${status.mcpServers.length})
                    </h3>
                    <ul class="service-list">
                        ${status.mcpServers.map(server => `
                            <li class="service-item">
                                <div>
                                    <div class="service-name">${server.name}</div>
                                    <div class="service-details">Port: ${server.port || 'N/A'}</div>
                                </div>
                                <span class="status-indicator status-${server.status}"></span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="status-card">
                    <h3>
                        <span class="status-indicator status-${this.getOverallServiceStatus(status.gameUIs)}"></span>
                        Game UIs (${status.gameUIs.filter(s => s.status === 'running').length}/${status.gameUIs.length})
                    </h3>
                    <ul class="service-list">
                        ${status.gameUIs.map(ui => `
                            <li class="service-item">
                                <div>
                                    <div class="service-name">${ui.name}</div>
                                    <div class="service-details">${ui.port ? `http://localhost:${ui.port}` : 'No port'}</div>
                                </div>
                                <span class="status-indicator status-${ui.status}"></span>
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div class="status-card">
                    <h3>
                        <span class="status-indicator status-${status.socketIO.status}"></span>
                        Socket.IO Server
                    </h3>
                    <ul class="service-list">
                        <li class="service-item">
                            <div>
                                <div class="service-name">${status.socketIO.name}</div>
                                <div class="service-details">Port: ${status.socketIO.port || 'N/A'}</div>
                            </div>
                            <span class="status-indicator status-${status.socketIO.status}"></span>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="timestamp">
                Last updated: ${status.timestamp.toLocaleString()}
            </div>
        </body>
        </html>`;
    }

    private getOverallTerminalStatus(terminals: TerminalInfo[]): string {
        if (terminals.length === 0) return 'unknown';
        const running = terminals.filter(t => t.status === 'running').length;
        if (running === terminals.length) return 'running';
        if (running === 0) return 'stopped';
        return 'error';
    }

    private getOverallServiceStatus(services: ServiceStatus[]): string {
        if (services.length === 0) return 'unknown';
        const running = services.filter(s => s.status === 'running').length;
        if (running === services.length) return 'running';
        if (running === 0) return 'stopped';
        return 'error';
    }

    private async getMCPServerStatus(): Promise<ServiceStatus[]> {
        // Mock data - in real implementation, would check actual MCP server health
        return [
            {
                id: 'state-machine-server',
                name: 'State Machine Server',
                status: 'stopped',
                port: 3001,
                lastCheck: new Date()
            },
            {
                id: 'wiki-mcp-browser',
                name: 'Wiki MCP Browser',
                status: 'stopped',
                port: 3002,
                lastCheck: new Date()
            },
            {
                id: 'devops-mcp-server',
                name: 'DevOps MCP Server',
                status: 'stopped',
                port: 3003,
                lastCheck: new Date()
            }
        ];
    }

    private async getGameUIStatus(): Promise<ServiceStatus[]> {
        // Mock data - would check actual UI health
        return [
            {
                id: 'threejs-gamify-ui',
                name: 'Three.js Gamify UI',
                status: 'stopped',
                port: 8080,
                lastCheck: new Date()
            },
            {
                id: 'webrtc-gamify-ui',
                name: 'WebRTC Gamify UI',
                status: 'stopped',
                port: 8082,
                lastCheck: new Date()
            },
            {
                id: 'blockly-gamify-ui',
                name: 'Blockly IDE',
                status: 'stopped',
                port: 9094,
                lastCheck: new Date()
            }
        ];
    }

    private async getSocketIOStatus(): Promise<SocketIOStatus> {
        if (!this.socketMonitor) {
            return {
                id: 'socket-server',
                name: 'Socket.IO Server',
                status: 'unknown',
                isConnected: false,
                rooms: [],
                messageCount: 0,
                lastCheck: new Date()
            };
        }

        const isConnected = this.socketMonitor.getConnectionStatus();
        const rooms = Array.from(this.socketMonitor.getRooms().values());
        const recentMessages = this.socketMonitor.getRecentMessages();

        return {
            id: 'socket-server',
            name: 'Socket.IO Server',
            status: isConnected ? 'running' : 'stopped',
            port: 3000,
            isConnected,
            rooms,
            messageCount: recentMessages.length,
            connectionUrl: isConnected ? 'ws://localhost:3000' : undefined,
            lastCheck: new Date()
        };
    }

    private logStatusChange(status: SystemStatus): void {
        // Only log if this is a significant change
        const runningCount = status.terminals.filter(t => t.status === 'running').length +
                           status.mcpServers.filter(s => s.status === 'running').length +
                           status.gameUIs.filter(s => s.status === 'running').length;

        this.outputChannel.appendLine(
            `[${status.timestamp.toLocaleTimeString()}] Status: ${runningCount} services running`
        );
    }

    public dispose(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.statusBarItem.dispose();
        this.outputChannel.dispose();
        this.statusPanel?.dispose();
    }
}
