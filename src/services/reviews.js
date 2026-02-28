import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

export function listenToTruckReviews(truckId, callback) {
  const reviewsRef = collection(db, "foodTrucks", truckId, "reviews");
  const q = query(reviewsRef, orderBy("updatedAt", "desc"), limit(5));

  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

/**
 * One review per user per truck (doc id = user.uid)
 * Updates averageRating + ratingCount safely.
 */
export async function upsertReview({ truckId, user, rating, comment, userName }) {
  const truckRef = doc(db, "foodTrucks", truckId);
  const reviewRef = doc(db, "foodTrucks", truckId, "reviews", user.uid);

  await runTransaction(db, async (tx) => {
    const truckSnap = await tx.get(truckRef);
    if (!truckSnap.exists()) throw new Error("Truck not found");

    const truck = truckSnap.data();
    const avg = typeof truck.averageRating === "number" ? truck.averageRating : 0;
    const count = typeof truck.ratingCount === "number" ? truck.ratingCount : 0;

    const reviewSnap = await tx.get(reviewRef);
    const oldRating = reviewSnap.exists() ? Number(reviewSnap.data().rating) : null;

    let newAvg = avg;
    let newCount = count;

    if (oldRating === null || Number.isNaN(oldRating)) {
      // first time review
      newCount = count + 1;
      newAvg = newCount === 0 ? 0 : (avg * count + rating) / newCount;
    } else {
      // update existing review
      newCount = count === 0 ? 1 : count;
      newAvg = (avg * newCount - oldRating + rating) / newCount;
    }

    // Update truck aggregates
    tx.update(truckRef, {
      averageRating: Number(newAvg.toFixed(2)),
      ratingCount: newCount,
    });

    // Upsert review doc
    tx.set(
      reviewRef,
      {
        userId: user.uid,
        userName: userName || user.email,
        rating,
        comment,
        updatedAt: serverTimestamp(),
        createdAt: reviewSnap.exists()
          ? reviewSnap.data().createdAt || serverTimestamp()
          : serverTimestamp(),
      },
      { merge: true }
    );
  });
}