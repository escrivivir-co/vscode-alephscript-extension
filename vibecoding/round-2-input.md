# RONDA 2 — INPUT

## Objetivo de la Ronda
Implementar TreeViews nativos para reemplazar webviews pesados en agentes, UIs y configuraciones.

## Contexto
- Managers existentes: `UIManager`, `MCPServerManager` usan webviews
- Referencias del sistema: `MultiUIGameConfig.ts`, `GamificationUI.ts` 
- Objetivo: navegación nativa en sidebar VS Code

## Alcance
- 3 TreeDataProviders: Agents, UIs, Configs
- Integrar con managers existentes
- Registrar vistas en `package.json`

## No Alcance
- Acciones complejas sobre nodos (solo navegación/selección inicial)
- Modificación de managers actuales (solo integración)

## Requisitos
- TreeView `alephscript.agents` con servidores MCP
- TreeView `alephscript.uis` con instancias UI gamificadas  
- TreeView `alephscript.configs` con archivos de configuración
- Datos poblados desde managers existentes

## Métricas de Éxito
- 3 vistas visibles en sidebar
- Nodos poblados con datos reales (no mocks)
- Refresh funcional

## Riesgos y Mitigación
- Performance con listas grandes → lazy loading si necesario
- Dependencias circulares → interfaces claras entre TreeView y managers

## Plan de Validación
- Vistas registradas en Command Palette
- Nodos visibles con datos de `MCPServerManager` y `UIManager`

## Artefactos a Tocar
- `package.json` (contribuciones views)
- `src/extension.ts` (registrar TreeDataProviders)
- Nuevos: `src/treeViews/agentsTreeView.ts`, `src/treeViews/uisTreeView.ts`, `src/treeViews/configsTreeView.ts`
