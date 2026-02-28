import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getVendorTrucks } from "../services/vendorTrucks";

export default function MyTrucks() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        setErr("");
        setLoading(true);
        const res = await getVendorTrucks(user.uid);
        setItems(res);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (user && profile?.role === "vendor") run();
  }, [user, profile]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Trucks</h1>
            <p className="text-sm text-gray-600">Edit your food trucks.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/vendor" className="px-3 py-2 rounded-xl border text-sm">
              Back
            </Link>
            <Link to="/map" className="px-3 py-2 rounded-xl bg-black text-white text-sm">
              Map
            </Link>
          </div>
        </div>

        {loading && <div>Loading...</div>}
        {err && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{err}</div>}

        {!loading && !err && items.length === 0 && (
          <div className="p-4 rounded-2xl border">
            ما عندك شاحنات حاليًا. ارجع لصفحة Vendor وأضف شاحنة.
          </div>
        )}

        <div className="grid gap-3">
          {items.map((t) => (
            <div key={t.id} className="p-4 rounded-2xl border flex items-start justify-between gap-3">
              <div>
                <div className="font-bold">{t.name}</div>
                <div className="text-sm text-gray-600">{t.cuisine}</div>
                {t.description && <div className="text-sm mt-2">{t.description}</div>}
                <div className="text-xs text-gray-500 mt-2">
                  Location: {Number(t.lat).toFixed(5)}, {Number(t.lng).toFixed(5)}
                </div>
              </div>

              <Link
                to={`/vendor/edit/${t.id}`}
                className="px-3 py-2 rounded-xl bg-black text-white text-sm"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}