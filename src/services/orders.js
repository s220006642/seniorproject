import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function createOrder(truckId, data) {
  const truckRef = doc(db, "foodTrucks", truckId);
  const truckSnap = await getDoc(truckRef);

  if (!truckSnap.exists()) {
    console.error("Truck not found");
    return;
  }

  const vendorId = truckSnap.data().vendorId;

  console.log("vendorId:", vendorId); // للتأكد
console.log("CREATE ORDER RUNNING");
  await addDoc(collection(db, "foodTrucks", truckId, "orders"), {
    ...data,
    truckId,
    vendorId: vendorId || null,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}