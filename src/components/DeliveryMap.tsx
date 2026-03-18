// @ts-nocheck
import { useState } from 'react';
import { Navigation, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateDistance, type Delivery, type DeliveryLocation } from '@/hooks/useDelivery';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN as string;

interface DeliveryMapProps {
  delivery: Delivery;
  driverLocation?: DeliveryLocation;
}

export default function DeliveryMap({ delivery, driverLocation }: DeliveryMapProps) {
  const [imgError, setImgError] = useState(false);

  const lat = delivery.customer_lat;
  const lon = delivery.customer_lon;
  const hasCoords = lat && lon;

  const getStaticMapUrl = () => {
    if (!hasCoords || !MAPBOX_TOKEN) return null;

    const markers: string[] = [`pin-s+0ea5e9(${lon},${lat})`];
    if (driverLocation) markers.push(`pin-s+22c55e(${driverLocation.longitude},${driverLocation.latitude})`);

    const markersStr = markers.join(',');

    if (driverLocation) {
      const minLon = Math.min(lon, driverLocation.longitude);
      const minLat = Math.min(lat, driverLocation.latitude);
      const maxLon = Math.max(lon, driverLocation.longitude);
      const maxLat = Math.max(lat, driverLocation.latitude);
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markersStr}/[${minLon},${minLat},${maxLon},${maxLat}]/600x300@2x?padding=80&access_token=${MAPBOX_TOKEN}`;
    }

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markersStr}/${lon},${lat},14,0/600x300@2x?access_token=${MAPBOX_TOKEN}`;
  };

  const staticMapUrl = getStaticMapUrl();
  const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.customer_address)}&travelmode=driving`;
  const openInMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

  const distance = driverLocation
    ? calculateDistance(driverLocation.latitude, driverLocation.longitude, lat, lon)
    : null;

  return (
    <div className="w-full h-full flex flex-col rounded-lg overflow-hidden border border-border/40">
      {/* Map image */}
      <div className="relative flex-1 min-h-64 bg-muted">
        {!hasCoords && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">Coordenadas indisponíveis</p>
          </div>
        )}

        {hasCoords && (!staticMapUrl || imgError) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {staticMapUrl && !imgError && (
          <a href={openInMapsUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={staticMapUrl}
              alt={`Mapa: ${delivery.customer_address}`}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          </a>
        )}

        {distance !== null && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-border/40 rounded-lg px-3 py-1.5 shadow text-xs font-semibold text-gray-700">
            {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
          </div>
        )}

        {driverLocation && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm border border-border/40 rounded-lg px-3 py-2 shadow flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-green-500" />Sua posição</div>
            <div className="flex items-center gap-2 text-xs"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" />Destino</div>
          </div>
        )}
      </div>

      {/* Address bar */}
      <div className="px-4 py-3 bg-card border-t border-border/40 flex items-center justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Destino — {delivery.customer_name}</p>
            <p className="text-sm font-medium leading-tight line-clamp-2">{delivery.customer_address}</p>
          </div>
        </div>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={() => window.open(navigateUrl, '_blank')}>
          <Navigation className="w-3.5 h-3.5" />
          Navegar
        </Button>
      </div>
    </div>
  );
}
