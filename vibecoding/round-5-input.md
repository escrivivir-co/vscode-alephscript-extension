# RONDA 5 — INPUT

## Objetivo
Integrar monitoreo de Socket.IO en TreeViews para visualizar conexiones, rooms y estado del servidor en tiempo real.

## Contexto
- Sistema Socket.IO existente: `socket-gym/ws-server`
- SocketMonitor ya tiene cliente Socket.IO implementado
- StatusManager de R4 listo para integrar datos Socket.IO
- TreeViews de R2 preparados para expandir con conexiones

## Alcance
- TreeView dedicado para conexiones Socket.IO activas
- Integración con SocketMonitor existente para datos reales
- Visualización de rooms y clientes conectados
- Commands para join/leave rooms desde TreeView

## No Alcance
- Reescribir SocketMonitor (solo extender)
- Mensajería avanzada Socket.IO (solo monitoreo)
- Métricas de performance detalladas

## Requisitos
- TreeView `alephscript.sockets` con conexiones activas
- Nodos por room con lista de clientes conectados
- Indicadores de estado del servidor Socket.IO
- Context menu: join room, leave room, send test message
- Integración con StatusManager para health del servidor

## Métricas de Éxito
- TreeView visible con conexiones Socket.IO en tiempo real
- Refresh automático cuando conexiones cambian
- StatusManager incluye estado Socket.IO server
- Actions funcionales desde context menu

## Riesgos y Mitigación
- Performance con muchas conexiones → lazy loading y filtros
- Conexiones inestables → retry logic y timeout handling
- Datos obsoletos → heartbeat y auto-refresh

## Plan de Validación
- Conectar a Socket.IO server (ws://localhost:3000)
- Ver rooms y clientes en TreeView
- Ejecutar actions join/leave desde menu
- Verificar estado en StatusManager

## Artefactos a Tocar
- `src/treeViews/socketsTreeView.ts` (nuevo)
- `src/socketMonitor.ts` (extender para TreeView integration)
- `src/statusManager.ts` (integrar datos Socket.IO reales)
- `package.json` (nueva vista + commands)
