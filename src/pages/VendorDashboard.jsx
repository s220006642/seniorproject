// src/pages/VendorDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { fixLeafletIcon } from "../services/leafletIconFix";
import { Link, useNavigate } from "react-router-dom";

import { getVendorTrucks } from "../services/vendorTrucks";
import { listenToMenu, addMenuItem } from "../services/menu";
import { listenToOrders, updateOrderStatus } from "../services/orders";

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

  // Add Truck form
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [saving, setSaving] = useState(false);

  // Vendor trucks
  const [myTrucks, setMyTrucks] = useState([]);
  const [selectedTruckId, setSelectedTruckId] = useState("");

  // Menu
  const [menu, setMenu] = useState([]);
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");

  // Orders
  const [orders, setOrders] = useState([]);

  // Messages
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  // Load vendor trucks (for menu/orders management)
  useEffect(() => {
    const run = async () => {
      if (!user || profile?.role !== "vendor") return;
      try {
        const res = await getVendorTrucks(user.uid);
        setMyTrucks(res);
        if (!selectedTruckId && res.length) setSelectedTruckId(res[0].id);
      } catch (e) {
        setErr(e.message);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile?.role]);

  // Listen to menu for selected truck
  useEffect(() => {
    if (!selectedTruckId) {
      setMenu([]);
      return;
    }
    const unsub = listenToMenu(selectedTruckId, setMenu);
    return () => unsub();
  }, [selectedTruckId]);

  // Listen to orders for selected truck
  useEffect(() => {
    if (!selectedTruckId) {
      setOrders([]);
      return;
    }
    const unsub = listenToOrders(selectedTruckId, setOrders);
    return () => unsub();
  }, [selectedTruckId]);

  const canSubmitTruck = useMemo(() => {
    return (
      name.trim() &&
      cuisine.trim() &&
      location &&
      user &&
      profile?.role === "vendor"
    );
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
      () => {
        setLoadingLoc(false);
        setErr("فشل تحديد الموقع. تأكد أنك سمحت للموقع بالوصول لموقعك.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmitTruck = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!canSubmitTruck) {
      setErr("تأكد من تعبئة البيانات وتحديد الموقع.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "foodTrucks"), {
        name: name.trim(),
        cuisine: cuisine.trim(),
        description: description.trim(),
        lat: location[0],
        lng: location[1],
        vendorId: user.uid,
        averageRating: 0,
        ratingCount: 0,
        createdAt: serverTimestamp(),
      });

      setSaving(false);
      setMsg("تمت إضافة الشاحنة بنجاح.");

      setName("");
      setCuisine("");
      setDescription("");
      setLocation(null);

      // refresh trucks list
      const res = await getVendorTrucks(user.uid);
      setMyTrucks(res);
      if (res.length && !selectedTruckId) setSelectedTruckId(res[0].id);

      setTimeout(() => navigate("/map"), 900);
    } catch (error) {
      setSaving(false);
      setErr(error.message);
    }
  };

  const onAddMenuItem = async () => {
    setErr("");
    setMsg("");

    if (!selectedTruckId) {
      setErr("اختر شاحنة لإضافة المنيو.");
      return;
    }
    if (!menuName.trim()) {
      setErr("اكتب اسم الصنف.");
      return;
    }
    const priceNum = Number(menuPrice);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setErr("السعر لازم يكون رقم صحيح أكبر من 0.");
      return;
    }

    try {
      await addMenuItem(selectedTruckId, {
        name: menuName.trim(),
        price: priceNum,
        createdAt: serverTimestamp(),
      });
      setMenuName("");
      setMenuPrice("");
      setMsg("تم إضافة الصنف للمنيو.");
    } catch (e) {
      setErr(e.message);
    }
  };

  const setStatus = async (orderId, status) => {
    try {
      await updateOrderStatus(selectedTruckId, orderId, status);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="p-4 border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-bold">Vendor Dashboard</div>
            <div className="text-sm text-gray-600">
              Add trucks, manage menu, view orders.
            </div>
          </div>

          <div className="flex gap-2">
            <Link to="/" className="px-3 py-2 rounded-xl border text-sm">
              Home
            </Link>
            <Link to="/map" className="px-3 py-2 rounded-xl border text-sm">
              Map
            </Link>
            <Link
              to="/vendor/my-trucks"
              className="px-3 py-2 rounded-xl bg-black text-white text-sm"
            >
              Edit my trucks
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Messages */}
          {(msg || err) && (
            <div className="space-y-2">
              {msg && (
                <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm">
                  {msg}
                </div>
              )}
              {err && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                  {err}
                </div>
              )}
            </div>
          )}

          {/* Add Truck */}
          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <h2 className="text-lg font-bold">Add Food Truck</h2>

            <form onSubmit={onSubmitTruck} className="space-y-3">
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
                disabled={!canSubmitTruck || saving}
              >
                {saving ? "Saving..." : "Add Truck"}
              </button>
            </form>
          </div>

          {/* Manage Menu + Orders */}
          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Menu + Orders</h2>

              <select
                className="border rounded-xl p-2 text-sm"
                value={selectedTruckId}
                onChange={(e) => setSelectedTruckId(e.target.value)}
              >
                <option value="">Select truck</option>
                {myTrucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Add menu item */}
            <div className="border rounded-2xl p-3 space-y-2">
              <div className="font-semibold text-sm">Add Menu Item</div>

              <input
                className="w-full border rounded-xl p-2 text-sm"
                placeholder="Item name"
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
              />

              <input
                className="w-full border rounded-xl p-2 text-sm"
                placeholder="Price (SAR)"
                type="number"
                min="1"
                value={menuPrice}
                onChange={(e) => setMenuPrice(e.target.value)}
              />

              <button
                type="button"
                className="w-full bg-black text-white rounded-xl p-2 text-sm disabled:opacity-50"
                disabled={!selectedTruckId}
                onClick={onAddMenuItem}
              >
                Add Item
              </button>
            </div>

            {/* Menu list */}
            <div className="border rounded-2xl p-3">
              <div className="font-semibold text-sm mb-2">Current Menu</div>
              {menu.length === 0 ? (
                <div className="text-sm text-gray-600">No items.</div>
              ) : (
                <div className="space-y-2">
                  {menu.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <div className="font-semibold">{m.name}</div>
                        <div className="text-xs text-gray-600">
                          {Number(m.price).toFixed(2)} SAR
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Orders */}
            <div className="border rounded-2xl p-3">
              <div className="font-semibold text-sm mb-2">Orders</div>

              {orders.length === 0 ? (
                <div className="text-sm text-gray-600">No orders.</div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="border rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">
                          Status: {o.status}
                        </div>
                        <div className="text-sm font-semibold">
                          {Number(o.total || 0).toFixed(2)} SAR
                        </div>
                      </div>

                      <div className="mt-2 space-y-1">
                        {(o.items || []).map((it, idx) => (
                          <div key={idx} className="text-xs text-gray-700">
                            {it.name} x{it.qty} ={" "}
                            {(Number(it.price) * Number(it.qty)).toFixed(2)} SAR
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="px-3 py-1.5 rounded-lg border text-xs"
                          onClick={() => setStatus(o.id, "accepted")}
                        >
                          Accept
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg border text-xs"
                          onClick={() => setStatus(o.id, "rejected")}
                        >
                          Reject
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg border text-xs"
                          onClick={() => setStatus(o.id, "preparing")}
                        >
                          Preparing
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg border text-xs"
                          onClick={() => setStatus(o.id, "ready")}
                        >
                          Ready
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Map picker for Add Truck */}
        <div className="rounded-2xl overflow-hidden shadow">
          <MapContainer
            center={location || defaultCenter}
            zoom={defaultZoom}
            style={{ height: "520px", width: "100%" }}
          >
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