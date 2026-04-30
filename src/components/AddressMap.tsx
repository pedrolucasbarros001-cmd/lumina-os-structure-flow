import { useEffect, useState } from 'react';
import { Navigation, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddressMapProps {
  address: string;
  label?: string;
  className?: string;
  showNavigateButton?: boolean;
  driverLat?: number;
  driverLng?: number;
}

export default function AddressMap({ address, label, className = '', showNavigateButton = true, driverLat, driverLng }: AddressMapProps) {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!address) { setLoading(false); setError(true); return; }

    setLoading(true);
    setError(false);

    // Use Nominatim (OpenStreetMap) — free, no API key
    const encoded = encodeURIComponent(address);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`, {
      headers: { 'Accept-Language': 'pt' }
    })
      .then(r => r.json())
      .then(data => {
        if (data?.[0]) {
          setCoords([parseFloat(data[0].lon), parseFloat(data[0].lat)]);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [address]);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;

  // OpenStreetMap static tile via iframe
  const osmEmbedUrl = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords[0] - 0.008},${coords[1] - 0.005},${coords[0] + 0.008},${coords[1] + 0.005}&layer=mapnik&marker=${coords[1]},${coords[0]}`
    : null;

  return (
    <div className={`rounded-xl overflow-hidden border border-border/40 ${className}`}>
      {/* Map */}
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
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors inline-block">
                Abrir Google Maps
              </a>
            </div>
          </div>
        )}

        {osmEmbedUrl && !loading && !error && (
          <iframe
            src={osmEmbedUrl}
            className="w-full h-full border-0"
            loading="lazy"
            title={`Mapa: ${address}`}
          />
        )}

        {/* Driver position overlay */}
        {driverLat && driverLng && !loading && !error && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
            A caminho
          </div>
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
