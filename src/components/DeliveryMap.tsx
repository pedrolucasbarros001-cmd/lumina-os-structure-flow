import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { calculateDistance } from '@/hooks/useDelivery';
import type { Delivery, DeliveryLocation } from '@/hooks/useDelivery';
import { Card } from '@/components/ui/card';

interface DeliveryMapProps {
  delivery: Delivery;
  driverLocation?: DeliveryLocation;
  onLocationUpdate?: (location: DeliveryLocation) => void;
}

export default function DeliveryMap({
  delivery,
  driverLocation,
  onLocationUpdate,
}: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const customerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const distance = useRef<number | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !process.env.VITE_MAPBOX_PUBLIC_TOKEN) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = process.env.VITE_MAPBOX_PUBLIC_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [delivery.customer_lon, delivery.customer_lat],
      zoom: 14,
      pitch: 0,
      bearing: 0,
    });

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [delivery.customer_lat, delivery.customer_lon]);

  // Add/update customer marker
  useEffect(() => {
    if (!isMapLoaded || !map.current) return;

    // Remove existing marker
    if (customerMarkerRef.current) {
      customerMarkerRef.current.remove();
    }

    // Create customer marker (destination)
    const customerEl = document.createElement('div');
    customerEl.className = 'w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg';
    customerEl.innerHTML = '📍';
    customerEl.style.fontSize = '14px';
    customerEl.style.display = 'flex';
    customerEl.style.alignItems = 'center';
    customerEl.style.justifyContent = 'center';

    customerMarkerRef.current = new mapboxgl.Marker(customerEl)
      .setLngLat([delivery.customer_lon, delivery.customer_lat])
      .addTo(map.current);

    // Add popup
    const popup = new mapboxgl.Popup({ offset: [0, -40] }).setHTML(
      `<div class="font-semibold">${delivery.customer_name}</div><div class="text-sm">${delivery.customer_address}</div>`
    );
    customerMarkerRef.current.setPopup(popup);
  }, [isMapLoaded, delivery]);

  // Add/update driver marker and route
  useEffect(() => {
    if (!isMapLoaded || !map.current || !driverLocation) return;

    // Calculate distance
    distance.current = calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      delivery.customer_lat,
      delivery.customer_lon
    );

    // Remove existing driver marker
    if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
    }

    // Create driver marker (current position)
    const driverEl = document.createElement('div');
    driverEl.className = 'w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse';
    driverEl.innerHTML = '🚗';
    driverEl.style.fontSize = '14px';
    driverEl.style.display = 'flex';
    driverEl.style.alignItems = 'center';
    driverEl.style.justifyContent = 'center';

    driverMarkerRef.current = new mapboxgl.Marker(driverEl)
      .setLngLat([driverLocation.longitude, driverLocation.latitude])
      .addTo(map.current);

    // Add route line between driver and customer
    const existingSource = map.current.getSource('route') as mapboxgl.GeoJSONSource | undefined;
    const routeGeoJSON = {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [driverLocation.longitude, driverLocation.latitude],
          [delivery.customer_lon, delivery.customer_lat],
        ],
      },
      properties: {},
    };

    if (existingSource) {
      existingSource.setData(routeGeoJSON);
    } else {
      map.current.addSource('route', {
        type: 'geojson',
        data: routeGeoJSON,
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#10b981',
          'line-width': 3,
          'line-opacity': 0.6,
        },
      });
    }

    // Fit bounds to show both markers
    const bounds = new mapboxgl.LngLatBounds(
      [
        Math.min(driverLocation.longitude, delivery.customer_lon),
        Math.min(driverLocation.latitude, delivery.customer_lat),
      ],
      [
        Math.max(driverLocation.longitude, delivery.customer_lon),
        Math.max(driverLocation.latitude, delivery.customer_lat),
      ]
    );

    map.current.fitBounds(bounds, { padding: 100 });
  }, [isMapLoaded, driverLocation, delivery]);

  return (
    <Card className="w-full h-full">
      <div className="relative h-full">
        <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />

        {/* Distance info overlay */}
        {distance.current !== null && (
          <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-10">
            <div className="text-sm font-semibold text-gray-700">
              Distância: {distance.current.toFixed(2)} km
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg z-10">
          <div className="text-sm font-medium">
            Status:{' '}
            <span
              className={
                delivery.status === 'en_route'
                  ? 'text-green-600 font-semibold'
                  : delivery.status === 'arrived'
                    ? 'text-blue-600 font-semibold'
                    : 'text-yellow-600 font-semibold'
              }
            >
              {delivery.status === 'en_route'
                ? 'Em Trajeto'
                : delivery.status === 'arrived'
                  ? 'Chegou'
                  : 'Pendente'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
