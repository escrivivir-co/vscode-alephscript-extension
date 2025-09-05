# MCP Socket Gamification Manager VS Code Extension

## Overview

The MCP Socket Gamification Manager is a VS Code extension designed to manage and monitor a sophisticated gamification ecosystem built on the Model Context Protocol (MCP) and Socket.io. The extension provides a comprehensive development and management interface for launching multiple gamification UIs, monitoring MCP servers, and orchestrating real-time communication between various system components.

This extension serves as a central control hub for X+1 type gamification applications that utilize MCP servers for state management, Socket.io for real-time communication, and multiple UI instances for different user experiences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Extension Architecture
The extension follows a modular TypeScript architecture with five core managers:
- **ConfigEditor**: Visual configuration management with form-based editing
- **ProcessManager**: Lifecycle management for launchers, MCP servers, and UI processes
- **SocketMonitor**: Real-time monitoring of Socket.io communications across three channels (Application, System, UserInterface)
- **UIManager**: Management of multiple gamification UI instances
- **MCPServerManager**: Health monitoring and control of MCP server instances

### Communication Architecture
The system implements a three-channel Socket.io communication pattern:
- **Application Channel**: Game logic and agent interactions
- **System Channel**: Infrastructure and health monitoring
- **UserInterface Channel**: UI updates and user interactions

### Configuration Management
JSON-based configuration system supporting:
- Launcher settings (Ollama integration, model requirements, ports)
- Game definitions (agents, sessions, MCP server bindings)
- MCP server configurations with health checking
- UI instance definitions with type and port specifications
- Orchestration settings (replay buffers, logging, message routing)

### Process Management
Multi-process launcher system that coordinates:
- X+1 application launcher using tsx/npm scripts
- Multiple MCP server instances with independent lifecycles
- Gamification UI processes with different types (console, web, custom)
- Health monitoring and automatic restart capabilities

### Agent System
Support for multiple AI agents with:
- Role-based configurations (narrator, guide, etc.)
- MCP server bindings for different capabilities
- Priority and rate limiting systems
- Personality and influence parameters

## External Dependencies

### Core Runtime
- **Node.js**: JavaScript runtime environment
- **TypeScript**: Type-safe JavaScript compilation
- **Socket.io Client**: Real-time bidirectional communication

### VS Code Integration
- **VS Code Extension API**: Core extension functionality
- **Webview API**: Custom UI panels within VS Code
- **Configuration API**: Workspace and user settings management

### Development Tools
- **tsx**: TypeScript execution for launcher scripts
- **Yeoman Generator**: Extension scaffolding and development setup
- **VSCE**: VS Code extension packaging and publishing

### External Services
- **Ollama**: Local LLM serving (configurable URL, default localhost:11434)
- **MCP Servers**: Multiple server types including state-machine-server, wiki-mcp-browser, devops-mcp-server
- **Web Browsers**: For opening and managing web-based UI instances

### Optional Integrations
- **npm Scripts**: Alternative process launching mechanism
- **Package.json Scripts**: Custom launcher script support
- **File System**: Configuration file management and monitoring