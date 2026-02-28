import { useEffect, useMemo, useState } from "react";
import { listenToTruckReviews, upsertReview } from "../services/reviews";
import { useAuth } from "../context/AuthContext";

export default function TruckReviews({ truck }) {
  const { user, profile } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!truck?.id) return;
    const unsub = listenToTruckReviews(truck.id, setReviews);
    return () => unsub();
  }, [truck?.id]);

  const canReview = useMemo(() => {
    return !!user; // لو تبغى تمنع vendor من التقييم: && profile?.role === "customer"
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (!user) {
      setErr("لازم تسجل دخول عشان تضيف تقييم.");
      return;
    }

    try {
      setSaving(true);
      await upsertReview({
        truckId: truck.id,
        user,
        rating: Number(rating),
        comment: comment.trim(),
        userName: profile?.name,
      });
      setSaving(false);
      setMsg("تم حفظ تقييمك.");
      setComment("");
    } catch (e2) {
      setSaving(false);
      setErr(e2.message);
    }
  };

  return (
    <div className="space-y-3">
      {/* Existing reviews */}
      <div className="space-y-2">
        <div className="font-semibold text-sm">Reviews</div>
        {reviews.length === 0 ? (
          <div className="text-xs text-gray-600">لا يوجد تقييمات حتى الآن.</div>
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <div key={r.id} className="border rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold">{r.userName || "User"}</div>
                  <div className="text-xs">⭐ {Number(r.rating).toFixed(0)}</div>
                </div>
                {r.comment && <div className="text-xs text-gray-700 mt-1">{r.comment}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Update review */}
      <div className="border-t pt-2">
        <div className="font-semibold text-sm mb-2">Add your review</div>

        {msg && <div className="text-xs text-green-700 bg-green-50 p-2 rounded">{msg}</div>}
        {err && <div className="text-xs text-red-700 bg-red-50 p-2 rounded">{err}</div>}

        {!canReview ? (
          <div className="text-xs text-gray-600">سجل دخول لإضافة تقييم.</div>
        ) : (
          <form onSubmit={submit} className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-xs">Stars</label>
              <select
                className="text-xs border rounded p-1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                <option value={5}>5</option>
                <option value={4}>4</option>
                <option value={3}>3</option>
                <option value={2}>2</option>
                <option value={1}>1</option>
              </select>
            </div>

            <textarea
              className="w-full text-xs border rounded p-2 min-h-[60px]"
              placeholder="اكتب تعليقك (اختياري)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <button
              className="w-full bg-black text-white rounded p-2 text-xs disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving..." : "Submit review"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}