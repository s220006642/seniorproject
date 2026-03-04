import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listenToMyOrders } from "../services/myOrders";

const STATUS_STEPS = ["pending", "preparing", "ready"];

const statusLabel = {
  pending: "قيد الانتظار",
  preparing: "قيد التجهيز",
  ready: "جاهز للاستلام",
  rejected: "مرفوض",
};

function getStatusIndex(status) {
  if (status === "rejected") return -1;
  const idx = STATUS_STEPS.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function StatusTimeline({ status }) {
  const idx = getStatusIndex(status);

  // مرفوض
  if (status === "rejected") {
    return (
      <div className="mt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border text-red-700 border-red-200 bg-red-50">
          <span className="font-semibold">❌ {statusLabel.rejected}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_STEPS.map((s, i) => {
          const isDone = i < idx;
          const isCurrent = i === idx;

          const dotClass = isDone
            ? "bg-green-600"
            : isCurrent
            ? "bg-blue-600"
            : "bg-gray-300";

          const chipClass = isDone
            ? "text-green-700 border-green-200 bg-green-50"
            : isCurrent
            ? "text-blue-700 border-blue-200 bg-blue-50"
            : "text-gray-600 border-gray-200 bg-gray-50";

          return (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
                <span
                  className={`px-2.5 py-1 rounded-full text-xs border ${chipClass}`}
                >
                  {statusLabel[s]}
                </span>
              </div>

              {i !== STATUS_STEPS.length - 1 && (
                <div className="w-8 h-px bg-gray-300" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function MyOrders() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenToMyOrders(user.uid, setOrders);
    return () => unsub();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen p-6">
        <Link to="/login" className="underline">
          Login
        </Link>
      </div>
    );
  }

  if (profile?.role !== "customer") {
    return (
      <div className="min-h-screen p-6">
        <div className="p-4 border rounded-xl">My Orders للـ Customer فقط</div>
        <Link to="/" className="underline">
          Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <div className="flex gap-2">
            <Link to="/" className="px-3 py-2 rounded-xl border text-sm">
              Home
            </Link>
            <Link to="/map" className="px-3 py-2 rounded-xl bg-black text-white text-sm">
              Map
            </Link>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-4 border rounded-xl">لا توجد طلبات</div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold">
                      الحالة:{" "}
                      <span className="font-bold">{statusLabel[o.status] || o.status}</span>
                    </div>
                    <StatusTimeline status={o.status} />
                  </div>

                  <div
                    className={[
                      "font-semibold whitespace-nowrap",
                      o.status === "rejected" ? "text-red-600" : "",
                      o.status === "ready" ? "text-green-600" : "",
                    ].join(" ")}
                  >
                    {Number(o.total || 0).toFixed(2)} SAR
                  </div>
                </div>

                {/* مؤقتًا - بالخطوة 2 بنعرض اسم الشاحنة بدل ID */}
                <div className="text-xs text-gray-600 mt-2">Truck ID: {o.truckId}</div>

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