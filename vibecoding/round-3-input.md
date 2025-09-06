# RONDA 3 — INPUT

## Objetivo
Integrar terminales nativos VS Code para ejecutar MCP servers y launchers directamente desde TreeViews.

## Contexto
- Scripts existentes: `state-machine-mcp-driver/iniciar-driver.sh`, `socket-gym/arrancar_server.sh`, `socket-gym/arrancar_admin.sh`
- ProcessManager actual maneja procesos manualmente
- Usuario en Windows con bash.exe como shell
- TreeViews de Round 2 listos para acciones ejecutables

## Alcance
- Comandos VS Code para launch desde TreeViews
- Terminales dedicados con nombres descriptivos
- Integración con ProcessManager existente
- Soporte para rutas Windows/Linux

## No Alcance
- Modificación profunda de ProcessManager (solo extensión)
- Gestión avanzada de procesos (solo start/stop básico)

## Requisitos
- 3 comandos principales: Start Driver, Start Socket Server, Start Admin UI
- Terminales con títulos descriptivos y persistencia
- Integración con context menus en TreeViews
- Detección automática de rutas de scripts

## Métricas de Éxito
- Terminales visibles en panel Terminal VS Code
- Procesos iniciados correctamente desde TreeViews
- Logs visibles en terminales dedicados

## Riesgos y Mitigación
- Permisos de ejecución Windows → usar rutas absolutas y verificar existencia
- Shell bash.exe → asegurar compatibilidad con comandos Unix
- Rutas relativas → resolver a absolutas antes de ejecutar

## Plan de Validación
- Click derecho en TreeView → comandos disponibles
- Ejecutar comando → terminal aparece con logs
- Verificar procesos en estado "running"

## Artefactos a Tocar
- `src/extension.ts` (nuevos comandos context menu)
- `src/processManager.ts` (extender con terminales VS Code)
- `src/treeViews/*.ts` (contextValue para commands)
- `package.json` (menus contextuales)
## Objetivo
Integrar Terminal nativa para lanzar MCP servers y launchers.

## Contexto
- Scripts: `state-machine-mcp-driver/iniciar-driver.sh`, `socket-gym/arrancar_server.sh`, `socket-gym/arrancar_admin.sh`.

## Alcance
- Comandos VS Code que abren terminales dedicadas.

## Requisitos
- 3 comandos: Start Driver, Start Socket Server, Start Admin UI.

## Métricas
- Terminales con títulos y persistencia.

## Validación
- Lanzar y observar logs en VS Code.
