# RONDA 1 — INPUT

## Objetivo de la Ronda
Diseñar la arquitectura de extensión y cimentar integración MCP.

## Contexto
- Extensión actual basada en webviews.
- Archivos clave: `src/extension.ts`, `src/mcpServerManager.ts`.
- Interfaz principal vía MCP/Copilot.

## Alcance
- Esqueleto modular de extensión.
- Contratos (interfaces) para MCP y procesos.

## No Alcance
- UI finales, solo wiring inicial.

## Requisitos
- Registrar comandos base.
- Preparar TreeDataProviders vacíos.
- Canal de salida (OutputChannel) por servicio.

## Métricas de Éxito
- Activación sin errores.
- Comandos registrados visibles en Paleta.

## Riesgos y Mitigación
- Riesgo: API MCP inestable → Mitigar con interfaces y adaptadores.

## Plan de Validación
- Arranque de extensión + inspección de comandos.

## Artefactos a Tocar
- `src/extension.ts`
- `src/mcpServerManager.ts`
- `package.json` (contribuciones)
