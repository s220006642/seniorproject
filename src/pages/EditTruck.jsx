import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { updateTruck } from "../services/vendorTrucks";
import { useAuth } from "../context/AuthContext";
import { fixLeafletIcon } from "../services/leafletIconFix";

function LocationPicker({ value, onChange }) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (!value) return null;
  return <Marker position={value} />;
}

export default function EditTruck() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setErr("");
        setLoading(true);

        const ref = doc(db, "foodTrucks", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setErr("Truck not found.");
          return;
        }

        const data = snap.data();

        // تأكد أنه يخص نفس الفيندور
        if (data.vendorId !== user.uid) {
          setErr("Unauthorized. This truck does not belong to you.");
          return;
        }

        setName(data.name || "");
        setCuisine(data.cuisine || "");
        setDescription(data.description || "");
        setLocation([Number(data.lat), Number(data.lng)]);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (user && profile?.role === "vendor") run();
  }, [id, user, profile]);

  const useMyLocation = () => {
    setErr("");
    setMsg("");

    if (!navigator.geolocation) {
      setErr("المتصفح لا يدعم تحديد الموقع (Geolocation).");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation([pos.coords.latitude, pos.coords.longitude]);
        setMsg("تم تحديث موقعك بنجاح.");
      },
      () => {
        setErr("فشل تحديد الموقع. تأكد أنك سمحت للموقع بالوصول لموقعك.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const canSave = useMemo(() => {
    return name.trim() && cuisine.trim() && location && user && profile?.role === "vendor";
  }, [name, cuisine, location, user, profile]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!canSave) {
      setErr("تأكد من تعبئة البيانات وتحديد الموقع.");
      return;
    }

    try {
      setSaving(true);

      await updateTruck(id, {
        name: name.trim(),
        cuisine: cuisine.trim(),
        description: description.trim(),
        lat: location[0],
        lng: location[1],
      });

      setSaving(false);
      setMsg("تم حفظ التعديلات بنجاح.");
      setTimeout(() => navigate("/vendor/my-trucks"), 900);
    } catch (e) {
      setSaving(false);
      setErr(e.message);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  if (err) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="p-4 rounded-2xl bg-red-50 text-red-700">{err}</div>
          <Link to="/vendor/my-trucks" className="underline">
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="p-4 border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-bold">Edit Truck</div>
            <div className="text-sm text-gray-600">Update details and location.</div>
          </div>
          <div className="flex gap-2">
            <Link to="/vendor/my-trucks" className="px-3 py-2 rounded-xl border text-sm">
              Back
            </Link>
            <Link to="/map" className="px-3 py-2 rounded-xl bg-black text-white text-sm">
              Map
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow p-5 space-y-4">
          <h2 className="text-lg font-bold">Truck Info</h2>

          {msg && <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm">{msg}</div>}
          {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{err}</div>}

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-sm">Truck Name</label>
              <input className="mt-1 w-full border rounded-xl p-2" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="text-sm">Cuisine</label>
              <input className="mt-1 w-full border rounded-xl p-2" value={cuisine} onChange={(e) => setCuisine(e.target.value)} />
            </div>

            <div>
              <label className="text-sm">Description</label>
              <textarea className="mt-1 w-full border rounded-xl p-2 min-h-[90px]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" className="px-4 py-2 rounded-xl border" onClick={useMyLocation}>
                Use my location
              </button>
              <div className="text-sm text-gray-600 flex items-center">أو اضغط على الخريطة لتحديد الموقع</div>
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

            <button className="w-full bg-black text-white rounded-xl p-2 disabled:opacity-50" disabled={!canSave || saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl overflow-hidden shadow">
          <MapContainer center={location || [24.7136, 46.6753]} zoom={14} style={{ height: "520px", width: "100%" }}>
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