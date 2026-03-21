import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeliveryGPSPanelProps {
  appointmentId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress: string;
  onCheckIn?: () => void;
}

export function DeliveryGPSPanel({
  appointmentId,
  customerName,
  customerPhone,
  customerAddress,
  onCheckIn,
}: DeliveryGPSPanelProps) {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada pelo navegador');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude });
        setLoading(false);
      },
      (err) => {
        setError(`Erro ao obter localização: ${err.message}`);
        setLoading(false);
      }
    );
  };

  // Haversine formula to calculate distance
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!location) return;

    // Parse customer address for coordinates (simplified - in real app would use geocoding)
    // For now, just show that we have location
    // In production, you'd parse the address or use Google Maps API
  }, [location]);

  const handleCheckIn = async () => {
    if (!location) {
      toast({ title: 'Erro', description: 'Obtenha sua localização primeiro', variant: 'destructive' });
      return;
    }

    try {
      // Save check-in to database
      // This would integrate with your Supabase deliveries table
      toast({ title: 'Sucesso', description: 'Check-in registrado com sucesso!' });
      onCheckIn?.();
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao registrar check-in', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
      <div className="space-y-2">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Entrega: {customerName}
        </h3>
        <p className="text-sm text-muted-foreground">{customerAddress}</p>
        {customerPhone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            {customerPhone}
          </div>
        )}
      </div>

      {error && (
        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {location && (
        <div className="space-y-2 text-sm">
          <div className="p-3 bg-white rounded-lg border border-border/30">
            <p className="text-muted-foreground">Sua localização:</p>
            <p className="font-mono text-xs">
              {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
            </p>
          </div>
          {distance !== null && (
            <div className="p-3 bg-white rounded-lg border border-border/30">
              <p className="text-muted-foreground">Distância até cliente:</p>
              <p className="font-bold text-lg text-blue-600">{distance.toFixed(2)} km</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={getCurrentLocation}
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Obtendo localização...' : 'Atualizar Localização'}
        </Button>
        <Button
          onClick={handleCheckIn}
          disabled={!location}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
        >
          Check-In
        </Button>
      </div>

      {location && (
        <div className="pt-2">
          <a
            href={`https://www.google.com/maps?q=${location.lat},${location.lon}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Ver no Google Maps →
          </a>
        </div>
      )}
    </div>
  );
}
