import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DataPrincipalDashboard from "./pages/Data Principal/DataPrincipalDashboard";
import DataFiduciaryDashboard from "./pages/Data Fiduciary/DataFiduciaryDashboard";
import DataProcessorDashboard from "./pages/Data Processor/DataProcessorDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
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

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

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

        <Route path="/data-principal" element={<DataPrincipalDashboard />} />
        <Route path="/data-fiduciary" element={<DataFiduciaryDashboard />} />
        <Route path="/data-processor" element={<DataProcessorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <ToastContainer position="bottom-right" autoClose={2000} />
    </>
  );
};

export default App;
