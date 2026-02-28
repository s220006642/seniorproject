import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">Food Trucks Map</h1>

        {!user ? (
          <div className="space-y-3">
            <p className="text-gray-600">You are not logged in.</p>
            <div className="flex gap-3">
              <Link className="px-4 py-2 rounded-xl bg-black text-white" to="/login">
                Login
              </Link>
              <Link className="px-4 py-2 rounded-xl border" to="/register">
                Register
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl border">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="font-semibold">{profile?.name || user.email}</p>
              <p className="text-sm">
                Role: <span className="font-semibold">{profile?.role || "unknown"}</span>
              </p>
              <p className="text-sm">
                Email verified:{" "}
                <span className="font-semibold">{user.emailVerified ? "Yes" : "No"}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="px-4 py-2 rounded-xl border" to="/map">
                Map (Protected)
              </Link>

              <Link className="px-4 py-2 rounded-xl border" to="/vendor">
                Vendor Dashboard (Vendor only)
              </Link>

              <button
                className="px-4 py-2 rounded-xl bg-black text-white"
                onClick={() => signOut(auth)}
              >
                Logout
              </button>
            </div>

            {!user.emailVerified && (
              <div className="p-3 rounded-xl bg-yellow-50 text-yellow-800 text-sm">
                ملاحظة: بريدك غير مُتحقق. بعض المزايا ممكن نقفلها لاحقًا إذا احتجنا.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}