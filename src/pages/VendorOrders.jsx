import { useEffect, useState } from "react";
import { listenToOrders, updateOrderStatus } from "../services/orders";

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