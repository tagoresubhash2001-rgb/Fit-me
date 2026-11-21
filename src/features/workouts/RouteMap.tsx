import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Map as LMap, Polyline } from 'leaflet';
import type { Fix } from '../../domain/route';

/**
 * Live route map (Leaflet + OpenStreetMap tiles, free with attribution; no API key, no paid map service).
 * Loaded only when the route tracker opens.
 */
export default function RouteMap({ points }: { points: Fix[] }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const line = useRef<Polyline | null>(null);
  useEffect(() => {
    let live = true;
    void import('leaflet').then((L) => {
      if (!live || !el.current || map.current) return;
      map.current = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([20.6, 78.9], 4);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map.current);
      line.current = L.polyline([], { color: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#1FA45B', weight: 5 }).addTo(map.current);
    });
    return () => {
      live = false;
      map.current?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current || !line.current || !points.length) return;
    const ll = points.map((p) => [p.lat, p.lng] as [number, number]);
    line.current.setLatLngs(ll);
    if (ll.length === 1) map.current.setView(ll[0], 17);
    else map.current.panTo(ll[ll.length - 1]);
  }, [points]);
  return <div ref={el} role="img" aria-label="" className="aspect-square max-h-72 w-full overflow-hidden rounded-card bg-raised" id="route-map" />;
}
