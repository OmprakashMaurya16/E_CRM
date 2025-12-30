import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  UserRound,
  Mail,
  Phone,
  BadgeCheck,
  Shield,
  Lock,
  Pencil,
  Save,
  X,
  LogOut,
} from "lucide-react";

const ProfilePage = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  const storedUser = useMemo(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const [profile, setProfile] = useState({
    fullName: storedUser?.fullName || "",
    email: storedUser?.email || "",
    phone: storedUser?.phone || "",
    role: storedUser?.role || "",
  });

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res?.data?.user) {
          const u = res.data.user;
          const mapped = {
            fullName: u.fullName || "",
            email: u.email || "",
            phone: u.phone || "",
            role: u.role || "",
          };
          setProfile(mapped);
          localStorage.setItem("user", JSON.stringify(u));
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [API_BASE]);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("You are not logged in");
    try {
      setSaving(true);
      const payload = { fullName: profile.fullName, phone: profile.phone };
      const res = await axios.put(`${API_BASE}/auth/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updated = res?.data?.user;
      if (updated) {
        localStorage.setItem("user", JSON.stringify(updated));
        setProfile({
          fullName: updated.fullName || "",
          email: updated.email || "",
          phone: updated.phone || "",
          role: updated.role || "",
        });
      }
      toast.success(res?.data?.message || "Profile updated");
      setEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const uStr = localStorage.getItem("user");
    if (uStr) {
      const u = JSON.parse(uStr);
      setProfile({
        fullName: u.fullName || "",
        email: u.email || "",
        phone: u.phone || "",
        role: u.role || "",
      });
    }
    setEditing(false);
  };

  const handleChangePassword = async () => {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("You are not logged in");
    if (!pwForm.currentPassword || !pwForm.newPassword)
      return toast.error("Enter current and new password");
    try {
      setSaving(true);
      const res = await axios.post(
        `${API_BASE}/auth/change-password`,
        {
          currentPassword: pwForm.currentPassword,
          newPassword: pwForm.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res?.data?.message || "Password changed");
      setPwForm({ currentPassword: "", newPassword: "" });
      setChangingPw(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Password change failed");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      if (token) {
        await axios.post(
          `${API_BASE}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-6 pt-5">
            <div className="flex items-center gap-2">
              <UserRound className="h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">
                Basic Information
              </h2>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
              >
                <Pencil className="h-4 w-4" /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> Save
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, fullName: e.target.value }))
                }
                disabled={!editing}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  editing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                <Mail className="h-4 w-4 text-gray-400" /> Email Address
              </label>
              <div className="flex items-center">
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 border rounded-l-lg text-sm bg-gray-50"
                />
                <Lock className="h-10 w-10 p-2 text-gray-400 border border-l-0 rounded-r-lg" />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Email address cannot be changed directly.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                <Phone className="h-4 w-4 text-gray-400" /> Phone Number
              </label>
              <input
                type="text"
                value={profile.phone || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phone: e.target.value }))
                }
                disabled={!editing}
                className={`w-full px-3 py-2 border rounded-lg text-sm ${
                  editing ? "bg-white" : "bg-gray-50"
                }`}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                <BadgeCheck className="h-4 w-4 text-gray-400" /> Role
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={profile.role}
                  disabled
                  className="w-full px-3 py-2 border rounded-l-lg text-sm bg-gray-50"
                />
                <Lock className="h-10 w-10 p-2 text-gray-400 border border-l-0 rounded-r-lg" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 px-6 pt-5">
            <Shield className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">Security</h2>
          </div>

          <div className="px-6 pb-6 mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">
                Password
              </label>
              {!changingPw ? (
                <div className="flex items-center">
                  <input
                    type="password"
                    value="password-hidden"
                    disabled
                    className="w-full px-3 py-2 border rounded-l-lg text-sm bg-gray-50"
                  />
                  <Lock className="h-10 w-10 p-2 text-gray-400 border border-l-0 rounded-r-lg" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={pwForm.currentPassword}
                    onChange={(e) =>
                      setPwForm((f) => ({
                        ...f,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <input
                    type="password"
                    placeholder="New password"
                    value={pwForm.newPassword}
                    onChange={(e) =>
                      setPwForm((f) => ({ ...f, newPassword: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              {!changingPw ? (
                <button
                  onClick={() => setChangingPw(true)}
                  className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-medium px-3 py-2 rounded-lg"
                >
                  <Lock className="h-4 w-4" /> Change Password
                </button>
              ) : (
                <>
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" /> Save
                  </button>
                  <button
                    onClick={() => {
                      setPwForm({ currentPassword: "", newPassword: "" });
                      setChangingPw(false);
                    }}
                    className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium px-3 py-2 rounded-lg"
                  >
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 px-6 pt-5">
            <UserRound className="h-5 w-5 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900">
              Account Action
            </h2>
          </div>

          <div className="px-6 pb-6 mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Sign out</p>
              <p className="text-xs text-gray-500">
                Sign out of your account securely.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium px-3 py-2 rounded-lg"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </section>

        {loading && (
          <p className="text-center text-xs text-gray-500">
            Loading profile...
          </p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
