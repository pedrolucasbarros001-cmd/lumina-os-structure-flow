import { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}
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

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }
    if (document.getElementById('google-maps-script')) {
      const check = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });
}

export default function AddressAutocomplete({ onSelect, placeholder = 'Insira a morada', defaultValue = '' }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [value, setValue] = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY) return;
    loadGoogleMapsScript()
      .then(() => setLoaded(true))
      .catch(() => console.warn('Google Maps not available, using fallback input'));
  }, []);

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places || autocompleteRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      fields: ['formatted_address', 'geometry'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (place.formatted_address && place.geometry?.location) {
        const result = {
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setValue(result.address);
        onSelect(result);
      }
    });
    autocompleteRef.current = ac;
  }, [onSelect]);

  useEffect(() => {
    if (loaded) initAutocomplete();
  }, [loaded, initAutocomplete]);

  // Fallback: plain text input when no API key
  if (!GOOGLE_MAPS_KEY) {
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
          Configure VITE_GOOGLE_MAPS_KEY para sugestões automáticas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground flex items-center gap-1">
        <MapPin className="w-3 h-3" /> Morada *
      </label>
      <Input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl"
      />
    </div>
  );
}
