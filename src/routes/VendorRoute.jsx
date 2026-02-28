import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function VendorRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (profile?.role !== "vendor") {
    return <Navigate to="/" replace />;
  }

  return children;
}