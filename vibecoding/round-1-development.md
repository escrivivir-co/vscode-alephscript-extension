# RONDA 1 — DEVELOPMENT

## Tareas
- [ ] Auditar `extension.ts`
- [ ] Definir interfaces MCP
- [ ] Registrar comandos base

## Cambios Propuestos/Realizados
- Contratos MCP: `IMcpClient`, `IMcpServer`
- OutputChannel: `AlephScript`

## Notas Técnicas
- Mantener acoplamiento bajo entre UI y backend (patrón adaptador).

## Pruebas
- Activación de la extensión
- Listado de comandos

## Decisiones (ADR)
- ADR-001: MCP via HTTP con `mcp.json` dinámico.

## Bloqueos
- N/A

## Próximos Pasos
- Implementar TreeViews (R2)
