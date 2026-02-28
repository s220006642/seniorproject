import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function createOrder(truckId, data) {
  console.log("CREATE ORDER RUNNING");

  // جلب بيانات الشاحنة
  const truckRef = doc(db, "foodTrucks", truckId);
  const truckSnap = await getDoc(truckRef);

  if (!truckSnap.exists()) {
    console.error("Truck not found");
    return;
  }

  const truckData = truckSnap.data();

  // تأكد أن vendorId موجود
  if (!truckData?.vendorId) {
    console.error("vendorId NOT FOUND in truck");
    return;
  }

  const vendorId = truckData.vendorId;

  console.log("vendorId:", vendorId);

  // إنشاء الطلب
  await addDoc(collection(db, "foodTrucks", truckId, "orders"), {
    ...data,
    truckId,
    userId: data.userId, // تأكد أنه موجود
    vendorId: vendorId,  // 🔥 مهم جدًا
    status: "pending",
    createdAt: serverTimestamp(),
  });
}