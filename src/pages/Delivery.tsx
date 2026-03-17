import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import DeliveryMap from '@/components/DeliveryMap';
import DeliveryStatus from '@/components/DeliveryStatus';
import {
  useDelivery,
  useStartDelivery,
  useCurrentLocation,
  useUpdateDriverLocation,
  useDeliveryRealtime,
  type DeliveryLocation,
} from '@/hooks/useDelivery';
import { deliveryAPI } from '@/lib/deliveryAPI';
import { Loader2, AlertCircle } from 'lucide-react';

export default function Delivery() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const { toast } = useToast();

  const { data: delivery, isLoading, error } = useDelivery(deliveryId || '');
  const startDeliveryMutation = useStartDelivery();
  const updateLocationMutation = useUpdateDriverLocation();
  const { getLocation, watchLocation } = useCurrentLocation();
  const [driverLocation, setDriverLocation] = useState<DeliveryLocation | undefined>();
  const [isTracking, setIsTracking] = useState(false);

  useDeliveryRealtime(deliveryId || '', () => {});

  const handleStartDelivery = async () => {
    if (!deliveryId) return;
    try {
      const location = await getLocation();
      setDriverLocation(location);
      await startDeliveryMutation.mutateAsync(deliveryId);
      setIsTracking(true);
      watchLocation((loc) => {
        setDriverLocation(loc);
        updateLocationMutation.mutate({ deliveryId, lat: loc.latitude, lon: loc.longitude });
      });
      toast({ title: 'Entrega iniciada', description: 'GPS ativo.' });
    } catch (err) {
      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Erro ao iniciar', variant: 'destructive' });
    }
  };

  const handleCheckIn = async () => {
    if (!deliveryId) return;
    try {
      const location = await getLocation();
      await deliveryAPI.checkIn(deliveryId, location.latitude, location.longitude);
      toast({ title: 'Check-in feito', description: 'Chegou ao destino!' });
    } catch (err) {
      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Erro no check-in', variant: 'destructive' });
    }
  };

  const handleComplete = async () => {
    if (!delivery) return;
    try {
      await deliveryAPI.completeDelivery(delivery.id, delivery.appointment_id);
      toast({ title: 'Entrega concluída!' });
    } catch (err) {
      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Erro ao completar', variant: 'destructive' });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-900 mb-2">Entrega não encontrada</h1>
          <p className="text-red-700 text-sm">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (isLoading || !delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando entrega...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">Rastreamento de Entrega</h1>
        <div className="h-72 md:h-96 w-full">
          <DeliveryMap delivery={delivery} driverLocation={driverLocation} />
        </div>
        <DeliveryStatus
          delivery={delivery}
          isLoading={startDeliveryMutation.isPending || updateLocationMutation.isPending}
          canStart={!delivery.started_at}
          canComplete={delivery.status === 'arrived'}
          onStart={handleStartDelivery}
          onCheckIn={handleCheckIn}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
