# RONDA 2 — INPUT

## Objetivo de la Ronda
Implementar TreeViews para Agentes/UIs/Configs.

## Contexto
- `MultiUIGameConfig.ts` y `GamificationUI.ts` definen dominios.

## Alcance
- TreeDataProviders y vistas en sidebar.

## No Alcance
- Acciones complejas sobre nodos (solo navegación/selección).

## Requisitos
- Contribuir 3 vistas: Agents, UIs, Configs.

## Métricas de Éxito
- Vistas visibles, nodos poblados.

## Riesgos
- Performance con listas grandes → lazy loading.

## Validación
- Vistas registradas y datos mockeados.

## Artefactos
- `src/extension.ts`
- `src/uiManager.ts`
- `package.json`
