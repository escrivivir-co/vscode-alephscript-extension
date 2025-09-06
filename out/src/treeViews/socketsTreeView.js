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
exports.SocketsTreeDataProvider = void 0;
const vscode = __importStar(require("vscode"));
class SocketsTreeDataProvider {
    constructor(socketMonitor) {
        this.socketMonitor = socketMonitor;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.socketRooms = new Map();
        this.connectionStatus = 'disconnected';
        this.lastServerCheck = new Date();
        // Listen for Socket.IO events to update TreeView
        this.setupSocketEventListeners();
    }
    setupSocketEventListeners() {
        // This would integrate with SocketMonitor's events
        // For now, we'll simulate with periodic refresh
        setInterval(() => {
            this.refreshSocketData();
        }, 5000);
    }
    refresh() {
        this.refreshSocketData();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
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
        }
        else {
            // Individual connection nodes
            treeItem.iconPath = new vscode.ThemeIcon('account', new vscode.ThemeColor('testing.iconPassed'));
        }
        // Context value for commands
        if (element.children) {
            treeItem.contextValue = element.roomName ? 'socketRoom' : 'socketServer';
        }
        else {
            treeItem.contextValue = 'socketClient';
        }
        return treeItem;
    }
    getChildren(element) {
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
    async getSocketRooms() {
        // Mock data - in real implementation would get from SocketMonitor
        const rooms = [
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
    async getRoomClients(roomName) {
        // Mock clients data
        const clients = [];
        const room = Array.from(this.socketRooms.values()).find(r => r.roomName === roomName);
        if (!room || !room.clientCount)
            return clients;
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
    generateTooltip(element) {
        if (element.children) {
            if (element.roomName && element.roomName !== '__unassigned__') {
                return `Room: ${element.roomName}\n` +
                    `Clients: ${element.clientCount || 0}\n` +
                    `Messages: ${element.messageCount || 0}\n` +
                    `Status: ${element.connectionStatus}`;
            }
            else {
                return `Socket.IO Server\n` +
                    `Status: ${element.connectionStatus}\n` +
                    `Last check: ${this.lastServerCheck.toLocaleTimeString()}`;
            }
        }
        else {
            return `Client ID: ${element.description}\n` +
                `Room: ${element.roomName || 'None'}\n` +
                `Status: ${element.connectionStatus}`;
        }
    }
    refreshSocketData() {
        // In real implementation, this would query SocketMonitor for current state
        this.lastServerCheck = new Date();
        // Simulate connection status changes
        const random = Math.random();
        if (random > 0.8) {
            this.connectionStatus = 'connected';
        }
        else if (random > 0.6) {
            this.connectionStatus = 'disconnected';
        }
        else {
            this.connectionStatus = this.connectionStatus; // Keep current
        }
    }
    // Public methods for commands
    async connectToServer(url = 'ws://localhost:3000') {
        this.connectionStatus = 'connecting';
        this.refresh();
        try {
            // Would use SocketMonitor.connect() in real implementation
            await this.simulateConnection();
            this.connectionStatus = 'connected';
            vscode.window.showInformationMessage(`Connected to Socket.IO server: ${url}`);
        }
        catch (error) {
            this.connectionStatus = 'error';
            vscode.window.showErrorMessage(`Failed to connect: ${error}`);
        }
        this.refresh();
    }
    async disconnectFromServer() {
        this.connectionStatus = 'disconnected';
        this.socketRooms.clear();
        this.refresh();
        vscode.window.showInformationMessage('Disconnected from Socket.IO server');
    }
    async joinRoom(roomName) {
        if (this.connectionStatus !== 'connected') {
            vscode.window.showWarningMessage('Not connected to Socket.IO server');
            return;
        }
        // Would use SocketMonitor.joinRoom() in real implementation
        vscode.window.showInformationMessage(`Joined room: ${roomName}`);
        this.refresh();
    }
    async leaveRoom(roomName) {
        if (this.connectionStatus !== 'connected') {
            vscode.window.showWarningMessage('Not connected to Socket.IO server');
            return;
        }
        // Would use SocketMonitor.leaveRoom() in real implementation
        vscode.window.showInformationMessage(`Left room: ${roomName}`);
        this.refresh();
    }
    async sendTestMessage(roomName) {
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
    getConnectionStatus() {
        return this.connectionStatus;
    }
    getConnectedRooms() {
        return Array.from(this.socketRooms.values())
            .filter(room => room.roomName && room.roomName !== '__unassigned__')
            .map(room => room.roomName);
    }
    async simulateConnection() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.2) { // 80% success rate
                    resolve();
                }
                else {
                    reject(new Error('Connection timeout'));
                }
            }, 1000);
        });
    }
}
exports.SocketsTreeDataProvider = SocketsTreeDataProvider;
//# sourceMappingURL=socketsTreeView.js.map