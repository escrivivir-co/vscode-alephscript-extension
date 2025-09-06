# RONDA 3 — DEVELOPMENT

## Tareas
- [x] Crear TerminalManager para gestión integrada de terminales VS Code
- [x] Registrar comandos de context menu para TreeViews  
- [x] Implementar detección automática de scripts (iniciar-driver.sh, arrancar_*.sh)
- [x] Añadir soporte para Windows bash.exe con rutas absolutas
- [x] Integrar comandos start/stop desde TreeViews

## Cambios Propuestos/Realizados
- **Nuevo archivo**: `src/terminalManager.ts` - Gestión centralizada de terminales
- **Context menus**: Registrados en `package.json` para agents y UIs
- **Comandos nuevos**: `alephscript.{agents|uis}.{start|stop|openBrowser}`
- **Detección automática**: Scripts buscados en rutas relativas comunes
- **Shell compatibility**: Soporte para bash.exe en Windows

## Notas Técnicas
- TerminalManager maneja ciclo de vida completo (create → run → dispose)
- Detección inteligente de rutas para scripts en workspace hermanos
- Context values específicos para cada tipo de nodo TreeView
- Shell path configurable basado en platform

## Pruebas
- Context menu visible en TreeViews con botones start/stop
- Terminales creados con nombres descriptivos
- Scripts ejecutados desde rutas correctas

## ADR
- ADR-004: TerminalManager separado de ProcessManager para responsabilidades claras
- ADR-005: Context menus como reemplazo de webview actions pesadas

## Bloqueos
- Pendiente: verificar existencia real de scripts en estructura de proyecto actual

## Próximos Pasos
- Round 4: GameState Panel para monitorear estado en tiempo real
