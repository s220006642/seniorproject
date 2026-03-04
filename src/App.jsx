import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

import MyTrucks from "./pages/MyTrucks";
import EditTruck from "./pages/EditTruck";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MapPage from "./pages/MapPage";
import VendorDashboard from "./pages/VendorDashboard";
import MyOrders from "./pages/MyOrders";
import ProtectedRoute from "./routes/ProtectedRoute";
import VendorRoute from "./routes/VendorRoute";

import { useAuth } from "./context/AuthContext";
import { listenToMyOrderStatusChanges } from "./services/orderStatusNotifier";

function AppInner() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [soundReady, setSoundReady] = useState(false);

  const [toast, setToast] = useState(null);

useEffect(() => {
  if (!user?.uid) return;

  const unsub = listenToMyOrderStatusChanges(user.uid, (payload) => {
    setToast(payload);
    setTimeout(() => setToast(null), 3500);

    if (soundReady) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.value = 0.06;
        o.start();
        setTimeout(() => {
          o.stop();
          ctx.close();
        }, 120);
      } catch {}
    }
  });

  return () => unsub();
}, [user?.uid, soundReady]);
useEffect(() => {
  const arm = () => setSoundReady(true);
  window.addEventListener("touchstart", arm, { once: true });
  window.addEventListener("click", arm, { once: true });
  return () => {
    window.removeEventListener("touchstart", arm);
    window.removeEventListener("click", arm);
  };
}, []);
  return (
    <>
      {toast && (
        <div className="fixed top-4 left-4 right-4 z-[9999]">
          <div className="max-w-xl mx-auto bg-black text-white rounded-2xl px-4 py-3 shadow flex items-start justify-between gap-3">
            <div className="text-sm">
              <div className="font-semibold">تحديث على طلبك</div>
              <div className="opacity-90">
                الطلب: {toast.orderId?.slice(0, 6)}… ، الحالة: {toast.statusLabel}
              </div>

              <button
                className="mt-2 text-xs underline opacity-90"
                onClick={() => {
                  setToast(null);
                  navigate("/my-orders");
                }}
              >
                فتح الطلبات
              </button>
            </div>

            <button
              className="text-xs px-3 py-1 rounded-xl bg-white/15"
              onClick={() => setToast(null)}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <MapPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor"
          element={
            <VendorRoute>
              <VendorDashboard />
            </VendorRoute>
          }
        />

        <Route
          path="/vendor/my-trucks"
          element={
            <VendorRoute>
              <MyTrucks />
            </VendorRoute>
          }
        />

        <Route path="/my-orders" element={<MyOrders />} />

        <Route
          path="/vendor/edit/:id"
          element={
            <VendorRoute>
              <EditTruck />
            </VendorRoute>
          }
        />

        <Route path="*" element={<div className="p-6">404</div>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}