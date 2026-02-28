import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import TruckReviews from "../components/TruckReviews";
import { listenToFoodTrucks } from "../services/foodTrucks";
import { fixLeafletIcon } from "../services/leafletIconFix";

const defaultCenter = [24.7136, 46.6753]; // Riyadh
const defaultZoom = 12;

export default function MapPage() {
  const [trucks, setTrucks] = useState([]);
  const mapRef = useRef(null);

  useEffect(() => {
    fixLeafletIcon();
    const unsub = listenToFoodTrucks(setTrucks);
    return () => unsub();
  }, []);

  const points = useMemo(() => {
    return trucks
      .map((t) => [Number(t.lat), Number(t.lng)])
      .filter(([lat, lng]) => !Number.isNaN(lat) && !Number.isNaN(lng));
  }, [trucks]);

  // Fit bounds when we have at least 1 point
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!points.length) return;

    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points]);

  const center = points[0] || defaultCenter;

  return (
    <div className="min-h-screen relative">
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur rounded-2xl shadow px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="px-3 py-1.5 rounded-xl border text-sm">
              Back
            </Link>
            <div>
              <div className="font-semibold">Food Trucks Map</div>
              <div className="text-xs text-gray-600">
                Trucks found: <span className="font-semibold">{trucks.length}</span>
              </div>
            </div>
          </div>

          <Link
            to="/vendor"
            className="px-3 py-1.5 rounded-xl bg-black text-white text-sm"
          >
            Vendor
          </Link>
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={defaultZoom}
        style={{ height: "100vh", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {trucks.map((t) => {
          const lat = Number(t.lat);
          const lng = Number(t.lng);
          if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

          return (
            <Marker key={t.id} position={[lat, lng]}>
<Popup>
  <div className="min-w-[260px]">
    <div className="font-bold">{t.name || "Food Truck"}</div>
    <div className="text-sm text-gray-700">{t.cuisine || "Cuisine not set"}</div>

    {t.description && <div className="text-sm mt-2">{t.description}</div>}

    <div className="text-sm mt-2">
      Rating:{" "}
      <span className="font-semibold">
        {typeof t.averageRating === "number" ? t.averageRating.toFixed(1) : "0.0"}
      </span>{" "}
      <span className="text-xs text-gray-600">
        ({typeof t.ratingCount === "number" ? t.ratingCount : 0})
      </span>
    </div>

    <div className="mt-3">
      <TruckReviews truck={t} />
    </div>
  </div>
</Popup>
 
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}