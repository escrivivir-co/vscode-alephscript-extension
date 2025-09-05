
# REFERENCIAS DE LA CODEBASE FUERA DE ESTE PROYECTO

## CORE PRINCIPAL DE RUNTIME Y CLIENTES

- [BASE ROOT PATH](state-machine-mcp-driver/)

### CORE

- [BASE ROOT PATH](state-machine-mcp-driver/src/)

### UIs GAMIFICDAS

- [BASE ROOT PATH](state-machine-mcp-driver/src/ui/MultiUIGameManager.ts)

### EJEMPLOS DE APLICACIONES QUE CONSUMEN EL CORE

- [BASE ROOT PATH](state-machine-mcp-driver/examples/xplus1-app/)

## SERVIDOR SOCKET.IO

- [BASE ROOT PATH](socket-gym/)

### SERVIDOR

- [BASE ROOT PATH](socket-gym/ws-server/)

### GYM DE AGENTES, BOTS Y CLIENTES

- [BASE ROOT PATH](socket-gym/alephscript/)

## GAMIFICATION UIs

- [BASE ROOT PATH](threejs-gamify-ui/)
- [BASE ROOT PATH](web-rtc-gamify-ui/)
- [BASE ROOT PATH](aleph-unity-bot/)
- [BASE ROOT PATH](blockly-alephscript-sdk/)

## CLIENTE ALEPHSCRIPT SOCKET.IO EN WEB

Tomar como ejemplo la implementación angular en threejs-gamify-ui\projects\threejs-ui-lib\src\lib\alephscript-client.js

## REPO DE AGILE

- [BASE ROOT PATH](vibecoding/)

## ENTORNO DE DESARROLLO

Estas en Windows pero con Git Bash shell - Vs Code IDE Copilot Agent.

### RUTAS PARA COMANDOS

Usa rutas absolutas a la code base: 

BASE ROOT PATH = /e/LAB_AGOSTO/ORACLE_HALT_ALEPH_VERSION/

# VISUALIZACION MARKDOW EN VS CODE

## LATEX

mdmath Markdown+Math: 
Permite renderizar fórmulas TeX/LaTeX directamente en archivos Markdown (.md) usando el visor integrado de VS Code. Ideal para documentación con fórmulas matemáticas en Markdown.

```json
{
    "mdmath.delimiters": "dollars",
    "mdmath.macros": {},
    "mdmath.autosave": true,
    "markdown.math.enabled": true,
    "markdown.extension.math.enabled": true
}
```

## GRAFOS

mermaid

```json
{
    "markdown.mermaid.theme": "default",
    "markdown.preview.breaks": false,
    "markdown.preview.linkify": true,
    "markdown.preview.typographer": false,
    "mermaid.theme": "default"
}
```