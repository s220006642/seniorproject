import { BrowserRouter, Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>

    
  );
}