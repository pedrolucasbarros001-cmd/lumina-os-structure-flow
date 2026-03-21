# PROMPT COMPLETO PARA LOVABLE - LUMINA OS IMPLEMENTATION

## CONTEXTO
Projeto: LUMINA OS (React + TypeScript + Supabase)
Objetivo: Implementar todas as funcionalidades do sistema do ZERO, sem deixar nada incompleto.

---

## 1. CRIAR AS TABELAS NO SUPABASE

Execute ESTE SQL no Supabase SQL Editor:

```sql
BEGIN;

-- ============================================================
-- CRIAR TABELAS (se não existem)
-- ============================================================

-- unit_gallery table
CREATE TABLE IF NOT EXISTS public.unit_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_address TEXT NOT NULL,
  customer_lat NUMERIC NOT NULL,
  customer_lon NUMERIC NOT NULL,
  driver_lat NUMERIC,
  driver_lon NUMERIC,
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADICIONAR COLUNAS (IF NOT EXISTS)
-- ============================================================

-- clients table
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS technical_notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS preferred_staff_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS parent_appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE;

-- units table
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS min_booking_notice_hours INTEGER DEFAULT 0;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 60;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS buffer_minutes INTEGER DEFAULT 0;
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS allow_any_staff BOOLEAN DEFAULT true;

-- services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- unit_gallery - adicionar service_id
ALTER TABLE public.unit_gallery ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE CASCADE;

-- ============================================================
-- CRIAR ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_clients_preferred_staff ON public.clients(preferred_staff_id);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON public.clients USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_appointments_parent_id ON public.appointments(parent_appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_recurrence ON public.appointments(unit_id, recurrence_type);
CREATE INDEX IF NOT EXISTS idx_unit_gallery_unit_id ON public.unit_gallery(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_gallery_service_id ON public.unit_gallery(service_id);
CREATE INDEX IF NOT EXISTS idx_unit_gallery_order ON public.unit_gallery(unit_id, display_order);
CREATE INDEX IF NOT EXISTS idx_deliveries_appointment_id ON public.deliveries(appointment_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_unit_id ON public.deliveries(unit_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

COMMIT;
```

---

## 2. CRIAR COMPONENTES REACT

### A. `src/components/DeliveryGPSPanel.tsx` (380 lines)
Component para rastreamento GPS em tempo real de entregas.

Funcionalidades:
- Obter localização GPS do dispositivo
- Exibir mapa com Mapbox Static API
- Calcular distância até o destino (Haversine formula)
- Botão "Check-in" ao chegar
- Mostrar status: "Requesting GPS" → "Active" → "Arrived"
- Atualizar coordenadas no banco: `appointments.last_location_lat`, `last_location_lng`

Props:
```typescript
interface DeliveryGPSPanelProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onCheckin: () => void;
}
```

Integrar em: `AppointmentDetailSheet.tsx` → componente já existe, ADICIONE este:
```tsx
{appointment.type === 'home' && (
  <DeliveryGPSPanel 
    open={gpsOpen} 
    onClose={() => setGpsOpen(false)}
    appointment={appointment}
    onCheckin={handleCheckin}
  />
)}
```

---

### B. `src/components/PublicProfileSection.tsx` (142 lines)
Component para gerenciar vitrine pública da unidade.

Funcionalidades:
- Campo "Sobre" (about - textarea)
- Campo Instagram URL (instagram_url)
- Campo "Política de Cancelamento" (cancellation_policy - textarea)
- Campos de políticas de booking:
  - min_booking_notice_hours (integer - horas antecedência mínima)
  - max_advance_booking_days (integer - máximo dias permitidos)
  - buffer_minutes (integer - minutos entre agendamentos)
  - allow_any_staff (boolean - checkbox)
- Botão SALVAR que faz update na tabela `units`
- Toast notification ao salvar

Integrar em: `Unit.tsx` → adicione após outra section:
```tsx
<PublicProfileSection />
```

---

### C. `src/components/AdvancedMetricsSection.tsx` (170 lines)
Component de 4 cards com métricas avançadas para dashboard.

Funcionalidades:
1. **New vs Returning Clients** (últimos 30 dias)
   - Mostrar em card com 2 números: "5 New | 12 Returning"
   - Usar BarChart do Recharts

2. **No-Show Rate %**
   - % de appointments com status 'no_show'
   - Mostrar em card com progresso visual

3. **Peak Hours Distribution**
   - Mostrar qual hora tem mais agendamentos (0-23)
   - Usar BarChart Recharts

4. **Top Services by Revenue**
   - Top 3 serviços com maior receita total
   - Usar Recharts

UseHooks necessários:
- `useAppointments()` → retorna appointments com datetime, status
- `useServices()` → retorna serviços
- `useClients()` → retorna clientes com created_at

Integrar em: `Dashboard.tsx` → adicione antes do closing div:
```tsx
<AdvancedMetricsSection />
```

---

### D. `src/components/ServiceImageUpload.tsx` (129 lines)
Component para upload e gerenciamento de galeria de imagens de serviços.

Funcionalidades:
- Drag-and-drop upload (ou click para selecionar)
- Exibir lista de imagens já salvas
- Botão delete (X) no hover
- Reorder by drag-drop (salva display_order)
- Loading state durante upload
- Integração com Supabase Storage: `units/{unit_id}/services/{service_id}/`
- Criar/update records em `unit_gallery` table

Props:
```typescript
interface ServiceImageUploadProps {
  serviceId: string;
}
```

Integrar em: `Catalogo.tsx` → dentro do EditServiceSheet, adicione:
```tsx
<ServiceImageUpload serviceId={service.id} />
```

---

## 3. CRIAR CUSTOM HOOKS

### A. `src/hooks/useServiceGallery.ts` (137 lines)

```typescript
// Hook para gerenciar galeria de imagens de serviços

interface GalleryImage {
  id: string;
  url: string;
  display_order: number;
}

export function useServiceGallery(serviceId: string | undefined) {
  // Queries
  const { data: images, isLoading } = useQuery({
    queryKey: ['service_gallery', serviceId],
    queryFn: async () => {
      // SELECT * FROM unit_gallery WHERE service_id = serviceId ORDER BY display_order
      // Retornar array de { id, url, display_order }
    }
  });

  // Mutations
  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      // 1. Upload para Supabase Storage: `units/{unit_id}/services/{service_id}/{uuid}.{ext}`
      // 2. INSERT em unit_gallery com url e display_order = MAX(display_order) + 1
      // 3. Retornar imagem criada
    }
  });

  const deleteImage = useMutation({
    mutationFn: async (imageId: string) => {
      // 1. DELETE do Storage
      // 2. DELETE da unit_gallery
    }
  });

  const reorderImages = useMutation({
    mutationFn: async (imageIds: string[]) => {
      // FOR EACH imageId em ordem:
      //   UPDATE unit_gallery SET display_order = index WHERE id = imageId
    }
  });

  return {
    images,
    isLoading,
    uploadImage,
    deleteImage,
    reorderImages
  };
}
```

---

### B. `src/hooks/useUnitPublicProfile.ts` (47 lines)

```typescript
// Hook para gerenciar perfil público da unidade

interface PublicProfile {
  about: string | null;
  instagram_url: string | null;
  cancellation_policy: string | null;
  min_booking_notice_hours: number;
  max_advance_booking_days: number;
  buffer_minutes: number;
  allow_any_staff: boolean;
}

export function useUnitPublicProfile(unitId: string | undefined) {
  // Query
  const { data: profile } = useQuery({
    queryKey: ['unit_public_profile', unitId],
    queryFn: async () => {
      // SELECT about, instagram_url, cancellation_policy, min_booking_notice_hours, 
      //        max_advance_booking_days, buffer_minutes, allow_any_staff 
      // FROM units WHERE id = unitId
      // Retornar como PublicProfile
    }
  });

  // Mutation
  const updateProfile = useMutation({
    mutationFn: async (data: Partial<PublicProfile>) => {
      // UPDATE units SET ... WHERE id = unitId
      // Retornar profile atualizado
    }
  });

  return { data: profile, updateProfile };
}
```

---

## 4. MODIFICAR PÁGINAS EXISTENTES

### A. `src/pages/Unit.tsx`
Adicione após outra seção (exemplo: depois de campos básicos):
```tsx
import { PublicProfileSection } from '@/components/PublicProfileSection';

// Dentro do JSX:
<PublicProfileSection />
```

### B. `src/pages/Dashboard.tsx`
Adicione antes do closing div:
```tsx
import { AdvancedMetricsSection } from '@/components/AdvancedMetricsSection';

// Dentro do JSX:
<AdvancedMetricsSection />
```

### C. `src/pages/Catalogo.tsx`
No EditServiceSheet, adicione:
```tsx
import { ServiceImageUpload } from '@/components/ServiceImageUpload';

// Dentro do JSX:
<ServiceImageUpload serviceId={service.id} />

// Também adicione field "category":
<Input 
  name="category" 
  placeholder="Ex: Hair, Nails, Massage" 
  value={formData.category || ''}
  onChange={(e) => setFormData({...formData, category: e.target.value})}
/>
```

### D. `src/pages/PublicBooking.tsx`
Modifique o hook `useEffect` que gera disponibilidades:

```typescript
const { data: unit } = useUnit();

useMemo(() => {
  // Apply max_advance_booking_days policy
  const maxDays = unit?.max_advance_booking_days || 60;
  const maxDate = addDays(new Date(), maxDays);

  // Apply min_booking_notice_hours policy  
  const minBookingNoticeHours = unit?.min_booking_notice_hours || 24;
  
  // Apply buffer_minutes policy
  const bufferMinutes = unit?.buffer_minutes || 0;

  // Generate times respeitando estas políticas
  // Time slots não devem violar estas restrições
  
  // Apply allow_any_staff policy
  // Se allow_any_staff === true, mostrar opção "Qualquer Staff"
  
  return filteredTimes;
}, [unit?.max_advance_booking_days, unit?.min_booking_notice_hours, unit?.buffer_minutes, unit?.allow_any_staff]);

// No rendering:
{unit?.allow_any_staff && (
  <Button>Qualquer Staff</Button>
)}

// Display cancellation_policy
<Text>{unit?.cancellation_policy}</Text>
```

### E. `src/pages/NewAppointmentSheet.tsx`
Adicione suporte a recurrence:

```typescript
const [hasRecurrence, setHasRecurrence] = useState(false);
const [recurrenceType, setRecurrenceType] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
const [recurrenceCount, setRecurrenceCount] = useState(2);

// No submit:
if (hasRecurrence && recurrenceCount > 1) {
  const daysToAdd = recurrenceType === 'weekly' ? 7 : recurrenceType === 'biweekly' ? 14 : 30;
  const parentApptId = appointments[0].id; // Primeiro agendamento

  for (let i = 1; i < recurrenceCount; i++) {
    const newDateTime = addDays(datetime, daysToAdd * i);
    // CREATE appointment com parent_appointment_id = parentApptId
  }
}

// No rendering:
<Checkbox 
  checked={hasRecurrence}
  onChange={() => setHasRecurrence(!hasRecurrence)}
  label="Repetir agendamento"
/>

{hasRecurrence && (
  <>
    <Select
      value={recurrenceType}
      onChange={(val) => setRecurrenceType(val)}
      options={[
        { value: 'weekly', label: 'Semanal' },
        { value: 'biweekly', label: 'Quinzenal' },
        { value: 'monthly', label: 'Mensal' }
      ]}
    />
    <Input
      type="number"
      min={2}
      value={recurrenceCount}
      onChange={(e) => setRecurrenceCount(Number(e.target.value))}
      placeholder="Quantas vezes?"
    />
  </>
)}
```

---

## 5. REGENERAR TIPOS TYPESCRIPT

```bash
export PATH=$HOME/.node/node-v20.11.1-darwin-x64/bin:$PATH
cd "/Users/pedrolucas/LUMINA OS/VSCODE Lumina OS/lumina-os-structure-flow"
npx supabase gen types typescript --local
```

Depois remover `// @ts-nocheck` dos componentes criados.

---

## 6. TESTAR

```bash
npm run dev
```

Abra http://localhost:8082 e teste:
- ✅ GPS Panel em Appointments
- ✅ Service Gallery em Catalogo
- ✅ Advanced Metrics em Dashboard
- ✅ Booking Policies em PublicBooking
- ✅ Recurrence em NewAppointmentSheet
- ✅ Public Profile em Unit

---

## 7. BUILD

```bash
npm run build
```

Se houver errors TypeScript, corrigir com types corretos.

---

## 8. DEPLOY

Commit e push to git, depois deploy.

---

**STATUS FINAL: System 100% Completo**
