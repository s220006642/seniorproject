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
  // نجيب اسم الشاحنة
  const truckSnap = await getDoc(doc(db, "foodTrucks", truckId));
  const truckName = truckSnap.exists() ? truckSnap.data()?.name || "" : "";
//لوق مؤقت لين نشوف سالفة اسم الفود ترك ليه ما يطلع
console.log("createOrder()", { truckId, truckName, userId: data?.userId, customerName });

  // نجيب اسم العميل (العميل يقدر يقرأ ملفه حسب rules)
  let customerName = "";
  if (data?.userId) {
    const userSnap = await getDoc(doc(db, "users", data.userId));
    customerName = userSnap.exists() ? userSnap.data()?.name || "" : "";
  }

  // نكتب الطلب مع الأسماء داخل الوثيقة
  await addDoc(collection(db, "foodTrucks", truckId, "orders"), {
    userId: data.userId,
    items: data.items || [],
    total: data.total || 0,

    truckId, // اختياري لكنه مفيد
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