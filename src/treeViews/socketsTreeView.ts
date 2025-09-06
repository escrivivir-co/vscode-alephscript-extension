import * as vscode from 'vscode';
import { SocketMonitor } from '../socketMonitor';

export interface SocketTreeItem {
    id: string;
    label: string;
    description?: string;
    connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
    roomName?: string;
    clientCount?: number;
    messageCount?: number;
    children?: SocketTreeItem[];
}

export class SocketsTreeDataProvider implements vscode.TreeDataProvider<SocketTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SocketTreeItem | undefined | null | void> = new vscode.EventEmitter<SocketTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SocketTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private socketRooms: Map<string, SocketTreeItem> = new Map();
    private connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' = 'disconnected';
    private lastServerCheck: Date = new Date();

    constructor(private socketMonitor: SocketMonitor) {
        // Listen for Socket.IO events to update TreeView
        this.setupSocketEventListeners();
    }

    private setupSocketEventListeners(): void {
        // This would integrate with SocketMonitor's events
        // For now, we'll simulate with periodic refresh
        setInterval(() => {
            this.refreshSocketData();
        }, 5000);
    }

    refresh(): void {
        this.refreshSocketData();
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: SocketTreeItem): vscode.TreeItem {
        const treeItem = new vscode.TreeItem(element.label, element.children ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
        
        treeItem.id = element.id;
        treeItem.description = element.description;
        treeItem.tooltip = this.generateTooltip(element);
        
        // Connection status icons
        if (element.children) {
            // Root or room nodes
            switch (element.connectionStatus) {
                case 'connected':
                    treeItem.iconPath = new vscode.ThemeIcon('radio-tower', new vscode.ThemeColor('testing.iconPassed'));
                    break;
                case 'connecting':
                    treeItem.iconPath = new vscode.ThemeIcon('loading~spin', new vscode.ThemeColor('testing.iconQueued'));
                    break;
                case 'disconnected':
                    treeItem.iconPath = new vscode.ThemeIcon('circle-large-outline', new vscode.ThemeColor('testing.iconSkipped'));
                    break;
                case 'error':
                    treeItem.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('testing.iconFailed'));
                    break;
            }
        } else {
            // Individual connection nodes
            treeItem.iconPath = new vscode.ThemeIcon('account', new vscode.ThemeColor('testing.iconPassed'));
        }

        // Context value for commands
        if (element.children) {
            treeItem.contextValue = element.roomName ? 'socketRoom' : 'socketServer';
        } else {
            treeItem.contextValue = 'socketClient';
        }
        
        return treeItem;
    }

    getChildren(element?: SocketTreeItem): Thenable<SocketTreeItem[]> {
        if (!element) {
            // Root level - show connection status and rooms
            return Promise.resolve([
                {
                    id: 'socket-server',
                    label: 'Socket.IO Server',
                    description: this.connectionStatus === 'connected' ? 'localhost:3000' : 'Disconnected',
                    connectionStatus: this.connectionStatus,
                    children: this.connectionStatus === 'connected' ? [] : undefined
                }
            ]);
        }

        if (element.id === 'socket-server' && element.connectionStatus === 'connected') {
            return this.getSocketRooms();
        }

        if (element.roomName) {
            return this.getRoomClients(element.roomName);
        }

        return Promise.resolve([]);
    }

    private async getSocketRooms(): Promise<SocketTreeItem[]> {
        // Mock data - in real implementation would get from SocketMonitor
        const rooms: SocketTreeItem[] = [
            {
                id: 'room-application',
                label: 'Application',
                description: '3 clients connected',
                connectionStatus: 'connected',
                roomName: 'Application',
                clientCount: 3,
                messageCount: 127,
                children: []
            },
            {
                id: 'room-system',
                label: 'System',
                description: '1 client connected',
                connectionStatus: 'connected',
                roomName: 'System',
                clientCount: 1,
                messageCount: 45,
                children: []
            },
            {
                id: 'room-userinterface',
                label: 'UserInterface',
                description: '2 clients connected',
                connectionStatus: 'connected',
                roomName: 'UserInterface',
                clientCount: 2,
                messageCount: 89,
                children: []
            },
            {
                id: 'room-unassigned',
                label: 'Unassigned Clients',
                description: '1 client',
                connectionStatus: 'connected',
                roomName: '__unassigned__',
                clientCount: 1,
                messageCount: 5,
                children: []
            }
        ];

        // Update internal state
        this.socketRooms.clear();
        rooms.forEach(room => this.socketRooms.set(room.id, room));

        return rooms;
    }

    private async getRoomClients(roomName: string): Promise<SocketTreeItem[]> {
        // Mock clients data
        const clients: SocketTreeItem[] = [];
        
        const room = Array.from(this.socketRooms.values()).find(r => r.roomName === roomName);
        if (!room || !room.clientCount) return clients;

        for (let i = 0; i < room.clientCount; i++) {
            clients.push({
                id: `client-${roomName}-${i}`,
                label: `Client ${i + 1}`,
                description: `socket_${Math.random().toString(36).substr(2, 9)}`,
                connectionStatus: 'connected'
            });
        }

        return clients;
    }

    private generateTooltip(element: SocketTreeItem): string {
        if (element.children) {
            if (element.roomName && element.roomName !== '__unassigned__') {
                return `Room: ${element.roomName}\n` +
                       `Clients: ${element.clientCount || 0}\n` +
                       `Messages: ${element.messageCount || 0}\n` +
                       `Status: ${element.connectionStatus}`;
            } else {
                return `Socket.IO Server\n` +
                       `Status: ${element.connectionStatus}\n` +
                       `Last check: ${this.lastServerCheck.toLocaleTimeString()}`;
            }
        } else {
            return `Client ID: ${element.description}\n` +
                   `Room: ${element.roomName || 'None'}\n` +
                   `Status: ${element.connectionStatus}`;
        }
    }

    private refreshSocketData(): void {
        // In real implementation, this would query SocketMonitor for current state
        this.lastServerCheck = new Date();
        
        // Simulate connection status changes
        const random = Math.random();
        if (random > 0.8) {
            this.connectionStatus = 'connected';
        } else if (random > 0.6) {
            this.connectionStatus = 'disconnected';
        } else {
            this.connectionStatus = this.connectionStatus; // Keep current
        }
    }

    // Public methods for commands
    public async connectToServer(url: string = 'ws://localhost:3000'): Promise<void> {
        this.connectionStatus = 'connecting';
        this.refresh();
        
        try {
            // Would use SocketMonitor.connect() in real implementation
            await this.simulateConnection();
            this.connectionStatus = 'connected';
            vscode.window.showInformationMessage(`Connected to Socket.IO server: ${url}`);
        } catch (error) {
            this.connectionStatus = 'error';
            vscode.window.showErrorMessage(`Failed to connect: ${error}`);
        }
        
        this.refresh();
    }

    public async disconnectFromServer(): Promise<void> {
        this.connectionStatus = 'disconnected';
        this.socketRooms.clear();
        this.refresh();
        vscode.window.showInformationMessage('Disconnected from Socket.IO server');
    }

    public async joinRoom(roomName: string): Promise<void> {
        if (this.connectionStatus !== 'connected') {
            vscode.window.showWarningMessage('Not connected to Socket.IO server');
            return;
        }

        // Would use SocketMonitor.joinRoom() in real implementation
        vscode.window.showInformationMessage(`Joined room: ${roomName}`);
        this.refresh();
    }

    public async leaveRoom(roomName: string): Promise<void> {
        if (this.connectionStatus !== 'connected') {
            vscode.window.showWarningMessage('Not connected to Socket.IO server');
            return;
        }

        // Would use SocketMonitor.leaveRoom() in real implementation
        vscode.window.showInformationMessage(`Left room: ${roomName}`);
        this.refresh();
    }

    public async sendTestMessage(roomName: string): Promise<void> {
        if (this.connectionStatus !== 'connected') {
            vscode.window.showWarningMessage('Not connected to Socket.IO server');
            return;
        }

        const message = {
            source: 'vscode-extension',
            timestamp: new Date().toISOString(),
            data: { test: true, message: 'Hello from VS Code!' }
        };

        // Would use SocketMonitor.sendMessage() in real implementation
        vscode.window.showInformationMessage(`Test message sent to room: ${roomName}`);
    }

    public getConnectionStatus(): string {
        return this.connectionStatus;
    }

    public getConnectedRooms(): string[] {
        return Array.from(this.socketRooms.values())
                   .filter(room => room.roomName && room.roomName !== '__unassigned__')
                   .map(room => room.roomName!);
    }

    private async simulateConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.2) { // 80% success rate
                    resolve();
                } else {
                    reject(new Error('Connection timeout'));
                }
            }, 1000);
        });
    }
}
