# RONDA 6 — INPUT - Configuration Management

## Objetivo 🎯
**Gestión completa de configuraciones AlephScript** con TreeView nativo, editor integrado y validación en tiempo real para archivos xplus1-config.json y configuraciones relacionadas.

## Contexto 📍
- **Primary config**: `state-machine-mcp-driver/examples/xplus1-app/xplus1-config.json`
- **Related configs**: webrtc-ui-config.json, socket-config.json, package.json
- **Current state**: ConfigsTreeDataProvider básico implementado en Round 2
- **Extension point**: Expandir funcionalidad existente sin breaking changes

## Alcance Detallado 🔧

### 1. **ConfigsTreeDataProvider Enhancement**
- Expandir TreeView `alephscript.configs` con detección automática  
- Categorizar configs por tipo y estado (valid/invalid/modified)
- Context menus específicos: open, validate, format, backup
- Visual indicators para health status de cada config

### 2. **Native Editor Integration**  
- **JSON Schema validation** con IntelliSense para xplus1-config.json
- **Real-time error highlighting** en editor VS Code
- **Auto-completion** para properties específicas AlephScript
- **Format on save** con consistent styling

### 3. **Live Configuration Reload**
- **File watchers** para cambios automáticos
- **Hot reload** sin restart de procesos
- **Propagation** a SocketMonitor, ProcessManager, TerminalManager
- **Rollback** functionality para configs inválidas

### 4. **Configuration Templates**
- Templates predefinidos para nuevos proyectos
- Wizard step-by-step para setup inicial
- Export/Import entre proyectos
- Version control integration

## Archivos Target 📁
### Principales
- `xplus1-config.json` - Core AlephScript configuration
- `webrtc-ui-config.json` - WebRTC UI settings  
- `socket-config.json` - Socket.IO room/channel config
- `node-red-config.json` - Node-RED flow settings

### Secundarios
- `package.json`, `tsconfig.json` - Node.js configs
- `.env` files - Environment variables
- `launch.json` - VS Code debugging configs

## Expected Architecture 🏗️
```
Config Files → File Watchers → ConfigsTreeDataProvider → TreeView
                           ↓
           Schema Validation → Editor → IntelliSense + Error Highlighting  
                           ↓
             Live Reload → Active Processes → StatusManager Updates
```

## Success Metrics 📊
- **Config detection**: Auto-find all relevant config files
- **Validation speed**: <100ms for large files
- **Editor integration**: IntelliSense <50ms response
- **Live reload**: <500ms propagation to processes
- **Zero breaking changes** to existing functionality

## XP Practice: **Refactoring** 
Improve existing ConfigsTreeDataProvider code while maintaining compatibility and extracting reusable configuration handling components.

**Ready to implement comprehensive config management!** 🚀

## Requisitos
- Comandos: abrir/validar/guardar.
