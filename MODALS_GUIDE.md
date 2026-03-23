# 📱 Modern Modal Components Library

## Overview

Uma biblioteca completa de componentes de modal modernos com design premium, pontas arredondadas e animações suaves. Todos os modais seguem o mesmo padrão de design e podem ser customizados.

## Componentes Disponíveis

### 1. **ModernModal** (Base Component)

Componente base reutilizável para criar qualquer tipo de modal.

#### Props

```typescript
interface ModernModalProps {
  isOpen: boolean;                    // Controla se o modal está visível
  onClose: () => void;                // Callback ao fechar
  title?: string;                     // Título do modal
  subtitle?: string;                  // Subtítulo (opcional)
  children: ReactNode;                // Conteúdo principal
  primaryAction?: {                   // Botão de ação principal
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {                 // Botão secundário (ex: Cancelar)
    label: string;
    onClick?: () => void;
  };
  className?: string;                 // Classes customizadas
  darkMode?: boolean;                 // Tema escuro (padrão: true)
  size?: 'sm' | 'md' | 'lg';          // Tamanho do modal
}
```

#### Exemplo Básico

```typescript
import { useState } from 'react';
import ModernModal from '@/components/ModernModal';

export function CustomModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir Modal</button>
      
      <ModernModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Meu Modal"
        subtitle="Descrição opcional"
        primaryAction={{
          label: 'Confirmar',
          onClick: () => console.log('Confirmado!'),
        }}
        secondaryAction={{
          label: 'Cancelar',
        }}
      >
        <p>Seu conteúdo aqui</p>
      </ModernModal>
    </>
  );
}
```

---

### 2. **InvitationModal**

Modal para convites de eventos com design elegante.

#### Props

```typescript
interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: {
    title: string;          // Título do evento
    organizer: string;      // Nome do organizador
    location: string;       // Localização
    attendees?: number;     // Número de participantes
    avatar?: string;        // Emoji ou URL do avatar
  };
}
```

#### Exemplo de Uso

```typescript
import { useState } from 'react';
import InvitationModal from '@/components/InvitationModal';

export function EventPage() {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <>
      <button onClick={() => setShowInvite(true)}>Ver Convite</button>
      
      <InvitationModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        event={{
          title: 'Workshop de Design',
          organizer: 'Pedro Basile',
          location: 'São Paulo, Brasil',
          attendees: 12,
          avatar: '👨‍💼',
        }}
      />
    </>
  );
}
```

---

### 3. **PromoModal**

Modal para exibir promoções e códigos de desconto.

#### Props

```typescript
interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  promo?: {
    title: string;        // Título da promoção
    discount: string;     // Percentual ou valor (ex: "50%")
    description: string;  // Descrição da oferta
    code?: string;        // Código promocional (copiável)
  };
}
```

#### Exemplo de Uso

```typescript
import { useState } from 'react';
import PromoModal from '@/components/PromoModal';

export function HomePage() {
  const [showPromo, setShowPromo] = useState(false);

  return (
    <>
      <button onClick={() => setShowPromo(true)}>Ver Oferta</button>
      
      <PromoModal
        isOpen={showPromo}
        onClose={() => setShowPromo(false)}
        promo={{
          title: 'Oferta de Verão',
          discount: '50%',
          description: 'Desconto em todos os serviços premium',
          code: 'SUMMER50',
        }}
      />
    </>
  );
}
```

---

### 4. **ConfirmationModal**

Modal de confirmação com suporte a múltiplos níveis (info/warning/success/error).

#### Props

```typescript
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  level?: 'info' | 'warning' | 'success' | 'error';
  confirmText?: string;                // Texto do botão (padrão: "Confirmar")
  cancelText?: string;                 // Texto cancelamento (padrão: "Cancelar")
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
}
```

#### Exemplo de Uso

```typescript
import { useState } from 'react';
import ConfirmationModal from '@/components/ConfirmationModal';

export function DeleteConfirm() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    // Chamada API
    await deleteItem();
    setDeleting(false);
  };

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>Deletar</button>
      
      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Deletar Item?"
        message="Essa ação não pode ser desfeita. Tem certeza?"
        level="error"
        confirmText="Sim, deletar"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
```

---

## 🎨 Features

✅ **Design Premium**
- Pontas arredondadas (rounded-3xl)
- Gradientes suaves
- Efeitos de glow nos ícones

✅ **Responsivo**
- Bottom sheet em mobile
- Centered em desktop
- Safe area support para iPhone notch

✅ **Animações Limpas**
- Fade in/out
- Slide in from bottom (mobile)
- Zoom in (desktop)

✅ **Temas Customizáveis**
- Modo escuro (padrão)
- Modo claro
- Cores dos ícones por nível

✅ **Acessibilidade**
- Suporte a close button
- Backdrop dismissible
- Safe area support

---

## 🚀 Quick Start

### Uso Básico do DeliveryGPSModal (Redesenhado)

```typescript
import { DeliveryGPSModal } from '@/components/DeliveryGPSModal';

export function Delivery() {
  const [showGPS, setShowGPS] = useState(false);
  const { delivery } = useDelivery(deliveryId);

  return (
    <>
      <DeliveryGPSModal
        isOpen={showGPS}
        onClose={() => setShowGPS(false)}
        delivery={delivery}
      />
    </>
  );
}
```

---

## 📦 Componentes na Pasta

```
src/components/
├── ModernModal.tsx           # Base component
├── DeliveryGPSModal.tsx      # GPS tracking modal (redesenhado)
├── InvitationModal.tsx       # Event invitations
├── PromoModal.tsx            # Special offers
└── ConfirmationModal.tsx     # Confirmations (info/warning/success/error)
```

---

## 🎯 Próximas Melhorias

- [ ] Adicionar suporte a custom icons
- [ ] Swipe-to-dismiss em mobile
- [ ] Animação de entrada customizável
- [ ] Stacking de múltiplos modals
- [ ] Templates para casos específicos (checkout, surveys, etc)

---

## 📝 Notas

- Todos os modais herdam de `ModernModal`
- Estilos usando Tailwind CSS + custom classes
- Suporte completo a dark mode
- Animações smooth em todas as transições
