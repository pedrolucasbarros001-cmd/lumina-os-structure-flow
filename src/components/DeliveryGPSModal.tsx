import { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, X, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deliveryAPI } from '@/lib/deliveryAPI';
import { cn } from '@/lib/utils';
import SlideToAction from '@/components/SlideToAction';

interface DeliveryGPSModalProps {
  delivery: {
    id: string;
    customer_name?: string;
    customer_lat?: number;
    customer_lng?: number;
    customer_address?: string;
  };
  onClose: () => void;
  isOpen: boolean;
}

export function DeliveryGPSModal({ delivery, onClose, isOpen }: DeliveryGPSModalProps) {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const { toast } = useToast();
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || !navigator.geolocation) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        toast({ variant: 'destructive', title: 'Erro de GPS', description: 'Ative o GPS.' });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [isOpen]);

  useEffect(() => {
    if (!driverLocation || !delivery?.customer_lat || !delivery?.customer_lng) return;
    const dist = deliveryAPI.calculateDistance(driverLocation.lat, driverLocation.lng, delivery.customer_lat, delivery.customer_lng);
    setDistance(dist);
    setEta(deliveryAPI.calculateETA(driverLocation.lat, driverLocation.lng, delivery.customer_lat, delivery.customer_lng, 40));
  }, [driverLocation, delivery]);

  const handleCheckIn = async () => {
    if (!driverLocation || !delivery) return;
    await deliveryAPI.checkIn(delivery.id, driverLocation.lat, driverLocation.lng);
    toast({ title: 'Check-in realizado!', description: 'Chegou ao destino.' });
    setTimeout(onClose, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border/30 animate-in fade-in slide-in-from-bottom-4">
        
        <button onClick={onClose} className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center">
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-8 pb-4 text-center">
          <h2 className="text-xl font-bold mb-1">A caminho</h2>
          <p className="text-sm text-muted-foreground">{delivery.customer_name}</p>
        </div>

        <div className="mx-4 h-48 bg-muted rounded-2xl overflow-hidden relative flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-muted-foreground text-sm">Ativando GPS...</p>
            </div>
          ) : driverLocation ? (
            <div className="relative z-10 text-center">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center ring-4 ring-primary/20">
                  <Navigation className="w-8 h-8 text-primary" />
                </div>
              </div>
              {distance !== null && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Distância</p>
                  <p className="text-2xl font-bold">
                    {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-10 h-10 text-amber-500" />
              <p className="font-semibold text-sm">GPS indisponível</p>
            </div>
          )}
        </div>

        {eta !== null && (
          <div className="mx-4 mt-3 p-3 bg-muted/50 rounded-2xl text-center">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Tempo estimado</p>
            <p className="text-xl font-bold text-primary">{eta}min</p>
          </div>
        )}

        <div className="px-4 py-4">
          <SlideToAction
            label="Deslize para check-in"
            color="green"
            onConfirm={handleCheckIn}
            onClose={onClose}
          />
        </div>

        <div className="h-safe" />
      </div>
    </div>
  );
}
