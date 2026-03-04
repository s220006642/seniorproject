import { collectionGroup, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";

const STATUS_AR = {
  pending: "قيد الانتظار",
  accepted: "تم القبول",
  preparing: "قيد التجهيز",
  ready: "جاهز للاستلام",
  rejected: "تم الرفض",
  cancelled: "تم الإلغاء",
};

export function listenToMyOrderStatusChanges(userId, onChange) {
  if (!userId) return () => {};

  const q = query(
  collectionGroup(db, "orders"),
  where("userId", "==", userId),
  orderBy("createdAt", "desc")
);

  const lastStatusById = new Map();
  let booted = false;

  return onSnapshot(
    q,
    (snap) => {


      snap.docChanges().forEach((ch) => {
        const data = { id: ch.doc.id, ...ch.doc.data() };
        const newStatus = data.status;
        if (!newStatus) return;

        const prev = lastStatusById.get(data.id);

        // أول تحميل: خزّن بدون إشعار 
        if (!booted) {
          lastStatusById.set(data.id, newStatus);
          return;
        }

        // بعد التحميل: إشعار عند تغير الحالة
        if (prev && prev !== newStatus) {
          lastStatusById.set(data.id, newStatus);

          onChange?.({
            orderId: data.id,
            status: newStatus,
            statusLabel: STATUS_AR[newStatus] ?? newStatus,
            total: data.total ?? 0,
          });
        } else if (!prev) {
          lastStatusById.set(data.id, newStatus);
        }
      });

      booted = true;
    },
    (err) => {
      onChange?.({
        orderId: "ERROR",
        statusLabel: `Firestore error: ${err.code || err.message}`,
      });
    }
  );
}