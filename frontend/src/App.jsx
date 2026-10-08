import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";

import WorkerDashboard from "./pages/WorkerDashboard";

import AdminDashboard from "./pages/AdminDashboard";

import CEODashboard from "./pages/CEODashboard";

import HeadDashboard from "./pages/HeadDashboard";

import RoleRoute from "./routes/RoleRoute";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./context/useAuth";

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const role = user.role?.toLowerCase();
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (role === "ceo") return <Navigate to="/ceo" replace />;
  return <Navigate to={role?.includes("head") ? "/head" : "/worker"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/worker"
        element={
          <RoleRoute
            allowedRoles={["worker"]}
          >
            <WorkerDashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <RoleRoute
            allowedRoles={["admin"]}
          >
            <AdminDashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/ceo"
        element={
          <RoleRoute
            allowedRoles={["ceo"]}
          >
            <CEODashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <RoleRoute allowedRoles={["ceo", "design_head", "production_head", "quality_head", "dispatch_head"]}>
            <Dashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/head"
        element={
          <RoleRoute
            allowedRoles={[
              "design_head",
              "production_head",
              "quality_head",
              "dispatch_head",
            ]}
          >
            <HeadDashboard />
          </RoleRoute>
        }
      />

      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default App;
