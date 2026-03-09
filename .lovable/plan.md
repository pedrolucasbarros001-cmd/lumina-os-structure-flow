

# Implementação Completa: Onboarding + Interface do Colaborador

## Visão Geral

Restruturar todo o sistema de onboarding com duas portas de entrada distintas e criar uma interface filtrável para colaboradores que partilha a mesma estética premium do proprietário.

---

## PARTE 1: Database Schema

### Nova Tabela `staff_invitations`

```sql
create table staff_invitations (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references units(id) on delete cascade not null,
  email text not null,
  name text,
  role text default 'Profissional',
  commission_rate numeric default 0,
  token text unique not null,
  status text default 'pending', -- pending, accepted, expired
  invited_by uuid references auth.users(id),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days')
);
```

### Alterações na Tabela `profiles`

- Adicionar `user_type` (owner/staff)
- Adicionar `invited_via` (referência ao token de convite)
- Adicionar `linked_unit_id` (unidade do staff após aceitar convite)

### Alterações na Tabela `units`

- Adicionar `categories` (array de strings para as categorias do negócio)

---

## PARTE 2: Fluxo A — Onboarding do Proprietário

### Ficheiro: `src/pages/Onboarding.tsx` (Reconstruir)

**Ecrã 1: Tipo de Utilizador**
- Já acontece no Signup - redireciona para onboarding após criar conta

**Ecrã 2: Solo ou Equipa**
- Dois cartões grandes: "Sou Independente" e "Tenho Equipa"
- Se "Equipa": expande pílulas [2-5], [6-10], [11+]
- Animação: fade-in + slide-in

**Ecrã 3: Categorias do Negócio (NOVO)**
- Grelha de tags/pílulas: Cabelo, Barbearia, Estética, Massagem, Tatuagem, Unhas, Maquilhagem, etc.
- Seleção múltipla com borda néon brilhante
- Mínimo 1 categoria

**Ecrã 4: Identidade e Logística**
- Input: Nome da Empresa
- Seleção: [Local], [Domicílio], [Híbrido]
- Se Domicílio/Híbrido: Raio (slider), Taxa Base, Preço/Km
- Botão "Finalizar e Entrar" → Check verde → Dashboard

### UI/UX
- Fundo OLED preto
- Cartões de vidro fosco (glassmorphism)
- Transições staggered de 60ms entre elementos
- Progress dots no topo

---

## PARTE 3: Fluxo B — Onboarding do Colaborador

### Nova Rota: `/invite/:token`

### Ficheiro: `src/pages/StaffInvite.tsx` (Novo)

**Ecrã 1: Tapete Vermelho**
- Buscar convite pelo token
- Mostrar: "Foi convidado por [Nome do Gestor] para integrar a equipa da [Nome da Empresa]"
- Logo/nome da empresa em destaque
- Botão "Aceitar Convite"

**Ecrã 2: Completar Registo**
- Email bloqueado (vem do convite, readonly)
- Inputs: Nome Completo, Password
- Ao submeter:
  1. Criar conta via Supabase Auth
  2. Atualizar profile com `user_type: 'staff'`, `linked_unit_id`
  3. Criar entrada em `team_members` ligada ao user_id
  4. Marcar convite como `accepted`
- Redirecionar direto para `/agenda`

---

## PARTE 4: Interface do Colaborador

### Contexto de Utilizador

**Hook: `useUserContext.ts` (Novo)**
- Retorna `{ isOwner, isStaff, linkedUnitId, teamMemberId }`
- Baseado em `profiles.user_type` e `company_members`

### Dashboard Pessoal (Staff View)

**Ficheiro: `src/pages/Dashboard.tsx` (Modificar)**

Se `isStaff`:
- Cartão "As Minhas Vendas" com RollingNumbers
- Subtítulo verde: "Comissão estimada: €X,XX"
- Gráfico em anel: % Local vs Domicílio
- Top 3 Serviços executados
- SEM: ranking de colegas, faturação global, configs

### Agenda Filtrada

**Ficheiro: `src/pages/Agenda.tsx` (Modificar)**

Se `isStaff`:
- Mostrar apenas a coluna do staff logado
- Ocultar seletor de múltiplos membros
- Manter drag & drop funcional

### Clientes (Read-Only para Staff)

**Ficheiro: `src/pages/Clients.tsx` (Modificar)**

Se `isStaff`:
- Ver lista e pesquisar
- Ver perfil e histórico
- SEM: botão Exportar CSV, botão Eliminar

### FAB Hub Central (Staff)

**Ficheiro: `src/components/QuickActionSheet.tsx` (Modificar)**

Se `isStaff`:
- "Bloquear Horário" → abre sheet para bloquear slot na agenda
- "Novo Agendamento" → permite criar booking manual
- "Quick Checkout" → numpad para registar venda rápida

---

## PARTE 5: Sistema de Convites (Owner Side)

### Ficheiro: `src/pages/Team.tsx` (Modificar)

- Botão "Convidar Colaborador"
- Sheet com: Email, Nome, Função, Taxa de Comissão
- Ao submeter: cria entrada em `staff_invitations` e (futuramente) dispara email com link mágico

---

## Ficheiros a Criar/Modificar

| Ficheiro | Ação |
|----------|------|
| `supabase/migrations/xxx_staff_invitations.sql` | Criar tabela + alterações |
| `src/pages/StaffInvite.tsx` | Novo — fluxo de aceitar convite |
| `src/pages/Onboarding.tsx` | Reconstruir — 4 ecrãs owner |
| `src/hooks/useUserContext.ts` | Novo — contexto owner/staff |
| `src/pages/Dashboard.tsx` | Modificar — vista staff |
| `src/pages/Agenda.tsx` | Modificar — filtrar por staff |
| `src/pages/Clients.tsx` | Modificar — read-only para staff |
| `src/components/QuickActionSheet.tsx` | Modificar — ações staff |
| `src/pages/Team.tsx` | Modificar — botão convidar |
| `src/App.tsx` | Adicionar rota `/invite/:token` |

---

## Ordem de Implementação

1. **Migration SQL** — tabela `staff_invitations` + alterações profiles/units
2. **useUserContext hook** — base para todas as decisões de rendering
3. **Onboarding Owner** — 4 ecrãs com categorias
4. **StaffInvite page** — aceitar convite + registo
5. **Dashboard Staff** — vista pessoal gamificada
6. **Agenda/Clients/FAB** — ajustes de scope para staff

