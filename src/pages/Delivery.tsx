// @ts-nocheck
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useDelivery } from '@/hooks/useDelivery';
import { deliveryAPI } from '@/lib/deliveryAPI';
import { Loader2, AlertCircle, MapPin, Clock, CheckCircle2, Navigation, Phone, Truck, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import AddressMap from '@/components/AddressMap';

const STATUS_CONFIG = {
  pending: {
    label: 'Agendado',
    description: 'O profissional está a preparar-se para ir ao seu encontro.',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    ringColor: 'ring-amber-500/30',
    step: 0,
  },
  en_route: {
    label: 'A caminho',
    description: 'O profissional está a dirigir-se para o local indicado.',
    icon: Navigation,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    ringColor: 'ring-blue-500/30',
    step: 1,
  },
  arrived: {
    label: 'No local',
    description: 'O profissional chegou ao destino. Serviço em andamento.',
    icon: MapPin,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    ringColor: 'ring-emerald-500/30',
    step: 2,
  },
  completed: {
    label: 'Concluído',
    description: 'O serviço foi concluído com sucesso. Obrigado!',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    ringColor: 'ring-emerald-500/30',
    step: 3,
  },
  cancelled: {
    label: 'Cancelado',
    description: 'Este serviço foi cancelado.',
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    ringColor: 'ring-red-500/30',
    step: -1,
  },
};

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Agendado', icon: Clock },
  { key: 'en_route', label: 'A caminho', icon: Truck },
  { key: 'arrived', label: 'No local', icon: MapPin },
  { key: 'completed', label: 'Concluído', icon: CheckCircle2 },
];

export default function Delivery() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const { toast } = useToast();
  const { data: delivery, isLoading, error } = useDelivery(deliveryId || '');
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  // Recalculate distance/ETA when delivery updates
  useEffect(() => {
    if (!delivery?.driver_lat || !delivery?.driver_lng || !delivery?.customer_lat || !delivery?.customer_lng) return;
    
    const dist = deliveryAPI.calculateDistance(
      delivery.driver_lat, delivery.driver_lng,
      delivery.customer_lat, delivery.customer_lng
    );
    setDistance(dist);
    setEta(deliveryAPI.calculateETA(
      delivery.driver_lat, delivery.driver_lng,
      delivery.customer_lat, delivery.customer_lng, 40
    ));
  }, [delivery]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold mb-2">Entrega não encontrada</h1>
          <p className="text-muted-foreground text-sm">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (isLoading || !delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  const status = delivery.status || 'pending';
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const currentStep = config.step;

  return (
    <div className="min-h-screen bg-background">
      {/* Header gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative px-4 pt-12 pb-6 max-w-lg mx-auto">
          {/* Status orb */}
          <div className="flex flex-col items-center mb-6">
            <div className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center mb-4',
              'ring-4 shadow-lg',
              config.bgColor, config.ringColor,
              status === 'en_route' && 'animate-pulse'
            )}>
              <StatusIcon className={cn('w-9 h-9', config.color)} />
            </div>
            <h1 className={cn('text-2xl font-bold', config.color)}>{config.label}</h1>
            <p className="text-sm text-muted-foreground text-center mt-1 max-w-xs">
              {config.description}
            </p>
          </div>

          {/* Live metrics (only when en_route) */}
          {status === 'en_route' && (distance !== null || eta !== null) && (
            <div className="flex gap-3 justify-center mb-4">
              {distance !== null && (
                <div className="glass-card rounded-2xl px-5 py-3 text-center border border-border/30">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Distância</p>
                  <p className="text-xl font-bold mt-0.5">
                    {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                  </p>
                </div>
              )}
              {eta !== null && (
                <div className="glass-card rounded-2xl px-5 py-3 text-center border border-border/30">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Chegada</p>
                  <p className="text-xl font-bold mt-0.5">{eta}min</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 pb-8 space-y-4">
        
        {/* Timeline */}
        <div className="glass-card rounded-2xl p-4 border border-border/30">
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-border/50 z-0" />
            <div 
              className="absolute top-5 left-5 h-0.5 bg-primary z-0 transition-all duration-700"
              style={{ width: currentStep >= 0 ? `${Math.min((currentStep / 3) * 100, 100)}%` : '0%' }}
            />

            {TIMELINE_STEPS.map((step, i) => {
              const isActive = currentStep >= i;
              const isCurrent = currentStep === i;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    isActive ? 'bg-primary border-primary text-primary-foreground shadow-md' : 'bg-card border-border text-muted-foreground',
                    isCurrent && 'ring-4 ring-primary/20 scale-110'
                  )}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold text-center',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Map */}
        {delivery.customer_address && status !== 'completed' && (
          <AddressMap 
            address={delivery.customer_address} 
            label="Destino"
            driverLat={delivery.driver_lat}
            driverLng={delivery.driver_lng}
            showNavigateButton={false}
          />
        )}

        {/* Customer info */}
        <div className="glass-card rounded-2xl p-4 border border-border/30 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{delivery.customer_name}</p>
              {delivery.customer_address && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{delivery.customer_address}</p>
              )}
            </div>
          </div>

          {delivery.customer_phone && (
            <a 
              href={`tel:${delivery.customer_phone}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <Phone className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{delivery.customer_phone}</span>
            </a>
          )}
        </div>

        {/* Completed state */}
        {status === 'completed' && (
          <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-emerald-500/5 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400">Serviço concluído!</h3>
            <p className="text-sm text-muted-foreground mt-1">Obrigado pela sua confiança.</p>
          </div>
        )}

        {/* Footer brand */}
        <div className="text-center pt-4">
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] font-medium">
            Powered by Lumina
          </p>
        </div>
      </div>
    </div>
  );
}
