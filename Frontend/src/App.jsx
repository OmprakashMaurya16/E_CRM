import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DataPrincipalDashboard from "./pages/Data Principal/DataPrincipalDashboard";
import DataFiduciaryDashboard from "./pages/Data Fiduciary/DataFiduciaryDashboard";
import DataProcessorDashboard from "./pages/Data Processor/DataProcessorDashboard";
import AppLayout from "./components/AppLayout";
import MyConsentsPage from "./pages/Data Principal/MyConsentsPage";
import UpdateWithdrawPage from "./pages/Data Principal/UpdateWithdrawPage";
import NotificationsPage from "./pages/Data Principal/NotificationsPage";
import ProfilePage from "./pages/Data Principal/ProfilePage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ConsentDetailPage from "./pages/Data Principal/ConsentDetailPage";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const App = () => {
  const isAuthenticated = () => Boolean(localStorage.getItem("token"));
  const getUserRole = () => {
    try {
      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;
      return user?.role || localStorage.getItem("role") || null;
    } catch {
      return localStorage.getItem("role") || null;
    }
  };

  const roleHome = () => {
    const r = getUserRole();
    if (r === "DATA_FIDUCIARY") return "/data-fiduciary";
    if (r === "DATA_PROCESSOR") return "/data-processor";
    if (r === "ADMIN") return "/admin";
    return "/data-principal";
  };

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
  };

  const RoleRoute = ({ allowedRoles = [], children }) => {
    const role = getUserRole();
    return allowedRoles.includes(role) ? (
      children
    ) : (
      <Navigate to={roleHome()} replace />
    );
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated() ? (
              <Navigate to={roleHome()} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/login"
          element={
            isAuthenticated() ? (
              <Navigate to={roleHome()} replace />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route
          path="/registration"
          element={
            isAuthenticated() ? (
              <Navigate to={roleHome()} replace />
            ) : (
              <RegisterPage />
            )
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["DATA_PRINCIPAL"]}>
                <AppLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/data-principal" element={<DataPrincipalDashboard />} />
          <Route path="/my-consents" element={<MyConsentsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/details" element={<ConsentDetailPage />} />
          <Route path="/details/:consentId" element={<ConsentDetailPage />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["DATA_FIDUCIARY"]}>
                <AppLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/data-fiduciary" element={<DataFiduciaryDashboard />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["DATA_PROCESSOR"]}>
                <AppLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/data-processor" element={<DataProcessorDashboard />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={["ADMIN"]}>
                <AppLayout />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route
          path="*"
          element={
            isAuthenticated() ? (
              <Navigate to={roleHome()} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>

      <ToastContainer position="bottom-right" autoClose={2000} />
    </>
  );
};

export default App;
