import { collectionGroup, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";

export function listenToMyOrders(userId, callback) {
  const q = query(
    collectionGroup(db, "orders"),
    where("userId", "==", userId),
    
  );

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({
      id: d.id,
      truckId: d.ref.parent.parent.id,
      ...d.data(),
    }));
    callback(items);
  });
}