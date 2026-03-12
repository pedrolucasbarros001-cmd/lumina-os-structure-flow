
Objetivo
- Ativar o onboarding no fluxo real do utilizador (clicar “Começar” nos planos) e garantir que ele acontece uma única vez por conta.

Diagnóstico (causa raiz)
1. O botão “Começar” em `/plans` leva para `/signup`, mas o `/signup` hoje é só formulário de conta e não encaminha corretamente para onboarding.
2. Após `signUp`, a página apenas mostra toast (sem navegação confiável para continuar onboarding).
3. O onboarding atual ainda mistura escolha de “owner vs staff”, mas staff deveria entrar só por convite VIP.
4. O gate de rota depende de `profile`; quando `profile` não vem como esperado, pode deixar passar sem forçar onboarding.

Plano de implementação

1) Conectar cadastro ao onboarding (ativação imediata)
- Arquivos: `src/pages/Signup.tsx`, `src/pages/Login.tsx`, `src/pages/PlanSelection.tsx`
- Ajustes:
  - `/plans` continua a abrir cadastro, mas cadastro passa a ser explicitamente “Passo 1 do Onboarding”.
  - No submit de signup:
    - se sessão vier ativa, redirecionar imediatamente para `/onboarding`;
    - se confirmação de email for obrigatória, redirecionar para `/login?next=/onboarding` com aviso claro.
  - Login passa a respeitar `next` seguro (whitelist de rotas internas) para continuar o onboarding.

2) Endurecer gate obrigatório de onboarding
- Arquivo: `src/components/ProtectedRoute.tsx`
- Ajustes:
  - Se utilizador autenticado não tiver onboarding concluído, sempre redirecionar para `/onboarding`.
  - Tratar estados sem perfil de forma segura (não liberar dashboard por ausência de `profile`).

3) Alinhar Onboarding com o PRD (Owner)
- Arquivo: `src/pages/Onboarding.tsx`
- Ajustes de fluxo:
  - Remover entrada “staff por código” desta página (staff fica exclusivo do `/invite/:token`).
  - Manter onboarding Owner em etapas coerentes com o desenho aprovado (sem desvio para páginas paralelas).
  - Garantir persistência final em `profiles.onboarding_completed = true` apenas no fim real do wizard.

4) Garantir “apenas uma vez por conta”
- Arquivos: `src/pages/Onboarding.tsx`, `src/components/ProtectedRoute.tsx`
- Regras:
  - Se `onboarding_completed = true`, não mostrar onboarding novamente.
  - Qualquer acesso manual a `/onboarding` após concluído redireciona para `/dashboard`.

5) Validação end-to-end (sem regressão)
- Cenários de teste:
  1. Visitante: `/plans` → cadastro (passo 1) → onboarding → dashboard/setup.
  2. Conta já com onboarding concluído: login vai direto ao fluxo normal (sem wizard).
  3. Staff via convite: nunca cai no onboarding Owner, entra pela experiência VIP e agenda pessoal.
  4. Refresh no meio do fluxo: mantém coerência de estado e não quebra gate.

Detalhes técnicos (objetivos de robustez)
- Evitar open redirect no parâmetro `next` (aceitar apenas rotas internas permitidas).
- Não mexer em role no frontend para decidir privilégio crítico; manter validação via dados server-side/RLS como já está.
- Preservar estética “Apple Spatial / glass” durante a transformação do `/signup` em passo de onboarding.

Fluxo final esperado
```text
/plans -> /signup (Passo 1 Onboarding)
       -> signUp
          -> (sessão ativa) /onboarding
          -> (sem sessão) /login?next=/onboarding
/onboarding concluído -> /dashboard (ou /setup, conforme gate)
```
