

# Corrigir Scroll + Drag & Drop na Agenda Mobile

## Problema

Quando o utilizador segura um agendamento para arrastar, o scroll da página continua a funcionar simultaneamente. Isto interfere com a operação de drag.

**Comportamento esperado:**
1. Scroll deve **bloquear** quando o drag inicia
2. Scroll automático só deve acontecer quando o item arrastado está no **limite superior ou inferior** da viewport (edge scrolling)

## Solução Técnica

### 1. Bloquear Scroll Durante Drag

Quando `isDragging.current = true`:
- Mudar `overflow-y: auto` para `overflow: hidden` no container
- Usar `touch-action: none` para bloquear gestos nativos

### 2. Implementar Edge Scrolling

Adicionar lógica em `handleGridPointerMove`:
```tsx
const EDGE_THRESHOLD = 60; // px do topo/fundo
const SCROLL_SPEED = 8;    // px por frame

// Se pointer perto do topo → scrollTop -= SCROLL_SPEED
// Se pointer perto do fundo → scrollTop += SCROLL_SPEED
```

Usar `requestAnimationFrame` para scroll suave enquanto o pointer está na edge zone.

### 3. Cleanup

Garantir que o scroll é restaurado quando drag termina ou é cancelado.

---

## Ficheiros

| Ficheiro | Alteração |
|----------|-----------|
| `src/pages/Agenda.tsx` | Bloquear scroll durante drag + implementar edge scrolling |

---

## Implementação Resumida

1. Adicionar estado `isEdgeScrolling` + ref `edgeScrollRAF`
2. No container da grid: `overflow-y: ${dragAppt ? 'hidden' : 'auto'}` e `touchAction: ${dragAppt ? 'none' : 'manipulation'}`
3. Em `handleGridPointerMove`: detectar proximity às edges e iniciar auto-scroll
4. Cleanup do RAF em `handleGridPointerUp` e `cancelDrag`

