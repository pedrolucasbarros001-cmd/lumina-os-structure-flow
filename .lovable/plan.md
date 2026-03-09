

# Fix: Onboarding Obrigatório + Login Redirect

## Problema

Existe uma **race condition** no fluxo de login: após `await signIn()`, o `navigate('/dashboard')` executa antes do React processar a atualização de estado do `onAuthStateChange`. O `ProtectedRoute` renderiza com `user = null`, redireciona para `/login`, e o utilizador fica preso num ciclo sem nunca chegar ao onboarding.

Adicionalmente, as páginas Login e Signup não redirecionam utilizadores já autenticados.

## Solução

### 1. `src/pages/Login.tsx` - Redirecionar users autenticados + fix race condition

- Adicionar verificação: se `user` existe, `<Navigate to="/dashboard" />`
- Remover `navigate('/dashboard')` do `handleSubmit` — deixar o `onAuthStateChange` atualizar o estado, que causa re-render, que aciona o redirect automático acima

### 2. `src/pages/Signup.tsx` - Redirecionar users autenticados

- Adicionar mesma verificação: se `user` existe, `<Navigate to="/dashboard" />`

### 3. Confirmar cadeia de proteção

O fluxo correto será:
```text
Signup → confirma email → Login (user=null, mostra form)
                                ↓ (signIn sucesso)
                          onAuthStateChange → user definido → re-render
                                ↓
                          Login detecta user → Navigate /dashboard
                                ↓
                          ProtectedRoute → profile.onboarding_completed = false
                                ↓
                          Navigate /onboarding ✔
```

| Ficheiro | Alteração |
|----------|-----------|
| `src/pages/Login.tsx` | Adicionar redirect de users autenticados + remover navigate manual |
| `src/pages/Signup.tsx` | Adicionar redirect de users autenticados |

