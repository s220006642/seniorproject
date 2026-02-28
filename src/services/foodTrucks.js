import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase/firebase";

// Realtime listener for food trucks
export function listenToFoodTrucks(callback) {
  const q = query(collection(db, "foodTrucks"));

  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(items);
  });
}