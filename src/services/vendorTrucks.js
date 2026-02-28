import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function getVendorTrucks(vendorId) {
  const q = query(collection(db, "foodTrucks"), where("vendorId", "==", vendorId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateTruck(truckId, data) {
  const ref = doc(db, "foodTrucks", truckId);
  await updateDoc(ref, data);
}