import { useEffect, useState } from "react";
import { listenToOrders, updateOrderStatus } from "../services/orders";
const STATUS_STEPS = ["pending", "accepted", "preparing", "ready"];

const statusLabel = {
  pending: "قيد الانتظار",
  accepted: "تم القبول",
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

  // حالة مرفوض
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
                <span className={`px-2.5 py-1 rounded-full text-xs border ${chipClass}`}>
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
export default function VendorOrders({ truckId }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsub = listenToOrders(truckId, setOrders);
    return () => unsub();
  }, [truckId]);

  return (
    <div>
      {orders.map((o) => (
        <div key={o.id} className="border p-2 mt-2">
          <div>Status: {o.status}</div>
          <div>Total: {o.total}</div>

          <button onClick={() => updateOrderStatus(truckId, o.id, "accepted")}>Accept</button>
          <button onClick={() => updateOrderStatus(truckId, o.id, "rejected")}>Reject</button>
          <button onClick={() => updateOrderStatus(truckId, o.id, "preparing")}>Preparing</button>
          <button onClick={() => updateOrderStatus(truckId, o.id, "ready")}>Ready</button>
        </div>
      ))}
    </div>
  );
}