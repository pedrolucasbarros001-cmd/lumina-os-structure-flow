import { useState } from 'react';
import { MapPin, Users } from 'lucide-react';
import ModernModal from '@/components/ModernModal';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: {
    title: string;
    organizer: string;
    location: string;
    attendees?: number;
    avatar?: string;
  };
}

/**
 * Exemplo de Modal para convites de eventos
 * Similar ao estilo da imagem com pontas arredondadas
 */
export default function InvitationModal({ isOpen, onClose, event }: InvitationModalProps) {
  const [accepting, setAccepting] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    // Simular chamada API
    setTimeout(() => {
      setAccepting(false);
      onClose();
    }, 1500);
  };

  const defaultEvent = {
    title: 'Meeting Professional',
    organizer: 'Pedro Basile',
    location: 'São Paulo, Brasil',
    attendees: 12,
    avatar: '👨‍💼',
    ...event,
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${defaultEvent.organizer} convida você`}
      subtitle={defaultEvent.title}
      size="md"
      darkMode={true}
      primaryAction={{
        label: 'Vou participar!',
        onClick: handleAccept,
        loading: accepting,
      }}
      secondaryAction={{
        label: 'Fechar',
      }}
    >
      {/* Avatar Section */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 blur-2xl opacity-40 rounded-full w-20 h-20"></div>
          <div className="relative w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg text-4xl">
            {defaultEvent.avatar}
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="space-y-6 pb-4">
        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">LOCALIZAÇÃO</p>
            <p className="text-sm font-semibold text-white">{defaultEvent.location}</p>
          </div>
        </div>

        {/* Attendees */}
        {defaultEvent.attendees && (
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">PARTICIPANTES</p>
              <p className="text-sm font-semibold text-white">{defaultEvent.attendees} pessoas confirmadas</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-xs text-slate-400 text-center">
            Confirme sua presença para não perder este evento importante
          </p>
        </div>
      </div>
    </ModernModal>
  );
}
