

# Plano: Correcção Global — Onboarding, Agenda e Estabilidade Funcional

## Diagnóstico

Após varredura completa do código, identifiquei **4 problemas críticos** e **3 melhorias de UX** necessários:

### Problemas Críticos

**1. Onboarding bloqueado pelo `setup_completed` gate**
O `ProtectedRoute` (linhas 50-57) verifica `setup_completed` e redireciona para `/setup` APÓS o onboarding concluir. Mas o onboarding (`Onboarding.tsx` linha 121) define `onboarding_completed: true` sem definir `setup_completed: true`. Resultado: utilizador fica preso no `/setup` (ProgressiveSetup) antes de poder usar a agenda. O utilizador quer que o onboarding seja o processo completo — sem fase separada de setup.

**Solução**: Fundir o ProgressiveSetup dentro do Onboarding. O wizard ficará com 6 etapas: Identity → Size → Categories → Logistics → Primeiro Serviço → Horários. No final, definir `onboarding_completed = true` E `setup_completed = true`. Remover o gate de `/setup` do ProtectedRoute.

**2. Clicar nos cards de agendamento não funciona**
Em `Agenda.tsx`, o `handleApptLongPressStart` (linha 339) chama `e.preventDefault()` no `pointerdown`, o que impede o evento `click` de disparar no browser. Resultado: tocar num card não abre o `AppointmentDetailSheet`.

**Solução**: Remover `e.preventDefault()` do `handleApptLongPressStart`. Manter apenas `e.stopPropagation()`. O `preventDefault` só deve ser chamado quando o drag realmente inicia (dentro do timeout de 300ms).

**3. Criação de serviço a partir da Agenda falha silenciosamente**
O `NewAppointmentSheet` requer `selectedTeamMemberId`, mas para owners solo (sem team_members criados), o campo fica vazio e o submit é bloqueado pela validação (linha 111). Quando o owner tem team_members (inclui a si próprio criado no onboarding), o auto-select não funciona porque o `useEffect` na abertura (linha 66) reseta `selectedTeamMemberId` para `prefillTeamMemberId || ''`.

**Solução**: Auto-selecionar o primeiro team member quando só existe um. Se o owner é solo, preencher automaticamente.

**4. Grid `onPointerDown` com `e.preventDefault()` incondicional**
Linha 231 do `Agenda.tsx` — impede interação normal com a grid (scroll, taps). Causa conflitos em mobile.

**Solução**: Remover `e.preventDefault()` do grid pointerdown. Usar `touch-action: manipulation` (já está) e só prevenir default quando o drag inicia.

### Melhorias UX

**5. Cards da agenda demasiado largos para solo owner**
O cálculo de largura das colunas usa `columns.length` mas distribui por toda a largura do ecrã. Com 1 membro, a coluna ocupa 100% — desperdiçando espaço.

**Solução**: Limitar a largura máxima da coluna (ex: `max-width: 400px` para solo). Centralizar a coluna quando é apenas 1. Para 2+, manter distribuição proporcional mas com cap de `min(columns.length, 4)`.

**6. Cards de agendamento compactos**
Os blocos de visita usam `HOUR_HEIGHT = 80px`. Para 30min de serviço, o card fica com 40px — razoável. Mas visualmente os paddings podem ser mais tight.

**Solução**: Reduzir padding interno dos blocos (`px-1.5 py-1`), `HOUR_HEIGHT` para 72px para uma grade mais densa.

**7. Onboarding completo num único wizard**
Fundir as etapas do ProgressiveSetup (criar serviço + horários) no Onboarding, ficando:
1. Nome do negócio (identity)
2. Solo vs Equipa (size)
3. Categorias (categories)
4. Logística (logistics)
5. Criar primeiro serviço (service)
6. Horários de funcionamento (hours)
→ Conclusão: ambas flags `true`, redireciona para `/agenda`

## Ficheiros a Alterar

| Ficheiro | Alteração |
|----------|-----------|
| `src/pages/Onboarding.tsx` | Adicionar etapas 5 (serviço) e 6 (horários), definir `setup_completed: true` no final |
| `src/components/ProtectedRoute.tsx` | Remover gate do `/setup` — tudo é tratado pelo onboarding |
| `src/pages/Agenda.tsx` | Fix `preventDefault` nos pointerdown handlers; cards compactos; coluna adaptativa |
| `src/components/NewAppointmentSheet.tsx` | Auto-selecionar team member quando existe apenas 1 |
| `src/pages/Catalogo.tsx` | Garantir que criação de serviço funciona (já funciona, mas validar RLS para staff) |

## Notas sobre o PRD V2.0

O documento V2.0 está registado. As implementações de Stripe (Sprint A), Google Maps live tracking (Sprint B), e Supabase Realtime estão agendadas para sprints futuros. Este plano foca-se em **estabilizar a fundação** antes de avançar para essas camadas.

