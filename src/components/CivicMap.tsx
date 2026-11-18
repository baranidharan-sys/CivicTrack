import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Complaint } from '../types/civic';

export interface CivicMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  referenceId?: string;
  status?: string;
  address?: string;
}

interface CivicMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  heightClass?: string;
  interactive?: boolean;
  onSelectLocation?: (lat: number, lng: number) => void;
  markers?: CivicMapMarker[];
  onMarkerClick?: (id: string) => void;
}

function createPinIcon(color = '#163A5F') {
  return L.divIcon({
    className: 'civictrack-map-pin',
    html: `<div style="width:26px;height:26px;border-radius:9999px;background:${color};border:3px solid #ffffff;box-shadow:0 2px 6px rgba(15,23,42,0.35);display:flex;align-items:center;justify-content:center;"><div style="width:7px;height:7px;border-radius:9999px;background:#ffffff;"></div></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

function getStatusPinColor(status?: string): string {
  switch (status) {
    case 'resolved':
      return '#15803D';
    case 'in_progress':
      return '#B45309';
    case 'under_review':
      return '#4338CA';
    case 'rejected':
      return '#B91C1C';
    default:
      return '#163A5F';
  }
}

export function complaintToMarker(c: Complaint): CivicMapMarker {
  return {
    id: c.id,
    latitude: c.latitude,
    longitude: c.longitude,
    title: c.title,
    referenceId: c.referenceId,
    status: c.status,
    address: c.address,
  };
}

export function CivicMap({
  latitude,
  longitude,
  zoom = 14,
  heightClass = 'h-72',
  interactive = false,
  onSelectLocation,
  markers,
  onMarkerClick,
}: CivicMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelectLocation);
  const onMarkerClickRef = useRef(onMarkerClick);

  onSelectRef.current = onSelectLocation;
  onMarkerClickRef.current = onMarkerClick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    mapRef.current = map;
    layerGroupRef.current = group;

    if (interactive) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onSelectRef.current?.(
          Number(e.latlng.lat.toFixed(6)),
          Number(e.latlng.lng.toFixed(6)),
        );
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, [interactive]);

  useEffect(() => {
    const map = mapRef.current;
    const group = layerGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (markers && markers.length > 0) {
      const bounds: L.LatLngTuple[] = [];
      for (const m of markers) {
        if (Number.isNaN(m.latitude) || Number.isNaN(m.longitude)) continue;
        bounds.push([m.latitude, m.longitude]);
        const marker = L.marker([m.latitude, m.longitude], {
          icon: createPinIcon(getStatusPinColor(m.status)),
        });
        const label = m.referenceId ? `<strong>${m.referenceId}</strong><br/>${m.title}` : m.title;
        marker.bindPopup(`<div style="font-size:12px;line-height:1.4;max-width:220px;">${label}${m.address ? `<br/><span style="color:#64748b">${m.address}</span>` : ''}</div>`);
        marker.on('click', () => {
          onMarkerClickRef.current?.(m.id);
        });
        marker.addTo(group);
      }
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], zoom);
      }
    } else {
      const marker = L.marker([latitude, longitude], {
        icon: createPinIcon('#163A5F'),
        draggable: interactive,
      });
      if (interactive) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onSelectRef.current?.(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
        });
      }
      marker.addTo(group);
      map.setView([latitude, longitude], zoom);
    }
  }, [latitude, longitude, zoom, interactive, markers]);

  return (
    <div
      ref={containerRef}
      data-testid="civic-leaflet-map"
      className={`w-full ${heightClass} rounded-lg border border-slate-200 overflow-hidden bg-slate-100`}
      aria-label="Interactive municipal location map"
    />
  );
}
