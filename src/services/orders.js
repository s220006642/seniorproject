import {
  addDoc,
  collection,
  onSnapshot,
  query,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function createOrder(truckId, data) {
  // 1) Truck name
  const truckSnap = await getDoc(doc(db, "foodTrucks", truckId));
  const truckName = truckSnap.exists() ? (truckSnap.data()?.name || "") : "";

  // 2) Customer name
  let customerName = "";
  if (data?.userId) {
    const userSnap = await getDoc(doc(db, "users", data.userId));
    customerName = userSnap.exists() ? (userSnap.data()?.name || "") : "";
  }

  // 3) Write order
  await addDoc(collection(db, "foodTrucks", truckId, "orders"), {
    userId: data.userId,
    items: data.items || [],
    total: data.total || 0,

    truckId,
    truckName,
    customerName,

    status: "pending",
    createdAt: serverTimestamp(),
  });
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