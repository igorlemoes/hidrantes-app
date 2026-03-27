"use client";

import { useEffect, useRef, useState } from "react";
import { Hydrant } from "@/types/hydrant";
import "leaflet/dist/leaflet.css";

interface MapProps {
  hydrants: Hydrant[];
  currentLocation: { latitude: number; longitude: number } | null;
  selectedHydrant: Hydrant | null;
  onSelectHydrant: (id: string) => void;
  onLocationSelect: (lat: number, lng: number) => void;
  isAddingHydrant: boolean;
  selectedLocation: { latitude: number; longitude: number } | null;
}

export function Map({
  hydrants,
  currentLocation,
  selectedHydrant,
  onSelectHydrant,
  onLocationSelect,
  isAddingHydrant,
  selectedLocation,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<globalThis.Map<string, any>>(new globalThis.Map());
  const userMarkerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const initializedRef = useRef(false);
  const [clickMarker, setClickMarker] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    import("leaflet").then((L) => {
      if (!mapContainerRef.current || mapRef.current) return;

      LRef.current = L;

      const defaultCenter: [number, number] = [-23.5505, -46.6333];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 16,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;
      setMapReady(true);

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initializedRef.current = false;
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !currentLocation || !LRef.current || !mapReady) return;

    const L = LRef.current;

      if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([
        currentLocation.latitude,
        currentLocation.longitude,
      ]);
    } else {
      const userIcon = L.divIcon({
        className: "user-marker-icon",
        html: `<svg viewBox="0 0 1024 1024" style="width:40px;height:40px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M835.7 313.3c-1.4-5.1-6.9-9.3-12.2-9.3h-56.8c-5.3 0-10.8 4.2-12.2 9.3l-12.7 46c-1.4 5.1 1.8 9.3 7.1 9.3h92.5c5.3 0 8.5-4.2 7.1-9.3l-12.8-46z" fill="#FF8189"/>
          <path d="M95.2 695.1V390.2c0-26.5 21.7-48.1 48.1-48.1h737.1c26.5 0 48.1 21.7 48.1 48.1V695H95.2z" fill="#FF5959"/>
          <path d="M95.2 530.4h833.4v37.8H95.2z" fill="#D1D3D3"/>
          <path d="M958.9 709.6c0 9.9-8.1 17.9-17.9 17.9h-40.3c-9.9 0-17.9-8.1-17.9-17.9v-29.1c0-9.9 8.1-17.9 17.9-17.9H941c9.9 0 17.9 8.1 17.9 17.9v29.1z" fill="#A4A9AD"/>
          <path d="M133.3 709.6c0 9.9-8.1 17.9-17.9 17.9H82.7c-9.9 0-17.9-8.1-17.9-17.9v-29.1c0-9.9 8.1-17.9 17.9-17.9h32.6c9.9 0 17.9 8.1 17.9 17.9l0.1 29.1z" fill="#A4A9AD"/>
          <path d="M410.7 695.1c0-64.7-52.5-117.2-117.2-117.2s-117.2 52.5-117.2 117.2h234.4z" fill="transparent"/>
          <path d="M293.4 695.1m-97 0a97 97 0 1 0 194 0 97 97 0 1 0-194 0Z" fill="#333E48"/>
          <path d="M293.4 695.1m-49.2 0a49.2 49.2 0 1 0 98.4 0 49.2 49.2 0 1 0-98.4 0Z" fill="#A4A9AD"/>
          <path d="M847.5 695.1c0-64.7-52.5-117.2-117.2-117.2s-117.2 52.5-117.2 117.2h234.4z" fill="transparent"/>
          <path d="M730.3 695.1m-97 0a97 97 0 1 0 194 0 97 97 0 1 0-194 0Z" fill="#333E48"/>
          <path d="M730.3 695.1m-49.2 0a49.2 49.2 0 1 0 98.4 0 49.2 49.2 0 1 0-98.4 0Z" fill="#A4A9AD"/>
          <path d="M730.3 251.2c0-10.6-8.7-19.3-19.3-19.3H159.5c-10.6 0-19.3 8.7-19.3 19.3v23.1c0 10.6 8.7 19.3 19.3 19.3h551.6c10.6 0 19.3-8.7 19.3-19.3l-0.1-23.1z" fill="#D1D3D3"/>
          <path d="M185.4 416.1h317V445h-317z" fill="#FFB819"/>
          <path d="M192.7 293.5h48.6V342h-48.6z" fill="#A4A9AD"/>
          <path d="M310.2 293.5h48.6V342h-48.6z" fill="#A4A9AD"/>
          <path d="M427.6 293.5h48.6V342h-48.6z" fill="#A4A9AD"/>
          <path d="M835.7 313.3h56.8c5.3 0 10.8 4.2 12.2 9.3l12.7-46c1.4 5.1-1.8 9.3-7.1 9.3h-92.5c-5.3 0-8.5-4.2-7.1-9.3l12.8 46z" fill="#A4A9AD"/>
        </svg>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      userMarkerRef.current = L.marker(
        [currentLocation.latitude, currentLocation.longitude],
        { icon: userIcon }
      )
        .addTo(mapRef.current)
        .bindPopup("Sua localização");
    }

    mapRef.current.setView(
      [currentLocation.latitude, currentLocation.longitude],
      16,
      { animate: true }
    );

    mapRef.current.invalidateSize();
  }, [currentLocation, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !LRef.current || !mapReady) return;

    const L = LRef.current;
    const map = mapRef.current;

    if (isAddingHydrant) {
      map.getContainer().style.cursor = "crosshair";

      const handleClick = (e: any) => {
        if (clickMarker) {
          map.removeLayer(clickMarker);
        }

        const pinIcon = L.divIcon({
          className: "pin-marker-icon",
          html: `<svg viewBox="0 0 508 508" style="width:40px;height:40px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <circle cx="254" cy="254" r="254" fill="#54C0EB"/>
            <path d="M57.6,414.8C104,471.6,174.8,508,254,508s150-36.4,196.4-93.2H57.6z" fill="#84DBFF"/>
            <rect x="172.8" y="330.4" fill="#FF5959" width="162.4" height="67.6"/>
            <path d="M268.8,77.2c1.2-2.4,2-5.2,2-8c0-9.2-7.6-16.8-16.8-16.8s-16.8,7.6-16.8,16.8c0,2.8,0.8,5.6,2,8 H268.8z" fill="#FF5959"/>
            <rect x="172.8" y="180.8" fill="#FF5959" width="162.4" height="133.2"/>
            <circle cx="254" cy="249.6" r="42.4" fill="#4d312e"/>
            <circle cx="254" cy="249.6" r="26.4" fill="#FF5959"/>
            <circle cx="254" cy="249.6" r="11.2" fill="#4d312e"/>
            <path d="M336.4,158.8H171.6c-6.8,0-12.4,5.6-12.4,12.4l0,0c0,6.8,5.6,12.4,12.4,12.4h164.8 c6.8,0,12.4-5.6,12.4-12.4l0,0C348.8,164.4,343.2,158.8,336.4,158.8z" fill="#4d312e"/>
            <path d="M254,80c-44,0-79.2,35.2-80,78.8h160C333.2,115.2,298,80,254,80z" fill="#FF5959"/>
            <path d="M336.4,314H171.6c-6.8,0-12.4,5.6-12.4,12.4l0,0c0,6.8,5.6,12.4,12.4,12.4h164.8 c6.8,0,12.4-5.6,12.4-12.4l0,0C348.8,319.2,343.2,314,336.4,314z" fill="#4d312e"/>
            <path d="M336.4,390.4H171.6c-6.8,0-12.4,5.6-12.4,12.4l0,0c0,6.8,5.6,12.4,12.4,12.4h164.8 c6.8,0,12.4-5.6,12.4-12.4l0,0C348.8,395.6,343.2,390.4,336.4,390.4z" fill="#4d312e"/>
          </svg>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const newMarker = L.marker(e.latlng, { icon: pinIcon })
          .addTo(map)
          .bindPopup("Hidrante aqui")
          .openPopup();

        setClickMarker(newMarker);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      };

      map.on("click", handleClick);

      if (selectedLocation && !clickMarker) {
        const pinIcon = L.divIcon({
          className: "pin-marker-icon",
          html: `<svg viewBox="0 0 508 508" style="width:40px;height:40px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <circle cx="254" cy="254" r="254" fill="#54C0EB"/>
            <path d="M57.6,414.8C104,471.6,174.8,508,254,508s150-36.4,196.4-93.2H57.6z" fill="#84DBFF"/>
            <rect x="172.8" y="330.4" fill="#FF5959" width="162.4" height="67.6"/>
            <path d="M268.8,77.2c1.2-2.4,2-5.2,2-8c0-9.2-7.6-16.8-16.8-16.8s-16.8,7.6-16.8,16.8c0,2.8,0.8,5.6,2,8 H268.8z" fill="#FF5959"/>
            <rect x="172.8" y="180.8" fill="#FF5959" width="162.4" height="133.2"/>
            <circle cx="254" cy="249.6" r="42.4" fill="#4d312e"/>
            <circle cx="254" cy="249.6" r="26.4" fill="#FF5959"/>
            <circle cx="254" cy="249.6" r="11.2" fill="#4d312e"/>
            <path d="M336.4,158.8H171.6c-6.8,0-12.4,5.6-12.4,12.4l0,0c0,6.8,5.6,12.4,12.4,12.4h164.8 c6.8,0,12.4-5.6,12.4-12.4l0,0C348.8,164.4,343.2,158.8,336.4,158.8z" fill="#4d312e"/>
            <path d="M254,80c-44,0-79.2,35.2-80,78.8h160C333.2,115.2,298,80,254,80z" fill="#FF5959"/>
            <path d="M336.4,314H171.6c-6.8,0-12.4,5.6-12.4,12.4l0,0c0,6.8,5.6,12.4,12.4,12.4h164.8 c6.8,0,12.4-5.6,12.4-12.4l0,0C348.8,319.2,343.2,314,336.4,314z" fill="#4d312e"/>
            <path d="M336.4,390.4H171.6c-6.8,0-12.4,5.6-12.4,12.4l0,0c0,6.8,5.6,12.4,12.4,12.4h164.8 c6.8,0,12.4-5.6,12.4-12.4l0,0C348.8,395.6,343.2,390.4,336.4,390.4z" fill="#4d312e"/>
          </svg>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const initialMarker = L.marker(
          [selectedLocation.latitude, selectedLocation.longitude],
          { icon: pinIcon }
        )
          .addTo(map)
          .bindPopup("Sua localização")
          .openPopup();

        setClickMarker(initialMarker);
      }

      return () => {
        map.off("click", handleClick);
        map.getContainer().style.cursor = "";
      };
    } else {
      if (clickMarker) {
        map.removeLayer(clickMarker);
        setClickMarker(null);
      }
      map.getContainer().style.cursor = "";
    }
  }, [isAddingHydrant, onLocationSelect, clickMarker, mapReady, selectedLocation]);

  useEffect(() => {
    if (!mapRef.current || !LRef.current || !mapReady) return;

    const L = LRef.current;

    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current.clear();

    hydrants.forEach((hydrant) => {
      const icon = L.divIcon({
        className: "hydrant-marker-icon",
        html: `<svg viewBox="0 0 508 508" style="width:36px;height:36px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <circle cx="254" cy="254" r="254" fill="#54C0EB"/>
          <path d="M57.6,414.8C104,471.6,174.8,508,254,508s150-36.4,196.4-93.2H57.6z" fill="#84DBFF"/>
          <rect x="172.8" y="330.4" fill="#FF5959" width="162.4" height="67.6"/>
          <path d="M268.8,77.2c1.2-2.4,2-5.2,2-8c0-9.2-7.6-16.8-16.8-16.8s-16.8,7.6-16.8,16.8c0,2.8,0.8,5.6,2,8 H268.8z" fill="#FF5959"/>
          <rect x="172.8" y="180.8" fill="#FF5959" width="162.4" height="133.2"/>
          <circle cx="254" cy="249.6" r="42.4" fill="#4d312e"/>
          <circle cx="254" cy="249.6" r="26.4" fill="#FF5959"/>
          <circle cx="254" cy="249.6" r="11.2" fill="#4d312e"/>
          <path d="M336.4,158.8H171.6c-6.8,0-12.4,5.6-12.4,12.4l0,0c0,6.8,5.6,12.4,12.4,12.4h164.8 c6.8,0,12.4-5.6,12.4-12.4l0,0C348.8,164.4,343.2,158.8,336.4,158.8z" fill="#4d312e"/>
          <path d="M254,80c-44,0-79.2,35.2-80,78.8h160C333.2,115.2,298,80,254,80z" fill="#FF5959"/>
          <path d="M336.4,314H171.6c-6.8,0-12.4,5.6-12.4,12.4l0,0c0,6.8,5.6,12.4,12.4,12.4h164.8 c6.8,0,12.4-5.6,12.4-12.4l0,0C348.8,319.2,343.2,314,336.4,314z" fill="#4d312e"/>
          <path d="M336.4,390.4H171.6c-6.8,0-12.4,5.6-12.4,12.4l0,0c0,6.8,5.6,12.4,12.4,12.4h164.8 c6.8,0,12.4-5.6,12.4-12.4l0,0C348.8,395.6,343.2,390.4,336.4,390.4z" fill="#4d312e"/>
        </svg>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([hydrant.latitude, hydrant.longitude], { icon })
        .addTo(mapRef.current)
        .on("click", () => onSelectHydrant(hydrant.id));

      markersRef.current.set(hydrant.id, marker);
    });
  }, [hydrants, onSelectHydrant, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    if (selectedHydrant) {
      mapRef.current.flyTo(
        [selectedHydrant.latitude, selectedHydrant.longitude],
        17,
        { animate: true }
      );
    }
  }, [selectedHydrant, mapReady]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
