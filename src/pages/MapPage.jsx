// src/pages/MapPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";

import { listenToFoodTrucks } from "../services/foodTrucks";
import { fixLeafletIcon } from "../services/leafletIconFix";
import TruckReviews from "../components/TruckReviews";

import { listenToMenu } from "../services/menu";
import { createOrder } from "../services/orders";
import { useAuth } from "../context/AuthContext";

const defaultCenter = [24.7136, 46.6753];
const defaultZoom = 12;

function TruckPopupContent({ truck }) {
  const { user, profile } = useAuth();

  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    if (!truck?.id) return;
    const unsub = listenToMenu(truck.id, setMenu);
    return () => unsub();
  }, [truck?.id]);

  const total = useMemo(() => {
    return Object.entries(cart).reduce((sum, [id, qty]) => {
      const item = menu.find((m) => m.id === id);
      if (!item) return sum;
      const q = Number(qty);
      if (!q || q <= 0) return sum;
      return sum + Number(item.price) * q;
    }, 0);
  }, [cart, menu]);

  const canOrder =
    !!user && profile?.role === "customer" && user.emailVerified === true;

  const orderNow = async () => {
    setErr("");
    setMsg("");

    if (!canOrder) {
      setErr("لازم تسجل كـ Customer وتكون موثق الإيميل عشان تطلب.");
      return;
    }

    const items = Object.entries(cart)
      .map(([id, qty]) => {
        const item = menu.find((m) => m.id === id);
        const q = Number(qty);
        if (!item || !q || q <= 0) return null;
        return { name: item.name, price: Number(item.price), qty: q };
      })
      .filter(Boolean);

    if (!items.length) {
      setErr("اختر صنف واحد على الأقل بكمية أكبر من 0.");
      return;
    }

    if (total <= 0) {
      setErr("الإجمالي غير صحيح.");
      return;
    }

    try {
      setOrdering(true);
      await createOrder(truck.id, {
        userId: user.uid,
        items,
        total: Number(total.toFixed(2)),
        status: "pending",
        createdAt: new Date(),
      });
      setOrdering(false);
      setCart({});
      setMsg("تم إرسال طلبك (Pending).");
    } catch (e) {
      setOrdering(false);
      setErr(e.message);
    }
  };

  const navUrl = useMemo(() => {
    const lat = Number(truck.lat);
    const lng = Number(truck.lng);
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }, [truck.lat, truck.lng]);

  return (
    <div className="min-w-[280px]">
      <div className="font-bold">{truck.name || "Food Truck"}</div>
      <div className="text-sm text-gray-700">{truck.cuisine || ""}</div>

      {truck.description && (
        <div className="text-sm mt-2">{truck.description}</div>
      )}

      <div className="text-sm mt-2">
        Rating:{" "}
        <span className="font-semibold">
          {typeof truck.averageRating === "number"
            ? truck.averageRating.toFixed(1)
            : "0.0"}
        </span>{" "}
        <span className="text-xs text-gray-600">
          ({typeof truck.ratingCount === "number" ? truck.ratingCount : 0})
        </span>
      </div>

      <a
        href={navUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-block mt-2 text-sm underline"
      >
        Navigate
      </a>

      <div className="mt-3 border-t pt-2">
        <div className="font-semibold text-sm">Menu</div>

        {menu.length === 0 ? (
          <div className="text-xs text-gray-600 mt-1">No menu items.</div>
        ) : (
          <div className="mt-2 space-y-2">
            {menu.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <div className="text-xs">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-gray-600">
                    {Number(item.price).toFixed(2)} SAR
                  </div>
                </div>

                <input
                  type="number"
                  min="0"
                  className="w-16 border rounded p-1 text-xs"
                  value={cart[item.id] ?? 0}
                  onChange={(e) =>
                    setCart((p) => ({ ...p, [item.id]: Number(e.target.value) }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 text-xs">
          Total: <span className="font-semibold">{total.toFixed(2)} SAR</span>
        </div>

        {msg && (
          <div className="mt-2 text-xs p-2 rounded bg-green-50 text-green-700">
            {msg}
          </div>
        )}
        {err && (
          <div className="mt-2 text-xs p-2 rounded bg-red-50 text-red-700">
            {err}
          </div>
        )}

        <button
          className="w-full bg-black text-white rounded p-2 text-xs mt-2 disabled:opacity-50"
          disabled={!canOrder || ordering}
          onClick={orderNow}
        >
          {ordering ? "Ordering..." : "Order"}
        </button>

        {!user && (
          <div className="mt-2 text-xs text-gray-600">
            سجل دخول كـ Customer للطلب.
          </div>
        )}
        {user && profile?.role !== "customer" && (
          <div className="mt-2 text-xs text-gray-600">
            الطلب متاح للـ Customer فقط.
          </div>
        )}
        {user && profile?.role === "customer" && !user.emailVerified && (
          <div className="mt-2 text-xs text-gray-600">
            وثّق بريدك الإلكتروني للطلب.
          </div>
        )}
      </div>

      <div className="mt-3">
        <TruckReviews truck={truck} />
      </div>
    </div>
  );
}

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
                <TruckPopupContent truck={t} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}