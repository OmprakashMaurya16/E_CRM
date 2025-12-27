import { useEffect, useState } from "react";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import axios from "axios";
import { toast } from "react-toastify";

const LoginPage = () => {
  const [role, setRole] = useState("DATA_PRINCIPAL");
  const [loginMethod, setLoginMethod] = useState("PASSWORD");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    const userStr = localStorage.getItem("user");
    const userRole = userStr ? JSON.parse(userStr)?.role : null;

    const r = userRole || storedRole;
    if (token && r) {
      navigate(
        r === "DATA_PRINCIPAL"
          ? "/data-principal"
          : r === "DATA_FIDUCIARY"
          ? "/data-fiduciary"
          : r === "DATA_PROCESSOR"
          ? "/data-processor"
          : "/admin",
        { replace: true }
      );
    }
  }, [navigate]);

  const handlePasswordLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
        role,
      });

      if (res?.data?.token) localStorage.setItem("token", res.data.token);
      if (res?.data?.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("role", res.data.user.role);
      } else {
        localStorage.setItem("role", role);
      }

      toast.success("Login successful");

      const r = res?.data?.user?.role || role;
      navigate(
        r === "DATA_PRINCIPAL"
          ? "/data-principal"
          : r === "DATA_FIDUCIARY"
          ? "/data-fiduciary"
          : r === "DATA_PROCESSOR"
          ? "/data-processor"
          : "/admin",
        { replace: true }
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    if (!email) return toast.error("Email is required");
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/auth/otp/request`, { email, role });
      toast.success("OTP sent to your email");
      setOtpStep(2);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return toast.error("OTP is required");
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/auth/otp/verify`, {
        email,
        otp,
        role,
      });

      if (res?.data?.token) localStorage.setItem("token", res.data.token);
      if (res?.data?.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("role", res.data.user.role);
      }

      if (res?.data?.token) {
        toast.success("Login successful");
        const r = res?.data?.user?.role || role;
        navigate(
          r === "DATA_PRINCIPAL"
            ? "/data-principal"
            : r === "DATA_FIDUCIARY"
            ? "/data-fiduciary"
            : r === "DATA_PROCESSOR"
            ? "/data-processor"
            : "/admin",
          { replace: true }
        );
      } else {
        toast.info(res?.data?.message || "OTP verified. Please continue.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginMethod === "PASSWORD") return handlePasswordLogin();
    return otpStep === 1 ? requestOtp() : verifyOtp();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="Logo" className="w-10 h-10 rounded" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Sign In</h1>
            <p className="text-xs text-gray-500">
              Access your dashboard securely
            </p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 mb-2">
            Select Your Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DATA_PRINCIPAL">Data Principal</option>
            <option value="DATA_FIDUCIARY">Data Fiduciary</option>
            <option value="DATA_PROCESSOR">Data Processor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="flex border-b border-gray-200 mb-4 text-sm">
          <button
            type="button"
            onClick={() => {
              setLoginMethod("PASSWORD");
              setOtpStep(1);
              setOtp("");
            }}
            className={`pb-2 mr-4 font-medium ${
              loginMethod === "PASSWORD"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            Email + Password
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMethod("OTP");
              setOtpStep(1);
              setPassword("");
            }}
            className={`pb-2 font-medium ${
              loginMethod === "OTP"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            OTP Login
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
              placeholder="Email Address or User ID"
              required
              autoComplete="email"
            />
          </div>
        </div>

        {loginMethod === "PASSWORD" ? (
          <div className="mb-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                placeholder="Password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="text-right mt-2">
              <Link
                to="/forgot-password"
                className="text-xs text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>
        ) : (
          <>
            {otpStep === 1 ? (
              <p className="text-xs text-gray-500 mb-4">
                We will send a 6-digit OTP to your email.
              </p>
            ) : (
              <div className="mb-4">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Enter OTP"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={requestOtp}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <button
          type="submit"
          disabled={
            loading ||
            !email ||
            (loginMethod === "PASSWORD" && !password) ||
            (loginMethod === "OTP" && otpStep === 2 && !otp)
          }
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 shadow-sm"
        >
          <ShieldCheck className="h-4 w-4 inline mr-2" />
          {loading
            ? "Please wait..."
            : loginMethod === "PASSWORD"
            ? "Secure Login"
            : otpStep === 1
            ? "Send OTP"
            : "Verify & Login"}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?
          <Link
            to="/registration"
            className="mx-2 text-blue-600 hover:underline"
          >
            Register here
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
