// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deliveryAPI } from '@/lib/deliveryAPI';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md h-[90vh] max-h-[900px] bg-background rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <MapPin className="w-5 h-5" />
            <div>
              <h2 className="font-bold">Rastreamento GPS</h2>
              <p className="text-sm text-blue-100">{delivery.customer_address}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mapa/GPS Simulado */}
        <div className="flex-1 bg-gradient-to-b from-sky-100 to-blue-50 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Fundo estilizado como mapa */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/3 w-32 h-32 bg-gray-300 rounded-full blur-2xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-200 rounded-full blur-3xl"></div>
          </div>

          {/* Conteúdo GPS */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-gray-600 font-medium">Ativando GPS...</p>
              </div>
            ) : driverLocation ? (
              <>
                {/* Marcador de GPS */}
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-30 rounded-full w-20 h-20"></div>
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                {/* Info de Distância e ETA */}
                <div className="text-center">
                  {distance !== null && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Distância até destino</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {distance.toFixed(2)} km
                      </p>
                    </div>
                  )}

                  {eta !== null && (
                    <div>
                      <p className="text-sm text-gray-600">Tempo estimado</p>
                      <p className="text-2xl font-bold text-purple-600">{eta} min</p>
                    </div>
                  )}
                </div>

                {/* Coordenadas */}
                <div className="text-xs text-gray-500 text-center">
                  <p>Lat: {driverLocation.lat.toFixed(6)}</p>
                  <p>Lon: {driverLocation.lon.toFixed(6)}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 text-orange-600">
                <AlertCircle className="w-12 h-12" />
                <p className="font-medium">GPS não disponível</p>
                <p className="text-sm text-center text-gray-600">
                  Verifique se o GPS está ativado no seu dispositivo
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Botão Check-in */}
        <div className="bg-background border-t p-4 space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600">
              Você receberá uma notificação quando estiver próximo de <strong>200m</strong> do destino.
            </p>
          </div>

          <Button
            onClick={handleCheckIn}
            disabled={!driverLocation || checkingIn}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg"
          >
            {checkingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fazendo Check-in...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Cheguei no Destino
              </>
            )}
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
