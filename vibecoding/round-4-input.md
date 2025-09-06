# RONDA 4 — INPUT

## Objetivo
Crear panel de estado en tiempo real para monitorear procesos, servicios MCP y UIs de gamificación.

## Contexto
- Referencias: `GamificationUI.ts` (UIPhase, eventos), `MultiUIGameConfig.ts`
- TerminalManager de R3 gestiona procesos activos
- Necesidad de visualización centralizada de salud del sistema
- Evitar webviews pesados; preferir OutputChannel + StatusBar

## Alcance
- Panel de estado con información agregada
- Monitoreo de terminales activos desde TerminalManager
- Indicadores de salud por servicio (MCP, Socket.IO, UIs)
- Notificaciones de cambios de estado

## No Alcance
- Webviews complejas (solo si absolutamente necesario)
- Modificación profunda de managers existentes
- Métricas avanzadas de performance

## Requisitos
- StatusBar items para indicadores rápidos
- OutputChannel dedicado para logs de estado
- Comando para abrir panel de estado detallado
- Refresh automático cada 5-10 segundos
- Integración con TerminalManager para estados reales

## Métricas de Éxito
- StatusBar muestra resumen de servicios (ej: "MCP: 2/3, UIs: 1/5")
- Panel detallado accesible desde Command Palette
- Estados actualizados automáticamente
- Logs centralizados y categorizados

## Riesgos y Mitigación
- Performance con refresh frecuente → debouncing y lazy loading
- Información obsoleta → timestamps y heartbeat checks
- Overhead visual → indicadores mínimos y no intrusivos

## Plan de Validación
- StatusBar visible y actualizado
- Panel de estado con información estructurada
- Cambios de estado reflejados en tiempo real

## Artefactos a Tocar
- `src/extension.ts` (StatusBar integration)
- Nuevo: `src/statusManager.ts` (agregador de estados)
- `src/terminalManager.ts` (extensión para reporting)
- `package.json` (comando para panel de estado)
