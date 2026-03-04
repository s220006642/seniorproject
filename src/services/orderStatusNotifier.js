// هذا الملف اللي يبي يطلع للعميل حالة الطلب بدون ما نرجع نضغط على صفحة الطلبات كل شوي
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase.js"; 


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
    collection(db, "orders"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  // نخزن آخر حالة معروفة لكل طلب عشان ما نطلع إشعار أول ما تفتح التطبيق
  const lastStatusById = new Map();
  let booted = false;

  const unsub = onSnapshot(q, (snap) => {
    snap.docChanges().forEach((ch) => {
      const data = { id: ch.doc.id, ...ch.doc.data() };
      const newStatus = data.status;

      if (!newStatus) return;

      const prev = lastStatusById.get(data.id);

      // أول تحميل: نخزن بدون إشعار
      if (!booted) {
        lastStatusById.set(data.id, newStatus);
        return;
      }

      // تحديثات بعد التحميل
      if (prev && prev !== newStatus) {
        lastStatusById.set(data.id, newStatus);
        onChange?.({
          orderId: data.id,
          status: newStatus,
          statusLabel: STATUS_AR[newStatus] ?? newStatus,
          total: data.total ?? 0,
          truckId: data.truckId ?? data.truckID ?? data.truck ?? null,
        });
      } else if (!prev) {
        lastStatusById.set(data.id, newStatus);
      }
    });

    booted = true;
  });

  return unsub;
}