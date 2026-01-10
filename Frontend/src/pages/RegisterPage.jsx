import { useEffect, useState } from "react";
import { ShieldCheck, Upload, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import axios from "axios";
import { toast } from "react-toastify";

const RegisterPage = () => {
  const [role, setRole] = useState("DATA_PRINCIPAL");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);

  const [entityName, setEntityName] = useState("");
  const [entityEmail, setEntityEmail] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(
    () => () => logoPreview && URL.revokeObjectURL(logoPreview),
    [logoPreview]
  );

  const canSubmit = () => {
    if (
      !fullName ||
      !email ||
      !password ||
      password !== confirmPassword ||
      !agree
    )
      return false;
    if (role === "DATA_PRINCIPAL" && !phone) return false;
    if (role === "DATA_FIDUCIARY" && (!entityName || !entityEmail || !logoFile))
      return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit()) return;

    const form = new FormData();
    form.append("fullName", fullName);
    form.append("email", email);
    form.append("password", password);
    form.append("role", role);
    if (role === "DATA_PRINCIPAL") form.append("phone", phone);
    if (role === "DATA_FIDUCIARY") {
      form.append("entityName", entityName);
      form.append("entityEmail", entityEmail);
      if (logoFile) form.append("logo", logoFile);
    }

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_BASE}/auth/register`, form);

      if (res?.data?.success) {
        if (res?.data?.token) localStorage.setItem("token", res.data.token);

        const returnedRole = res?.data?.user?.role;
        localStorage.setItem("role", returnedRole || role);
        if (res?.data?.user) {
          try {
            localStorage.setItem("user", JSON.stringify(res.data.user));
          } catch {}
        }
        toast.success("Account created successfully");
        const r = returnedRole || role;
        navigate(
          r === "DATA_FIDUCIARY"
            ? "/data-fiduciary"
            : r === "DATA_PROCESSOR"
            ? "/data-processor"
            : r === "ADMIN"
            ? "/admin"
            : "/data-principal",
          { replace: true }
        );
      } else {
        toast.error(res?.data?.message || "Registration failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-blue-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <img src={logo} alt="Logo" className="w-10 h-10 rounded" />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Create Account
            </h1>
            <p className="text-xs text-gray-500">
              Manage and track consent seamlessly
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 mb-2">
            I am registering as a...
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="DATA_PRINCIPAL">Data Principal</option>
            <option value="DATA_FIDUCIARY">Data Fiduciary</option>
            <option value="DATA_PROCESSOR">Data Processor</option>
          </select>
        </div>

        {role === "DATA_FIDUCIARY" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Organization Name"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
              <input
                value={entityEmail}
                onChange={(e) => setEntityEmail(e.target.value)}
                placeholder="Organization Email"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>
            <label className="flex items-center gap-3 px-3 py-2 border rounded-lg cursor-pointer text-sm mb-4 hover:bg-gray-50">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-14 w-14 object-cover rounded"
                />
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <Upload className="h-4 w-4" /> <span>Upload Logo</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setLogoFile(f);
                  setLogoPreview(URL.createObjectURL(f));
                }}
              />
            </label>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full px-3 py-2 border rounded-lg text-sm"
            required
          />
          {role === "DATA_PRINCIPAL" && (
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
            />
          )}
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
          required
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create Password"
          className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
          required
        />

        <label className="flex items-center gap-2 mb-4 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={agree}
            onChange={() => setAgree((v) => !v)}
          />
          I agree to the Terms of Service and Privacy Policy
        </label>

        <button
          type="submit"
          disabled={!canSubmit() || submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 shadow-sm"
        >
          <ShieldCheck className="inline h-4 w-4 mr-2" />
          {submitting ? "Creating..." : "Create Account"}
        </button>

        <p className="text-center text-sm mt-4 text-gray-500">
          Already have an account?
          <Link to="/login" className="text-blue-600 ml-2 hover:underline">
            Login
          </Link>
        </p>

        <div className="flex justify-center gap-2 text-xs mt-4 text-gray-400">
          <CheckCircle className="h-4 w-4 text-green-500" />
          Your data is encrypted and secure
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;
