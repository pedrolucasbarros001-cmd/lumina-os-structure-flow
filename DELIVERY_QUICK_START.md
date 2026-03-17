# 🚗 Delivery System — Quick Reference

## 🎯 O Que Existe Agora

### ✅ Frontend Completo
- Página de rastreamento em tempo real
- Mapa interativo com Mapbox
- GPS automático do driver
- Status visual da entrega
- Interface mobile-responsiva

### ✅ Backend Pronto
- Tabela `deliveries` no Supabase
- RLS policies para segurança
- Triggers automáticos

### ✅ API Utilities
- Check in na chegada
- Completar entrega
- Gerar links de rastreamento

---

## 🚀 Para Ativar Em 4 Passos

### 1️⃣ Instalar Mapbox
```bash
npm install mapbox-gl @types/mapbox-gl
# ou bun add mapbox-gl @types/mapbox-gl
```

### 2️⃣ Token Mapbox (.env.local)
```env
VITE_MAPBOX_PUBLIC_TOKEN=pk_YOUR_TOKEN_HERE
```

### 3️⃣ Migration Supabase
Copiar-colar `supabase/migrations/20260317_create_deliveries_table.sql` no Supabase SQL Editor e correr.

### 4️⃣ Testar
```
http://localhost:5173/delivery/any-uuid
```

---

## 📂 Ficheiros Criados

| Ficheiro | O Quê |
|----------|-------|
| `/src/pages/Delivery.tsx` | Página principal (rastreamento) |
| `/src/components/DeliveryMap.tsx` | Mapa Mapbox |
| `/src/components/DeliveryStatus.tsx` | Painel de status |
| `/src/hooks/useDelivery.ts` | Logic de negócio |
| `/src/lib/deliveryAPI.ts` | API calls |
| `/supabase/migrations/20260317_create_deliveries_table.sql` | Schema |
| `/DELIVERY_SETUP.md` | Instruções detalhadas |

---

## 💡 Como Usar

### Aceder ao rastreamento
```
/delivery/{delivery_id}
```

### Criar delivery (backend)
```typescript
const deliveryId = await createDeliveryFromAppointment({
  appointment_id: '...',
  customer_name: 'João',
  customer_address: 'Rua X, 123',
  customer_lat: 40.7128,
  customer_lon: -74.0060,
});
```

### Partilhar com cliente
```
Link: https://yoursite.com/delivery/{delivery_id}
Mensagem: "Rastreie sua entrega aqui: [link]"
```

---

## 🎬 Fluxo de Entrega

```
1. Agendamento criado (home-service)
   ↓
2. Sistema cria delivery automaticamente
   ↓
3. Link enviado para driver (SMS/Email)
   ↓
4. Driver clica → Página abre
   ↓
5. Driver clica "Iniciar Entrega"
   ↓
6. GPS ativa → Mapa atualiza em tempo real
   ↓
7. Chegou no local → Clica "Check-in"
   ↓
8. Completa serviço → Clica "Completar"
   ↓
9. Entrega concluída ✅
```

---

## 🗺️ O Que Mostra o Mapa

```
🟢 Linha = Rota entre driver e cliente
🚗 Verde = Localização atual do driver
📍 Azul = Endereço do cliente
Distance: 2.5 km
Status: En Route
```

---

## 🔐 Segurança

- ✅ RLS policies no Supabase
- ✅ Validação de IDs
- ✅ Geolocation requer permissão
- ✅ HTTPS necessário em produção

---

## 📊 Pronto Para:

- ✅ Home services (entregas)
- ✅ Delivery tracking (rastreamento)
- ✅ Real-time updates (atualizações ao vivo)
- ✅ Mobile responsivo
- ✅ GPS automático

---

**Lê [DELIVERY_SETUP.md](DELIVERY_SETUP.md) para instruções completas!** 📖
