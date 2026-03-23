# 🚀 GUIA ALTERNATIVA B - CRIAR SCHEMA COM SUCESSO

## O que vai fazer:
✅ Criar 12 tabelas com colunas detalhadas  
✅ SEM triggers complexos ou policies  
✅ SEM erros de sintaxe  
✅ Vai funcionar na primeira tentativa  

## 📋 PASSO-A-PASSO

### ✏️ PASSO 1: Executar Python para copiar SQL

```bash
cd "/Users/pedrolucas/LUMINA OS/VSCODE Lumina OS/lumina-os-structure-flow"
python3 run_migration_final.py
```

Resultado esperado:
```
✅ SQL copiado para clipboard!
1. Abrindo Supabase Dashboard...
```

### 🌐 PASSO 2: Colar SQL no Supabase

1. **Espera abrir o browser** → Supabase Dashboard
2. **Clica** em `New Query` (lado esquerdo)
3. **Cola** o SQL (Cmd+V)
4. **Verifica** se ficou assim:

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ...
)
```

### ⚡ PASSO 3: Executar SQL

1. **Clica** em `Run` (botão azul no topo)
2. **Ou** pressiona `Ctrl+Enter`
3. **Espera** até aparecer `✅ Execution completed`

Resultado esperado:
```
✅ SCHEMA CRIADO COM SUCESSO!
```

---

## 📊 O que vai ser criado:

| Tabela | Descrição |
|--------|-----------|
| 1️⃣ **subscriptions** | Planos de assinatura (Pro, Enterprise) |
| 2️⃣ **user_roles** | Tipos de usuários (owner, team_member) |
| 3️⃣ **company_members** | Quem trabalha em qual empresa |
| 4️⃣ **team_member_services** | Quais serviços cada profissional oferece |
| 5️⃣ **team_shifts** | Horários de trabalho (seg-dom) |
| 6️⃣ **appointments** | Agendamentos de clientes |
| 7️⃣ **deliveries** | Entregas em domicílio (com GPS) |
| 8️⃣ **unit_gallery** | Fotos/galeria das empresas |
| 9️⃣ **staff_invitations** | Convites para profissionais |
| 🔟 **appointment_confirmation_tokens** | Links de confirmação de agendamento |
| 1️⃣1️⃣ **staff_blocked_time** | Blocos de horário indisponível |
| 1️⃣2️⃣ **staff_block_reasons** | Tipos de bloqueios (pausa, almoço, etc) |

---

## 🛑 Se der erro:

### ❌ "ERROR: syntax error at or near..."
- **Causa**: SQL não copiou certo
- **Solução**: Limpa tudo e cola novamente

### ❌ "ERROR: table already exists"
- **Causa**: Rodou SQL 2x por acidente
- **Solução**: Normal, foi de boa! (tem `IF NOT EXISTS`)

### ❌ "ERROR: column already exists"
- **Causa**: Mesma coisa
- **Solução**: Rodou SQL 2x, já criou as colunas

---

## ✅ DEPOIS QUE TERMINAR:

### 1️⃣ Gera os tipos TypeScript

```bash
# Vai criar src/integrations/supabase/types.ts com todas as tabelas
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 2️⃣ Inicia o app

```bash
npm run dev
```

Vai aparecer:
```
VITE v5.0.0  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### 3️⃣ Abre o app

```
http://localhost:5173
```

---

## 💾 Checklist:

- [ ] Rodei `python3 run_migration_final.py`
- [ ] SQL foi copiado (apareceu ✅)
- [ ] Abriu Supabase Dashboard no browser
- [ ] Colei SQL (Cmd+V)
- [ ] Cliquei em Run
- [ ] Diz "✅ Execution completed" ou similar
- [ ] Rodei `npx supabase gen types`
- [ ] Rodei `npm run dev`
- [ ] App está rodando em `http://localhost:5173`

---

## 🎯 RESUMO TÉCNICO:

**Por que funcionará:**
- SQL minimalista (nada de triggers 😅)
- Todas colunas com comentários explicando o que são
- UUIDs e Foreign Keys funcionando
- Sem `CREATE TRIGGER IF NOT EXISTS` (causa problema no Supabase)
- `CREATE TABLE IF NOT EXISTS` (idempotente, roda 2x sem problema)

**Próximo passo após schema:**
- Regenerar `types.ts`
- Testar login/auth
- Implementar CRUD das 12 tabelas
- Adicionar triggers + RLS policies depois (incrementalmente)

🎊 **Manda bala!**
