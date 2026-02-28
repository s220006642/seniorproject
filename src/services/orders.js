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
  // جلب vendorId من وثيقة الشاحنة
  const truckRef = doc(db, "foodTrucks", truckId);
  const truckSnap = await getDoc(truckRef);
  const vendorId = truckSnap.data()?.vendorId;

  await addDoc(collection(db, "foodTrucks", truckId, "orders"), {
    ...data,
    truckId,
    vendorId: vendorId || null,                 
    status: "pending",         // مهم (مطابق للـ rules)
    createdAt: serverTimestamp()
  });
}