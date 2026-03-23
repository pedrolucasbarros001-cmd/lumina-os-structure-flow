import { useEffect, useState } from 'react';
import { Navigation, ExternalLink, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddressMapProps {
  address: string;
  label?: string;
  className?: string;
  showNavigateButton?: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_GOOGLE_MAPS_KEY || import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN as string;

export default function AddressMap({ address, label, className = '', showNavigateButton = true }: AddressMapProps) {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!address || !MAPBOX_TOKEN) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    const encoded = encodeURIComponent(address);
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    )
      .then((r) => r.json())
      .then((data) => {
        const feature = data?.features?.[0];
        if (feature?.center) {
          setCoords(feature.center as [number, number]);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [address]);

  const staticMapUrl = coords
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+0ea5e9(${coords[0]},${coords[1]})/${coords[0]},${coords[1]},14,0/600x280@2x?access_token=${MAPBOX_TOKEN}`
    : null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
  const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;

  return (
    <div className={`rounded-xl overflow-hidden border border-border/40 ${className}`}>
      {/* Map image */}
      <div className="relative w-full h-44 bg-muted">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted/40 to-muted p-4">
            <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Mapa indisponível</p>
              <p className="text-xs text-muted-foreground mb-2">Abra em outro serviço:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                >
                  Google Maps
                </a>
                <a
                  href={appleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
                >
                  Apple Maps
                </a>
              </div>
            </div>
          </div>
        )}

        {staticMapUrl && !loading && !error && (
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={staticMapUrl}
              alt={`Mapa: ${address}`}
              className="w-full h-full object-cover"
            />
          </a>
        )}
      </div>

      {/* Address + actions */}
      <div className="px-3 py-2.5 bg-card flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0">
            {label && <p className="text-xs text-muted-foreground">{label}</p>}
            <p className="text-sm font-medium truncate">{address}</p>
          </div>
        </div>

        {showNavigateButton && (
          <Button
            size="sm"
            className="shrink-0 h-8 gap-1.5"
            onClick={() => window.open(navigateUrl, '_blank')}
          >
            <Navigation className="w-3.5 h-3.5" />
            Navegar
          </Button>
        )}
      </div>
    </div>
  );
}
