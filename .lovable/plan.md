

# Fix: Login Redirect + Onboarding Obrigatório

## Problemas Identificados

1. **Login redireciona para `/` (landing page)**: Em `Login.tsx` linha 27, `navigate('/')` envia o utilizador de volta à landing page em vez do dashboard.
2. **Signup também redireciona para `/login` sem garantir onboarding**: Após signup, o utilizador vai para login, e após login vai para `/` — nunca passa pelo onboarding.

## Solução

### 1. `src/pages/Login.tsx`
- Mudar `navigate('/')` para `navigate('/dashboard')` — o `ProtectedRoute` já trata de redirecionar para `/onboarding` se necessário.

### 2. `src/pages/Signup.tsx`
- Mudar redirect pós-signup para `navigate('/login')` (já está correto, mas confirmar fluxo).

### 3. `src/pages/Index.tsx` (Landing Page)
- Adicionar verificação: se o utilizador já está autenticado, redirecionar automaticamente para `/dashboard` (que por sua vez vai para onboarding se necessário).

### Fluxo Corrigido

```text
Visitante → Signup → Login → /dashboard
                                ↓
                     ProtectedRoute verifica:
                     - onboarding_completed? → /onboarding
                     - setup_completed? → /setup
                     - Tudo ok → Dashboard
```

| Ficheiro | Alteração |
|----------|-----------|
| `src/pages/Login.tsx` | `navigate('/dashboard')` em vez de `navigate('/')` |
| `src/pages/Index.tsx` | Redirecionar utilizadores autenticados para `/dashboard` |

