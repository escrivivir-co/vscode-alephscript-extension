# PLAN DE VIBECODING: VS CODE ALEPHSCRIPT EXTENSION REFACTORING

## 🎯 OBJETIVO PRINCIPAL
Transformar la actual extensión webview-heavy en una integración nativa VS Code que maximice:
- **TreeViews** para navegación de agentes/UIs/configs
- **Panels integrados** para estado de gamificación
- **Terminal nativo** para MCP servers y launchers
- **MCP/Copilot integration** como interfaz principal

## 📋 ESTRUCTURA DE SESIÓN (10 RONDAS PREMIUM)

### Plantillas por Ronda:
- `round-{N}-input.md`: Objetivos y contexto específico
- `round-{N}-development.md`: Código, tareas y progreso iterativo
- `round-{N}-output.md`: Resultados y consenso

### Archivos de Control:
- `session-overview.md`: Estado global de todas las rondas
- `base.md`: Este archivo (plan maestro)

## 🚀 RONDAS ESPECÍFICAS PARA ALEPHSCRIPT

### RONDA 1: Architecture & MCP Foundation
**Entrada**: Auditar `extension.ts`, `mcpServerManager.ts`
**Desarrollo**: Diseño modular + MCP client base
**Salida**: Nueva arquitectura con interfaces MCP

### RONDA 2: TreeView - AlephScript Agents
**Entrada**: Analizar `GamificationUI.ts` y agentes del sistema
**Desarrollo**: TreeDataProvider para agentes activos/configuraciones
**Salida**: Panel lateral navegable de agentes

### RONDA 3: Terminal Integration - Launchers
**Entrada**: Scripts `iniciar-driver.sh`, `arrancar_server.sh`
**Desarrollo**: Comandos VS Code para lanzar MCP servers
**Salida**: Terminales integrados con estado visible

### RONDA 4: GameState Panel - UI Manager
**Entrada**: `MultiUIGameConfig.ts`, estado de UIs
**Desarrollo**: Panel de estado de gamificación en tiempo real
**Salida**: Dashboard integrado VS Code

### RONDA 5: Socket.IO Integration
**Entrada**: Sistema socket del `ws-server`
**Desarrollo**: Monitor de conexiones socket en TreeView
**Salida**: Gestión de conexiones desde VS Code

### RONDA 6: Config Management
**Entrada**: `xplus1-config.json`, configuraciones dinámicas
**Desarrollo**: Editor de configs con validación
**Salida**: Interfaz de configuración nativa

### RONDA 7: Debug & Logging Integration
**Entrada**: Logs dispersos del sistema
**Desarrollo**: OutputChannels centralizados por servicio
**Salida**: Sistema de logs unificado

### RONDA 8: Command Palette & Shortcuts
**Entrada**: Comandos dispersos
**Desarrollo**: Comandos VS Code para todas las operaciones
**Salida**: UX optimizada con shortcuts

### RONDA 9: WebRTC & Advanced UIs
**Entrada**: `web-rtc-gamify-ui`, UIs avanzadas
**Desarrollo**: Integración selectiva de webviews necesarias
**Salida**: Híbrido nativo/web optimizado

### RONDA 10: Testing & Polish
**Entrada**: Testing integral del sistema
**Desarrollo**: Tests automatizados + UX final
**Salida**: Extensión lista para producción

## 🔧 DIFERENCIAS CLAVE VS PLAN ANTERIOR

1. **Más específico**: Cada ronda tiene contexto AlephScript concreto
2. **Progresivo**: Cada ronda construye sobre la anterior
3. **Práctico**: Enfoque en archivos reales de tu codebase
4. **Ejecutable**: Comenzamos creando archivos reales ahora

## 📁 WORKSPACE CONTEXT
- **Base**: `vscode-alephscript-extension/`
- **Vibecoding**: `vibecoding/` (documentación iterativa)
- **Core system**: `state-machine-mcp-driver/`
- **UIs**: `threejs-gamify-ui/`, `web-rtc-gamify-ui/`

## ✅ PRÓXIMO PASO
¿Consensuamos este plan más específico? Si sí, ejecutamos en iteraciones de 1 ronda con entregables claros:

Entregables por ronda:
- Plantillas completadas (`round-{N}-*`)
- Código/Contribuciones VS Code funcionales
- Validaciones mínimas (build/lint/smoke)

Riesgos y mitigación generales:
- API VS Code cambia → fijar `engines.vscode` y tipados
- Entornos Windows/Linux → rutas absolutas y shell configurable
- Concurrencia de procesos → gestor de terminales con estado

Criterios de aceptación globales:
- Extensión activa sin errores
- Comandos clave documentados y operativos
- Reducción de webviews innecesarios

Prácticas XP aplicadas:
- Iteraciones cortas, feedback continuo
- Refactor continuo con test ligeros
- Diseño simple orientado a eventos (bajo acoplamiento)

**Siguiente acción propuesta**: iniciar Ronda 1 y auditar `src/extension.ts` y `src/mcpServerManager.ts` con una primera lista de comandos mínimos.
