import React, { useEffect, useState } from "react";
import axios from "axios";

const FiduciaryNotificationPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const markNotificationsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/fiduciary/notifications/mark-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch {
      // Ignore errors; unread count will refresh on next successful attempt
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API_BASE}/fiduciary/notifications`, {
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
      case "WITHDRAW_REQUEST":
        return "Withdraw request";
      case "RENEW_REQUEST":
        return "Renew request";
      default:
        return t || "Notification";
    }
  };

  const handleApprove = async (notification) => {
    const consent = notification.userConsentId || {};
    const principal = notification.dataPrincipalId || {};
    const isWithdraw = notification.type === "WITHDRAW_REQUEST";

    const expiryDate = consent.expiryAt ? new Date(consent.expiryAt) : null;
    const requestedAt = notification.createdAt
      ? new Date(notification.createdAt).toLocaleString()
      : "-";

    let baseMessage =
      `From: ${principal.fullName || "Unknown"} (${principal.email || "-"})\n` +
      `Expires on ${expiryDate ? expiryDate.toLocaleString() : "-"}\n` +
      `Requested at ${requestedAt}\n\n` +
      "Are you sure you want to approve this request and update consent?";

    // If consent is still active but will expire within the next 24 hours,
    // add an extra warning before approving the withdraw.
    if (isWithdraw && expiryDate) {
      const now = new Date();
      const diffMs = expiryDate.getTime() - now.getTime();
      if (diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000) {
        baseMessage +=
          "\n\nNote: This consent is expiring soon. Withdrawing it now will stop processing before the expiry date.";
      }
    }

    const id = notification._id;

    const ok = window.confirm(baseMessage);

    // If fiduciary cancels, treat it as a rejection so the Data Principal
    // receives a detailed explanation (pros/cons, expiry, etc.).
    if (!ok) {
      try {
        setActionLoadingId(id);
        const token = localStorage.getItem("token");
        await axios.post(
          `${API_BASE}/fiduciary/notifications/${id}/reject`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        await fetchNotifications();
      } catch (err) {
        alert(
          err?.response?.data?.message ||
            "Failed to reject request. Please try again.",
        );
      } finally {
        setActionLoadingId(null);
      }
      return;
    }

    try {
      setActionLoadingId(id);
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/fiduciary/notifications/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchNotifications();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Failed to process request. Please try again.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    const ok = window.confirm("Reject this request without changing consent?");
    if (!ok) return;
    try {
      setActionLoadingId(id);
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/fiduciary/notifications/${id}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchNotifications();
    } catch (err) {
      alert(
        err?.response?.data?.message ||
          "Failed to reject request. Please try again.",
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Data Principal Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Approve withdraw/renew requests raised by Data Principals.
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
        <div className="text-sm text-gray-500">Loading requests…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">No pending requests.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y">
          {items.map((n) => {
            const c = n.userConsentId || {};
            const principal = n.dataPrincipalId || {};
            const entityName = c?.consentId?.dataEntityId?.name || "";
            const purpose = c?.purposeId?.purposeName || "";
            const expiryAt = c?.expiryAt ? new Date(c.expiryAt) : null;
            const now = new Date();
            const msRemaining = expiryAt
              ? expiryAt.getTime() - now.getTime()
              : null;
            const isNearExpiry =
              msRemaining !== null &&
              msRemaining > 0 &&
              msRemaining <= 24 * 60 * 60 * 1000;
            return (
              <div
                key={n._id}
                className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {typeLabel(n.type)} for "{purpose}" ({entityName})
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    From: {principal.fullName || "Unknown"} (
                    {principal.email || "-"})
                  </p>
                  {expiryAt && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Expires on {expiryAt.toLocaleString()}
                      {isNearExpiry && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-medium">
                          Near expiry
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    Requested at {formatDateTime(n.createdAt)}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 flex items-center gap-2">
                  <button
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                    onClick={() => handleApprove(n)}
                    disabled={actionLoadingId === n._id}
                  >
                    {actionLoadingId === n._id ? "Processing…" : "Approve"}
                  </button>
                  <button
                    className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-60"
                    onClick={() => handleReject(n._id)}
                    disabled={actionLoadingId === n._id}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FiduciaryNotificationPage;
