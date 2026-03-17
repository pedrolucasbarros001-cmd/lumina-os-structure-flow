import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import DeliveryMap from '@/components/DeliveryMap';
import DeliveryStatus from '@/components/DeliveryStatus';
import {
  useDelivery,
  useStartDelivery,
  useCurrentLocation,
  useUpdateDriverLocation,
  useDeliveryRealtime,
  type DeliveryLocation,
  type Delivery as DeliveryType,
} from '@/hooks/useDelivery';
import { deliveryAPI } from '@/lib/deliveryAPI';
import { Loader2 } from 'lucide-react';

export default function Delivery() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const { toast } = useToast();

  // Queries
  const { data: delivery, isLoading, error } = useDelivery(deliveryId || '');
  const startDeliveryMutation = useStartDelivery();
  const updateLocationMutation = useUpdateDriverLocation();

  // Location tracking
  const { getLocation, watchLocation } = useCurrentLocation();
  const [driverLocation, setDriverLocation] = useState<DeliveryLocation | undefined>();
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [realtimeDelivery, setRealtimeDelivery] = useState<DeliveryType[]>([]);

  // Subscribe to real-time updates
  useDeliveryRealtime(deliveryId || '', (updatedDelivery) => {
    toast({
      description: `Entrega atualizada: ${updatedDelivery.status}`,
      duration: 2000,
    });
  });

  // Start delivery and location tracking
  const handleStartDelivery = async () => {
    if (!deliveryId) return;

    try {
      // Get current location first
      const location = await getLocation();
      setDriverLocation(location);

      // Start delivery in database
      await startDeliveryMutation.mutateAsync(deliveryId);

      // Start watching location
      setIsTrackingLocation(true);
      const unwatch = watchLocation((location) => {
        setDriverLocation(location);

        // Update driver location in database
        updateLocationMutation.mutate({
          deliveryId,
          lat: location.latitude,
          lon: location.longitude,
        });
      });

      toast({
        title: 'Sucesso',
        description: 'Entrega iniciada! Rastreamento de local ativado.',
      });

      return () => unwatch?.();
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao iniciar entrega',
        variant: 'destructive',
      });
    }
  };

  const handleCheckIn = async () => {
    if (!deliveryId || !delivery) return;

    try {
      // Get current location
      const location = await getLocation();

      // Update status to arrived
      await deliveryAPI.checkIn(deliveryId, location.latitude, location.longitude);

      toast({
        title: 'Check-in Realizado',
        description: 'Você chegou ao destino!',
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao fazer check-in',
        variant: 'destructive',
      });
    }
  };

  const handleComplete = () => {
    if (!delivery) return;

    // Navigate to checkout page
    window.location.href = `/checkout/${delivery.appointment_id}`;
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="tasync () => {
    if (!delivery) return;

    try {
      await deliveryAPI.completeDelivery(delivery.id, delivery.appointment_id);

      toast({
        title: 'Entrega Concluída',
        description: 'Obrigado por usar o Lumina Delivery!',
      });

      // Opcional: redirecionar após conclusão
      setTimeout(() => {
        window.location.href = `/`;
      }, 2000);
    } catch (err) {
      toast({
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Erro ao completar entrega',
        variant: 'destructive',
      });
    }
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Rastreamento de Entrega</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map - Takes 2/3 on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden h-96 md:h-screen">
              <DeliveryMap
                delivery={delivery}
                driverLocation={driverLocation}
                onLocationUpdate={setDriverLocation}
              />
            </div>
          </div>

          {/* Status Panel - Takes 1/3 on desktop */}
          <div className="lg:col-span-1">
            <DeliveryStatus
              delivery={delivery}
              isLoading={
                startDeliveryMutation.isPending || updateLocationMutation.isPending
              }
              canStart={!delivery.started_at}
              canComplete={delivery.status === 'arrived'}
              onStart={handleStartDelivery}
              onCheckIn={handleCheckIn}
              onComplete={handleComplete}
            />

            {/* Debug info (remove em produção) */}
            {import.meta.env.DEV && driverLocation && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600 font-mono">
                <p>Lat: {driverLocation.latitude.toFixed(5)}</p>
                <p>Lon: {driverLocation.longitude.toFixed(5)}</p>
                <p>Rastreando: {isTrackingLocation ? 'SIM' : 'NÃO'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
