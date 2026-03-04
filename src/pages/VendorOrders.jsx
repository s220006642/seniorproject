import { useEffect, useState } from "react";
import { listenToOrders, updateOrderStatus } from "../services/orders";

export default function VendorOrders({ truckId }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!truckId) return;
    const unsub = listenToOrders(truckId, setOrders);
    return () => unsub();
  }, [truckId]);

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="border rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">Status: {o.status}</div>
            <div className="font-semibold text-sm">
              {Number(o.total || 0).toFixed(2)} SAR
            </div>
          </div>
          <div className="mt-1 text-xs text-gray-600">
  Customer: {o.customerName ? o.customerName : o.userId}
</div>
          <div className="mt-2 space-y-1">
            {(o.items || []).map((it, idx) => (
              <div key={idx} className="text-xs text-gray-700">
                {it.name} x{it.qty}
              </div>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {o.status === "pending" && (
              <>
                <button
                  className="px-3 py-1.5 rounded-lg border text-xs"
                  onClick={() => updateOrderStatus(truckId, o.id, "preparing")}
                >
                  Accept
                </button>
                <button
                  className="px-3 py-1.5 rounded-lg border text-xs"
                  onClick={() => updateOrderStatus(truckId, o.id, "rejected")}
                >
                  Reject
                </button>
              </>
            )}

            {o.status === "preparing" && (
              <button
                className="px-3 py-1.5 rounded-lg border text-xs"
                onClick={() => updateOrderStatus(truckId, o.id, "ready")}
              >
                Ready
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}