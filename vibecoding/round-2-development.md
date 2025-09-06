# RONDA 2 — DEVELOPMENT

## Tareas
- [x] Diseñar modelos de nodo (AgentTreeItem, UITreeItem, ConfigTreeItem)
- [x] Implementar 3 TreeDataProviders (AgentsTreeDataProvider, UIsTreeDataProvider, ConfigsTreeDataProvider)
- [x] Registrar vistas en package.json con iconos
- [x] Conectar con managers existentes (MCPServerManager, UIManager)
- [x] Añadir comandos de refresh para cada TreeView

## Cambios Propuestos/Realizados
- **Nuevos archivos**: 
  - `src/treeViews/agentsTreeView.ts` - TreeView para servidores MCP
  - `src/treeViews/uisTreeView.ts` - TreeView para UIs de gamificación
  - `src/treeViews/configsTreeView.ts` - TreeView para archivos de configuración
- **Views registradas**: `alephscript.agents`, `alephscript.uis`, `alephscript.configs` en activity bar
- **Comandos refresh**: Permite actualizar cada TreeView independientemente

## Notas Técnicas
- Cada TreeDataProvider implementa interfaces claras con modelos tipados
- Iconos temáticos por estado/tipo (play/stop/error para agentes, game/browser/terminal para UIs)
- ConfigsTreeView busca archivos automáticamente en patrones comunes
- Integración con managers existentes sin romper funcionalidad actual

## Pruebas
- TreeViews visibles en sidebar al activar extensión
- Nodos poblados con datos organizados jerárquicamente
- Refresh funcional desde comandos

## ADR
- ADR-002: IDs estables por hash de nombre → Confirmado, usando IDs descriptivos
- ADR-003: TreeViews como reemplazo gradual de webviews pesados

## Bloqueos
- Pendiente: conectar estados reales desde managers (actualmente usa datos mock/estáticos)

## Próximos Pasos
- Round 3: Integración Terminal/Launchers para ejecutar comandos desde TreeViews
