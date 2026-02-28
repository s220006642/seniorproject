import { addDoc, collection, onSnapshot, query, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function createOrder(truckId, data) {
  await addDoc(collection(db, "foodTrucks", truckId, "orders"), data);
}

export function listenToOrders(truckId, callback) {
  const q = query(collection(db, "foodTrucks", truckId, "orders"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

export async function updateOrderStatus(truckId, orderId, status) {
  const ref = doc(db, "foodTrucks", truckId, "orders", orderId);
  await updateDoc(ref, { status });
}