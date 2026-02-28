import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { fixLeafletIcon } from "../services/leafletIconFix";
import { Link, useNavigate } from "react-router-dom";

const defaultCenter = [24.7136, 46.6753];
const defaultZoom = 12;

function LocationPicker({ value, onChange }) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (!value) return null;
  return <Marker position={value} />;
}

export default function VendorDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [description, setDescription] = useState("");

  const [location, setLocation] = useState(null); // [lat, lng]
  const [loadingLoc, setLoadingLoc] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  const canSubmit = useMemo(() => {
    return name.trim() && cuisine.trim() && location && user && profile?.role === "vendor";
  }, [name, cuisine, location, user, profile]);

  const useMyLocation = () => {
    setErr("");
    setMsg("");

    if (!navigator.geolocation) {
      setErr("المتصفح لا يدعم تحديد الموقع (Geolocation).");
      return;
    }

    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude]);
        setLoadingLoc(false);
        setMsg("تم تحديد موقعك بنجاح.");
      },
      (e) => {
        setLoadingLoc(false);
        setErr("فشل تحديد الموقع. تأكد أنك سمحت للموقع بالوصول لموقعك.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!canSubmit) {
      setErr("تأكد من تعبئة البيانات وتحديد الموقع.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "foodTrucks"), {
        ratingCount: 0,
        name: name.trim(),
        cuisine: cuisine.trim(),
        description: description.trim(),
        lat: location[0],
        lng: location[1],
        vendorId: user.uid,
        averageRating: 0,
        createdAt: serverTimestamp(),
      });

      setSaving(false);
      setMsg("تمت إضافة الشاحنة بنجاح. بتظهر مباشرة على الخريطة.");

      // تنظيف الفورم
      setName("");
      setCuisine("");
      setDescription("");
      setLocation(null);

      // اختياري: يوديه للخريطة بعد ثانيتين
      setTimeout(() => navigate("/map"), 1200);
    } catch (error) {
      setSaving(false);
      setErr(error.message);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="p-4 border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-bold">Vendor Dashboard</div>
            <div className="text-sm text-gray-600">
              Add your food truck and choose its location.
            </div>
          </div>

<div className="flex gap-2">
  <Link to="/" className="px-3 py-2 rounded-xl border text-sm">
    Home
  </Link>
  <Link to="/map" className="px-3 py-2 rounded-xl border text-sm">
    Map
  </Link>
  <Link to="/vendor/my-trucks" className="px-3 py-2 rounded-xl bg-black text-white text-sm">
    Edit my trucks
  </Link>
</div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Form */}
        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <h2 className="text-lg font-bold">Add Food Truck</h2>

          {msg && <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm">{msg}</div>}
          {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{err}</div>}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm">Truck Name</label>
              <input
                className="mt-1 w-full border rounded-xl p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm">Cuisine</label>
              <input
                className="mt-1 w-full border rounded-xl p-2"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="Burgers, Coffee, Tacos..."
                required
              />
            </div>

            <div>
              <label className="text-sm">Description (optional)</label>
              <textarea
                className="mt-1 w-full border rounded-xl p-2 min-h-[90px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-xl border"
                onClick={useMyLocation}
                disabled={loadingLoc}
              >
                {loadingLoc ? "Locating..." : "Use my location"}
              </button>

              <div className="text-sm text-gray-600 flex items-center">
                أو اضغط على الخريطة لتحديد الموقع
              </div>
            </div>

            <div className="text-sm">
              Selected location:{" "}
              {location ? (
                <span className="font-semibold">
                  {location[0].toFixed(5)}, {location[1].toFixed(5)}
                </span>
              ) : (
                <span className="text-gray-500">Not selected</span>
              )}
            </div>

            <button
              className="w-full bg-black text-white rounded-xl p-2 disabled:opacity-50"
              disabled={!canSubmit || saving}
            >
              {saving ? "Saving..." : "Add Truck"}
            </button>
          </form>
        </div>

        {/* Map picker */}
        <div className="rounded-2xl overflow-hidden shadow">
          <MapContainer center={location || defaultCenter} zoom={defaultZoom} style={{ height: "520px", width: "100%" }}>
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker value={location} onChange={setLocation} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}