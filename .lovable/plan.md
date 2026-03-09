

# Landing Page Pública + Registo com Plano

## Análise

- A rota `/` atualmente redireciona para `/dashboard` dentro de `ProtectedRoute`
- O trigger `handle_new_user()` já cria uma subscription trial automática
- Preciso criar uma landing page pública e modificar o Signup para atualizar o plano após registo

## Implementação

### 1. Nova Landing Page (`src/pages/Index.tsx`)

Página estilo Apple com:
- **Hero Section**: Título grande + botões "Começar" (→ pricing) e "Entrar" (→ /login)
- **Features Section**: 3 cards (Booking fluido, Motor Delivery, CRM de Equipa) com tipografia grande
- **Pricing Section**: 2 cards lado a lado
  - Mensal €69 → `/signup?plan=monthly`
  - Anual €64,75/mês (highlight roxo) → `/signup?plan=annual`
- Animações suaves, glassmorphism, dark mode ready

### 2. Atualizar Routing (`src/App.tsx`)

```text
/           → Index (público, sem auth)
/dashboard  → ProtectedRoute + PanelLayout (autenticados)
```

Remover o redirect automático de `/` para `/dashboard` dentro do ProtectedRoute.

### 3. Atualizar Signup (`src/pages/Signup.tsx`)

- Ler `plan` do URL via `useSearchParams`
- Mostrar badge visual do plano selecionado (Mensal/Anual)
- Após `signUp()` com sucesso:
  - Se `plan === 'annual'`, fazer UPDATE na `subscriptions` para mudar `plan_type` para `annual`
  - O trigger já cria trial subscription, só precisamos atualizar o tipo

### 4. CSS Adicional (`src/index.css`)

Adicionar classe `.glow-card` para o efeito de brilho roxo no card anual.

---

## Ficheiros

| Ficheiro | Ação |
|----------|------|
| `src/pages/Index.tsx` | Recriar — Landing page completa |
| `src/App.tsx` | Editar — Separar rota `/` como pública |
| `src/pages/Signup.tsx` | Editar — Ler plan param e atualizar subscription |
| `src/index.css` | Adicionar — Classe glow-card |

