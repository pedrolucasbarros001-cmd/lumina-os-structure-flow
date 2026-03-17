# Configuração de Email Templates no Supabase

## Problema
Os convites de staff estão sendo enviados, mas redirecionam para o fluxo de autenticação padrão em vez de direcionar para a página de aceitação de convite.

## Solução — Atualizar Email Template

### Passo 1: Aceder ao Supabase Dashboard
1. Aceda a [https://app.supabase.com](https://app.supabase.com)
2. Selecione o seu projecto LUMINA OS
3. Navegue até: **Authentication** → **Email Templates**

### Passo 2: Editar o Template de "Invite"

Você verá vários templates. Procure por: **"Invite"**

Se não existir, procure pela seção de templates de convidado/invite.

### Passo 3: Substituir o Conteúdo do Template

**TEMPLATE ATUAL (Supabase Padrão):**
```html
<h2>You have been invited</h2>

<p>Accept the invite by following this link:</p>
<p><a href="{{ .ConfirmationURL }}">Accept the invite</a></p>
```

**NOVO TEMPLATE (Para LUMINA OS):**
```html
<h2>Está convidado para juntar-se ao LUMINA OS 🎯</h2>

<p>Olá {{ .Email }},</p>

<p>Foi convidado para juntar-se à equipa LUMINA OS como staff.</p>

<p><strong>Aceite o convite clicando aqui:</strong></p>
<p><a href="{{ .SiteURL }}/invite/{{ .Token }}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
  Aceitar Convite
</a></p>

<p><strong>Ou copie este link:</strong></p>
<p><code>{{ .SiteURL }}/invite/{{ .Token }}</code></p>

<p style="color: #666; font-size: 14px;">
  Este link expira em 7 dias.<br>
  Se não pediu este convite, ignore este email.
</p>

<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
<p style="color: #999; font-size: 12px;">LUMINA OS &copy; 2026</p>
```

### Passo 4: Confirmação das Variáveis
As variáveis disponíveis no Supabase são:
- `{{ .ConfirmationURL }}` — URL completa de reset/convite (Supabase padrão)
- `{{ .Token }}` — Token do convite (use isto!)
- `{{ .SiteURL }}` — URL do seu site (ex: https://www.seusite.com)
- `{{ .Email }}` — Email do utilizador convidado

**Importante:** Verifique qual é o seu `Site URL` no Supabase:
1. Vá para: **Project Settings** → **General**
2. Localize: **Site URL** (ex: `https://seu-projeto.supabase.co`)
3. Se precisar de URL customizada, configure-a em **Project Settings** → **URL Configuration**

### Passo 5: Guardar e Testar

1. Clique em **"Save"** ou **"Update Template"**
2. Para testar:
   - Aceda à página **Team** na sua aplicação
   - Crie um novo convite para um email
   - Verifique se o email chegou com o novo template
   - Clique no link e verifique se direciona para `/invite/{token}`

---

## Alternativa: Se precisar de URL diferente

Se o seu site tem um domínio customizado (ex: `https://agenda.seunegocios.com`), atualize em:

**Supabase Dashboard**:
1. **Project Settings** → **URL Configuration**
2. Adicione o seu domínio customizado
3. Atualize o template para usar `{{ .SiteURL }}` automaticamente

---

## Verificação Rápida

Para confirmar que a configuração está a funcionar:

1. **Convite enviado com sucesso?**
   - Verifique em **Authentication** → **Users** → procure o email
   - Veja o histórico de emails enviados

2. **Link correcto no email?**
   - Template deve gerar: `https://seu-site.com/invite/TOKEN_AQUI`

3. **Página `/invite` funciona?**
   - Visite manualmente: `http://localhost:5173/invite/test-token-123`
   - Deve mostrar a página de aceitação de convite

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Email não chega | Verifique em **Logs** → **Auth** se foi enviado |
| Link está errado | Confirme o `Site URL` em Project Settings |
| Redireciona para auth padrão | Template ainda usa `{{ .ConfirmationURL }}` — atualize para `{{ .Token }}` |
| Convite continua "pending" | Verifique se `/invite/{token}` marca como aceite em `AcceptInvitePage.tsx` |

---

**Documentação oficial:** [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
