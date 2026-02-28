import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listenToMyOrders } from "../services/myOrders";

export default function MyOrders() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;

    console.log("USER UID:", user.uid); // 🔥 هذا المهم

    const unsub = listenToMyOrders(user.uid, (data) => {
      console.log("ORDERS:", data); // 🔥 نشوف هل ترجع بيانات
      setOrders(data);
    });

    return () => unsub();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen p-6">
        <Link to="/login" className="underline">Login</Link>
      </div>
    );
  }

  if (profile?.role !== "customer") {
    return (
      <div className="min-h-screen p-6">
        <div className="p-4 border rounded-xl">My Orders للـ Customer فقط</div>
        <Link to="/" className="underline">Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <div className="flex gap-2">
            <Link to="/" className="px-3 py-2 rounded-xl border text-sm">Home</Link>
            <Link to="/map" className="px-3 py-2 rounded-xl bg-black text-white text-sm">Map</Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-4 border rounded-xl">لا توجد طلبات</div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="border rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Status: {o.status}</div>
                  <div className="font-semibold">{Number(o.total || 0).toFixed(2)} SAR</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">Truck ID: {o.truckId}</div>

                <div className="mt-2 space-y-1">
                  {(o.items || []).map((it, idx) => (
                    <div key={idx} className="text-sm">
                      {it.name} x{it.qty}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}