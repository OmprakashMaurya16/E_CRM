import React, { useEffect, useState } from "react";
import axios from "axios";

const NotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const markNotificationsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/principal/notifications/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      // Silently ignore; badge will be updated on next successful attempt
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_BASE}/principal/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(data?.data) ? data.data : [];
      setItems(list);
      // Mark all as read once they have been fetched
      markNotificationsRead();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load notifications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString();
  };

  const typeLabel = (t) => {
    switch (t) {
      case "WITHDRAW_ACTION":
        return "Consent withdrawn";
      case "RENEW_ACTION":
        return "Consent renewed";
      case "WITHDRAW_REJECTED":
        return "Withdraw request rejected";
      case "RENEW_REJECTED":
        return "Renew request rejected";
      case "WITHDRAW_REQUEST":
        return "Withdraw request created";
      case "RENEW_REQUEST":
        return "Renew request created";
      default:
        return t || "Notification";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            Updates on your consent requests and actions taken by Data
            Fiduciaries.
          </p>
        </div>
        <button
          className="text-sm border rounded-lg px-3 py-2 hover:bg-gray-50"
          onClick={fetchNotifications}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Loading notifications…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">No notifications yet.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y">
          {items.map((n) => {
            const c = n.userConsentId || {};
            const entityName = c?.consentId?.dataEntityId?.name || "";
            const purpose = c?.purposeId?.purposeName || "";
            return (
              <div key={n._id} className="p-4 flex flex-col gap-1">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {typeLabel(n.type)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {`Consent for "${purpose}" with ${entityName || "Data Fiduciary"}.`}
                    </p>
                    {n.message && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {n.message}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
