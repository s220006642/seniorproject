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
  // نجمع بيانات اسم الشاحنة واسم العميل ونخزنها داخل الطلب
  const [truckSnap, userSnap] = await Promise.all([
    getDoc(doc(db, "foodTrucks", truckId)),
    data?.userId ? getDoc(doc(db, "users", data.userId)) : Promise.resolve(null),
  ]);

  const truckName = truckSnap?.exists() ? truckSnap.data()?.name || "" : "";
  const customerName =
    userSnap?.exists?.() ? userSnap.data()?.name || "" : "";

  await addDoc(collection(db, "foodTrucks", truckId, "orders"), {
    ...data,
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