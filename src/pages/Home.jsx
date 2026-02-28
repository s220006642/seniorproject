import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";

export default function Home() {
  const { user, profile } = useAuth();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">Food Trucks Map</h1>

        {!user ? (
          <div className="space-y-3">
            <p>Welcome</p>
            <div className="flex gap-3">
              <Link to="/login" className="px-4 py-2 bg-black text-white rounded-xl">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 border rounded-xl">
                Register
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 border rounded-xl">
              <p className="font-semibold">{profile?.name}</p>
              <p className="text-sm">Role: {profile?.role}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link to="/map" className="px-4 py-2 border rounded-xl">
                Map
              </Link>

              {profile?.role === "vendor" && (
                <Link to="/vendor" className="px-4 py-2 border rounded-xl">
                  Vendor Dashboard
                </Link>
              )}

              {profile?.role === "customer" && (
                <Link to="/my-orders" className="px-4 py-2 border rounded-xl">
                  My Orders
                </Link>
              )}

              <button
                onClick={() => signOut(auth)}
                className="px-4 py-2 bg-black text-white rounded-xl"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}