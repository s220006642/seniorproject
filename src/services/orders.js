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
  const vendorId = truckSnap.data()?.vendorId;

  await addDoc(collection(db, "foodTrucks", truckId, "orders"), {
    ...data,
    truckId,
    vendorId,                 // لازم يكون string
    status: "pending",
    createdAt: serverTimestamp(),
  });
}