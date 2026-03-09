import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressResult {
  address: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  onSelect: (result: AddressResult) => void;
  placeholder?: string;
  defaultValue?: string;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

const MAPBOX_TOKEN = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;

export default function AddressAutocomplete({ onSelect, placeholder = 'Insira a morada', defaultValue = '' }: AddressAutocompleteProps) {
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchAddress = useCallback(async (query: string) => {
    if (!MAPBOX_TOKEN || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=address,place&limit=5&language=pt`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Mapbox geocoding error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddress(newValue);
    }, 300);
  };

  const handleSelect = (feature: MapboxFeature) => {
    const result: AddressResult = {
      address: feature.place_name,
      lat: feature.center[1],
      lng: feature.center[0],
    };
    setValue(result.address);
    setSuggestions([]);
    setShowSuggestions(false);
    onSelect(result);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fallback: plain text input when no API key
  if (!MAPBOX_TOKEN) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Morada *
        </label>
        <Input
          value={value}
          onChange={e => {
            setValue(e.target.value);
            onSelect({ address: e.target.value, lat: 0, lng: 0 });
          }}
          placeholder={placeholder}
          className="rounded-xl"
        />
        <p className="text-[10px] text-muted-foreground">
          Configure VITE_GOOGLE_MAPS_KEY (Mapbox token) para sugestões automáticas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="text-xs text-muted-foreground flex items-center gap-1">
        <MapPin className="w-3 h-3" /> Morada *
      </label>
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="rounded-xl pr-8"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((feature) => (
            <button
              key={feature.id}
              type="button"
              onClick={() => handleSelect(feature)}
              className={cn(
                "w-full px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors",
                "flex items-start gap-2 border-b last:border-b-0"
              )}
            >
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span className="line-clamp-2">{feature.place_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
