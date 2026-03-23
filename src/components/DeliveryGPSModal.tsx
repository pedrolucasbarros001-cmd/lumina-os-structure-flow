// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, AlertCircle, X, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deliveryAPI } from '@/lib/deliveryAPI';
import { cn } from '@/lib/utils';

interface DeliveryGPSModalProps {
  delivery: any;
  onClose: () => void;
  isOpen: boolean;
}

export function DeliveryGPSModal({ delivery, onClose, isOpen }: DeliveryGPSModalProps) {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [eta, setEta] = useState<number | null>(null);
  const { toast } = useToast();
  const watchIdRef = useRef<number | null>(null);

  // Inicia o rastreamento de GPS quando o modal abre
  useEffect(() => {
    if (!isOpen || !navigator.geolocation) return;

    const startTracking = () => {
      setLoading(true);

      // Primeiro, obter localização atual
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setDriverLocation({ lat: latitude, lon: longitude });
          setLoading(false);
        },
        (err) => {
          toast({
            variant: 'destructive',
            title: 'Erro de GPS',
            description: 'Não foi possível obter sua localização. Ative o GPS.',
          });
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      // Depois, assistir continuamente
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setDriverLocation({ lat: latitude, lon: longitude });
        },
        (err) => console.error('Watch position error:', err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    };

    startTracking();

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isOpen]);

  // Calcula distância e ETA quando a posição muda
  useEffect(() => {
    if (!driverLocation || !delivery) return;

    const dist = deliveryAPI.calculateDistance(
      driverLocation.lat,
      driverLocation.lon,
      delivery.customer_lat,
      delivery.customer_lon
    );
    setDistance(dist);

    const calculatedEta = deliveryAPI.calculateETA(
      driverLocation.lat,
      driverLocation.lon,
      delivery.customer_lat,
      delivery.customer_lon,
      40 // velocidade média
    );
    setEta(calculatedEta);
  }, [driverLocation, delivery]);

  const handleCheckIn = async () => {
    if (!driverLocation || !delivery) return;

    setCheckingIn(true);
    try {
      await deliveryAPI.checkIn(delivery.id, driverLocation.lat, driverLocation.lon);
      toast({
        title: 'Check-in realizado!',
        description: 'Você chegou ao destino.',
      });

      // Fechar o modal após 1.5 segundos
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro no Check-in',
        description: err instanceof Error ? err.message : 'Erro ao fazer check-in',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-4 safe-area-bottom">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-in fade-in slide-in-from-bottom-4 md:animate-none md:fade-in md:zoom-in">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Top Section - Info */}
        <div className="px-6 pt-8 pb-4 text-center">
          <h2 className="text-xl font-bold text-white mb-1">
            Entrega a caminho
          </h2>
          <p className="text-sm text-slate-300">
            {delivery.customer_name}
          </p>
        </div>

        {/* Map Area / GPS Display */}
        <div className="mx-4 h-64 bg-gradient-to-b from-slate-800 to-slate-700 rounded-2xl overflow-hidden relative border border-white/5 flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <p className="text-slate-300 font-medium text-sm">Ativando GPS...</p>
            </div>
          ) : driverLocation ? (
            <>
              {/* Mapa background (placeholder) */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
              </div>

              {/* GPS Marker */}
              <div className="relative z-10 text-center">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 blur-xl opacity-40 rounded-full w-24 h-24"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                      <Navigation className="w-7 h-7 text-blue-300" />
                    </div>
                  </div>
                </div>

                {distance !== null && (
                  <div className="mt-4">
                    <p className="text-slate-400 text-xs font-medium mb-1">DISTÂNCIA</p>
                    <p className="text-2xl font-bold text-white">
                      {distance < 1 
                        ? `${Math.round(distance * 1000)}m` 
                        : `${distance.toFixed(1)}km`
                      }
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-10 h-10 text-amber-500" />
              <p className="font-semibold text-white text-sm">GPS não disponível</p>
              <p className="text-xs text-slate-400 text-center max-w-xs">
                Verifique se o GPS está ativado
              </p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mx-4 mt-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="grid grid-cols-2 gap-4">
            {eta !== null && (
              <div className="text-center">
                <p className="text-slate-400 text-xs font-medium mb-1">TEMPO ESTIMADO</p>
                <p className="text-2xl font-bold text-cyan-300">{eta}min</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-slate-400 text-xs font-medium mb-1">DESTINO</p>
              <p className="text-sm font-semibold text-white truncate">{delivery.customer_address}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-4 flex gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 rounded-2xl h-12 border border-white/20 hover:bg-white/10 text-white"
          >
            Fechar
          </Button>
          <Button
            onClick={handleCheckIn}
            disabled={checkingIn || loading}
            className={cn(
              "flex-1 rounded-2xl h-12 font-semibold gap-2",
              "bg-gradient-to-r from-emerald-500 to-teal-500",
              "hover:from-emerald-600 hover:to-teal-600",
              "shadow-lg shadow-emerald-500/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {checkingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4" />
                Chegou!
              </>
            )}
          </Button>
        </div>

        {/* Safe Area Spacing */}
        <div className="h-safe" />
      </div>
    </div>
  );
}
