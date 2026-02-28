import { addDoc, collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase/firebase";

export function listenToMenu(truckId, callback) {
  const q = query(collection(db, "foodTrucks", truckId, "menu"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  },
    (err) => {
    console.error("MY_ORDERS_SNAPSHOT_ERROR:", err);
  }
);
}

export async function addMenuItem(truckId, data) {
  await addDoc(collection(db, "foodTrucks", truckId, "menu"), data);
}