"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketMonitor = void 0;
const vscode = require("vscode");
const socket_io_client_1 = require("socket.io-client");
class SocketMonitor {
    constructor() {
        this.messages = [];
        this.isConnected = false;
    }
    createOrShowPanel(extensionUri) {
        if (this.panel) {
            this.panel.reveal();
            return;
        }
        this.panel = vscode.window.createWebviewPanel('mcpSocketMonitor', 'Socket.io Monitor', vscode.ViewColumn.Two, {
            enableScripts: true,
            localResourceRoots: [extensionUri]
        });
        this.panel.webview.html = this.getWebviewContent();
        this.panel.onDidDispose(() => {
            this.disconnect();
            this.panel = undefined;
        });
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'connect':
                    this.connect(message.url);
                    break;
                case 'disconnect':
                    this.disconnect();
                    break;
                case 'clearMessages':
                    this.clearMessages();
                    break;
                case 'joinRoom':
                    this.joinRoom(message.room);
                    break;
                case 'leaveRoom':
                    this.leaveRoom(message.room);
                    break;
                case 'sendMessage':
                    this.sendMessage(message.room, message.channel, message.data);
                    break;
            }
        });
    }
    async connect(url) {
        try {
            if (this.socket) {
                this.socket.disconnect();
            }
            this.socket = (0, socket_io_client_1.io)(url, {
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });
            this.socket.on('connect', () => {
                this.isConnected = true;
                this.panel?.webview.postMessage({
                    command: 'connectionStatus',
                    connected: true,
                    socketId: this.socket?.id
                });
                // Subscribe to all public streams
                this.socket?.emit('join-room', 'Application');
                this.socket?.emit('join-room', 'System');
                this.socket?.emit('join-room', 'UserInterface');
            });
            this.socket.on('disconnect', () => {
                this.isConnected = false;
                this.panel?.webview.postMessage({
                    command: 'connectionStatus',
                    connected: false
                });
            });
            this.socket.on('connect_error', (error) => {
                this.panel?.webview.postMessage({
                    command: 'connectionError',
                    error: error.message
                });
            });
            // Listen for all message types
            this.socket.onAny((eventName, ...args) => {
                if (eventName !== 'connect' && eventName !== 'disconnect') {
                    this.handleMessage(eventName, args[0]);
                }
            });
            // Listen specifically for gamification events
            this.socket.on('Application', (data) => this.handleMessage('Application', data));
            this.socket.on('System', (data) => this.handleMessage('System', data));
            this.socket.on('UserInterface', (data) => this.handleMessage('UserInterface', data));
        }
        catch (error) {
            this.panel?.webview.postMessage({
                command: 'connectionError',
                error: `Failed to connect: ${error}`
            });
        }
    }
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = undefined;
            this.isConnected = false;
        }
    }
    handleMessage(eventName, data) {
        const message = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            room: data?.room || 'unknown',
            channel: this.determineChannel(eventName, data),
            type: eventName,
            data: data,
            source: data?.source,
            target: data?.target
        };
        this.messages.unshift(message); // Add to beginning for latest first
        // Keep only last 1000 messages
        if (this.messages.length > 1000) {
            this.messages = this.messages.slice(0, 1000);
        }
        this.panel?.webview.postMessage({
            command: 'newMessage',
            message: message
        });
    }
    determineChannel(eventName, data) {
        if (data?.channel) {
            return data.channel;
        }
        // Determine channel based on event name patterns
        if (eventName.includes('ui') || eventName.includes('UI') || eventName.includes('interface')) {
            return 'UserInterface';
        }
        else if (eventName.includes('system') || eventName.includes('server') || eventName.includes('process')) {
            return 'System';
        }
        else {
            return 'Application';
        }
    }
    clearMessages() {
        this.messages = [];
        this.panel?.webview.postMessage({
            command: 'messagesCleared'
        });
    }
    joinRoom(room) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join-room', room);
            this.panel?.webview.postMessage({
                command: 'roomJoined',
                room: room
            });
        }
    }
    leaveRoom(room) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave-room', room);
            this.panel?.webview.postMessage({
                command: 'roomLeft',
                room: room
            });
        }
    }
    sendMessage(room, channel, data) {
        if (this.socket && this.isConnected) {
            const message = {
                room: room,
                channel: channel,
                timestamp: new Date().toISOString(),
                source: 'vscode-extension',
                data: data
            };
            this.socket.emit(channel, message);
        }
    }
    getWebviewContent() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Socket.io Monitor</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 10px;
                    margin: 0;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--vscode-panel-border);
                }
                .connection-panel {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .status {
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                }
                .status.connected {
                    background: var(--vscode-terminal-ansiGreen);
                    color: black;
                }
                .status.disconnected {
                    background: var(--vscode-terminal-ansiRed);
                    color: white;
                }
                .btn {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 6px 12px;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .btn:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .btn.small {
                    padding: 4px 8px;
                    font-size: 11px;
                }
                input, select {
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 4px 8px;
                }
                .filters {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                    padding: 10px;
                    background: var(--vscode-panel-background);
                    border-radius: 4px;
                    align-items: center;
                }
                .messages-container {
                    height: 400px;
                    overflow-y: auto;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 10px;
                }
                .message {
                    border-bottom: 1px solid var(--vscode-list-hoverBackground);
                    padding: 8px 0;
                    font-size: 12px;
                }
                .message:last-child {
                    border-bottom: none;
                }
                .message-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                }
                .message-time {
                    color: var(--vscode-descriptionForeground);
                    font-size: 10px;
                }
                .message-channel {
                    padding: 2px 6px;
                    border-radius: 2px;
                    font-size: 10px;
                    font-weight: bold;
                }
                .channel-Application {
                    background: var(--vscode-terminal-ansiBlue);
                    color: white;
                }
                .channel-System {
                    background: var(--vscode-terminal-ansiYellow);
                    color: black;
                }
                .channel-UserInterface {
                    background: var(--vscode-terminal-ansiMagenta);
                    color: white;
                }
                .message-data {
                    background: var(--vscode-textCodeBlock-background);
                    padding: 6px;
                    border-radius: 3px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: 11px;
                    white-space: pre-wrap;
                    overflow: auto;
                    max-height: 200px;
                }
                .room-management {
                    margin-bottom: 15px;
                    padding: 10px;
                    background: var(--vscode-panel-background);
                    border-radius: 4px;
                }
                .send-message {
                    margin-top: 15px;
                    padding: 10px;
                    background: var(--vscode-panel-background);
                    border-radius: 4px;
                }
                .send-message textarea {
                    width: 100%;
                    height: 60px;
                    background: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 4px;
                    padding: 8px;
                    resize: vertical;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Socket.io Bus Monitor</h2>
                <div class="connection-panel">
                    <input type="text" id="socketUrl" placeholder="ws://localhost:3000" value="ws://localhost:3000">
                    <button class="btn" onclick="connect()">Connect</button>
                    <button class="btn" onclick="disconnect()">Disconnect</button>
                    <span id="connectionStatus" class="status disconnected">Disconnected</span>
                </div>
            </div>

            <div class="room-management">
                <h4>Room Management</h4>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <input type="text" id="roomName" placeholder="Enter room name">
                    <button class="btn small" onclick="joinRoom()">Join Room</button>
                    <button class="btn small" onclick="leaveRoom()">Leave Room</button>
                    <span style="margin-left: 20px; font-size: 12px;">
                        Auto-joined: Application, System, UserInterface
                    </span>
                </div>
            </div>

            <div class="filters">
                <label>Filter by Channel:</label>
                <select id="channelFilter" onchange="filterMessages()">
                    <option value="all">All Channels</option>
                    <option value="Application">Application</option>
                    <option value="System">System</option>
                    <option value="UserInterface">UserInterface</option>
                </select>
                
                <label>Filter by Room:</label>
                <input type="text" id="roomFilter" placeholder="Room name" onchange="filterMessages()">
                
                <button class="btn small" onclick="clearMessages()">Clear</button>
                <span style="margin-left: auto; font-size: 12px; color: var(--vscode-descriptionForeground);">
                    Messages: <span id="messageCount">0</span>
                </span>
            </div>

            <div class="messages-container" id="messagesContainer">
                <div style="text-align: center; color: var(--vscode-descriptionForeground); padding: 20px;">
                    Connect to socket.io server to monitor messages
                </div>
            </div>

            <div class="send-message">
                <h4>Send Message</h4>
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                    <input type="text" id="sendRoom" placeholder="Room" value="Application">
                    <select id="sendChannel">
                        <option value="Application">Application</option>
                        <option value="System">System</option>
                        <option value="UserInterface">UserInterface</option>
                    </select>
                    <button class="btn" onclick="sendMessage()">Send</button>
                </div>
                <textarea id="messageData" placeholder="Enter JSON message data...">{"test": "message from VS Code"}</textarea>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                let allMessages = [];

                function connect() {
                    const url = document.getElementById('socketUrl').value;
                    vscode.postMessage({ command: 'connect', url: url });
                }

                function disconnect() {
                    vscode.postMessage({ command: 'disconnect' });
                }

                function clearMessages() {
                    vscode.postMessage({ command: 'clearMessages' });
                }

                function joinRoom() {
                    const room = document.getElementById('roomName').value;
                    if (room) {
                        vscode.postMessage({ command: 'joinRoom', room: room });
                    }
                }

                function leaveRoom() {
                    const room = document.getElementById('roomName').value;
                    if (room) {
                        vscode.postMessage({ command: 'leaveRoom', room: room });
                    }
                }

                function sendMessage() {
                    const room = document.getElementById('sendRoom').value;
                    const channel = document.getElementById('sendChannel').value;
                    const dataText = document.getElementById('messageData').value;
                    
                    try {
                        const data = JSON.parse(dataText);
                        vscode.postMessage({ 
                            command: 'sendMessage', 
                            room: room, 
                            channel: channel, 
                            data: data 
                        });
                    } catch (e) {
                        alert('Invalid JSON data');
                    }
                }

                function filterMessages() {
                    const channelFilter = document.getElementById('channelFilter').value;
                    const roomFilter = document.getElementById('roomFilter').value.toLowerCase();
                    
                    const filtered = allMessages.filter(msg => {
                        const channelMatch = channelFilter === 'all' || msg.channel === channelFilter;
                        const roomMatch = !roomFilter || msg.room.toLowerCase().includes(roomFilter);
                        return channelMatch && roomMatch;
                    });
                    
                    renderMessages(filtered);
                }

                function renderMessages(messages) {
                    const container = document.getElementById('messagesContainer');
                    document.getElementById('messageCount').textContent = messages.length;
                    
                    if (messages.length === 0) {
                        container.innerHTML = '<div style="text-align: center; color: var(--vscode-descriptionForeground); padding: 20px;">No messages to display</div>';
                        return;
                    }
                    
                    container.innerHTML = messages.map(msg => \`
                        <div class="message">
                            <div class="message-header">
                                <div>
                                    <span class="message-channel channel-\${msg.channel}">\${msg.channel}</span>
                                    <strong>\${msg.type}</strong>
                                    <span style="margin-left: 10px; color: var(--vscode-descriptionForeground);">Room: \${msg.room}</span>
                                    \${msg.source ? \`<span style="margin-left: 10px; color: var(--vscode-descriptionForeground);">From: \${msg.source}</span>\` : ''}
                                </div>
                                <span class="message-time">\${new Date(msg.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div class="message-data">\${JSON.stringify(msg.data, null, 2)}</div>
                        </div>
                    \`).join('');
                }

                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'connectionStatus':
                            const status = document.getElementById('connectionStatus');
                            if (message.connected) {
                                status.textContent = \`Connected (\${message.socketId})\`;
                                status.className = 'status connected';
                            } else {
                                status.textContent = 'Disconnected';
                                status.className = 'status disconnected';
                            }
                            break;
                        case 'connectionError':
                            alert(\`Connection error: \${message.error}\`);
                            break;
                        case 'newMessage':
                            allMessages.unshift(message.message);
                            if (allMessages.length > 1000) {
                                allMessages = allMessages.slice(0, 1000);
                            }
                            filterMessages();
                            break;
                        case 'messagesCleared':
                            allMessages = [];
                            filterMessages();
                            break;
                        case 'roomJoined':
                            console.log(\`Joined room: \${message.room}\`);
                            break;
                        case 'roomLeft':
                            console.log(\`Left room: \${message.room}\`);
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}
exports.SocketMonitor = SocketMonitor;
//# sourceMappingURL=socketMonitor.js.map