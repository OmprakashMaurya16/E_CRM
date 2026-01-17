import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { SearchContext } from "../../context/SearchContext";
import { MoreVertical, RotateCcw } from "lucide-react";

const Badge = ({ status }) => {
  const map = {
    Active: "bg-green-100 text-green-700",
    Withdrawn: "bg-gray-100 text-gray-700",
    Expired: "bg-yellow-100 text-yellow-700",
    None: "bg-slate-100 text-slate-700",
  };
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${map[status] || map.None}`}
    >
      {status}
    </span>
  );
};

const formatDate = (d) => {
  if (!d) return "-";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const DataPrincipalsPage = () => {
  const { searchText } = useContext(SearchContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [principals, setPrincipals] = useState([]);
  const [consents, setConsents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [purposeFilter, setPurposeFilter] = useState("ALL");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const [pRes, cRes] = await Promise.all([
        axios.get(`${API_BASE}/fiduciary/principals`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE}/fiduciary/consents`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setPrincipals(
        Array.isArray(pRes?.data?.data?.principals)
          ? pRes.data.data.principals
          : []
      );
      const list = Array.isArray(cRes?.data?.data?.consentsList)
        ? cRes.data.data.consentsList
        : [];
      setConsents(list);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load principals.");
      setPrincipals([]);
      setConsents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const now = new Date();
  const getEffectiveStatus = (c) => {
    const vtVal = c?.validTill || c?.expiryAt;
    const vt = vtVal ? new Date(vtVal) : null;
    if (c?.status === "WITHDRAWN") return "Withdrawn";
    if (c?.status === "EXPIRED") return "Expired";
    if (c?.status === "GRANTED") {
      if (vt && vt < now) return "Expired";
      return "Active";
    }
    return "None";
  };

  const enrich = useMemo(() => {
    const byUser = new Map();
    consents.forEach((c) => {
      const uid = String(c?.userId?._id || c?.userId);
      if (!uid) return;
      const entry = byUser.get(uid) || {
        latest: null,
        statuses: new Set(),
        purposes: new Set(),
      };
      entry.statuses.add(getEffectiveStatus(c));
      const purposeName =
        c?.purposeId?.purposeName || c?.purpose?.name || c?.purposeName || "";
      if (purposeName) entry.purposes.add(purposeName);
      if (
        !entry.latest ||
        new Date(c.givenAt) > new Date(entry.latest.givenAt || 0)
      ) {
        entry.latest = c;
      }
      byUser.set(uid, entry);
    });
    return principals.map((p, idx) => {
      const uid = String(p._id);
      const info = byUser.get(uid);
      const status = info
        ? info.statuses.has("Active")
          ? "Active"
          : info.statuses.has("Withdrawn")
          ? "Withdrawn"
          : info.statuses.has("Expired")
          ? "Expired"
          : "None"
        : "None";
      const lastConsentDate = info?.latest?.givenAt || null;
      const displayId = `DP-${String(idx + 123).padStart(5, "0")}`; // simple display id
      const purposes = Array.from(info?.purposes || []);
      return { ...p, displayId, status, lastConsentDate, purposes };
    });
  }, [principals, consents]);

  const filtered = useMemo(() => {
    let data = enrich.slice();

    if (statusFilter !== "ALL") {
      data = data.filter((p) => p.status === statusFilter);
    }

    const q = (searchText || "").trim().toLowerCase();
    if (q) {
      data = data.filter((p) => {
        const hay = [
          p.fullName || "",
          p.email || "",
          p.displayId || "",
          p.status || "",
        ]
          .join(" \n ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    if (purposeFilter !== "ALL") {
      data = data.filter(
        (p) => Array.isArray(p.purposes) && p.purposes.includes(purposeFilter)
      );
    }

    return data;
  }, [enrich, statusFilter, searchText, purposeFilter]);

  const purposeOptions = useMemo(() => {
    const set = new Set();
    consents.forEach((c) => {
      const name =
        c?.purposeId?.purposeName || c?.purpose?.name || c?.purposeName || "";
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [consents]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Principals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Linked principals under your data fiduciary.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Status:</label>
          <select
            className="text-sm border rounded-lg px-2 py-1 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="Active">Active</option>
            <option value="Withdrawn">Withdrawn</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Purpose:</label>
          <select
            className="text-sm border rounded-lg px-2 py-1 bg-white"
            value={purposeFilter}
            onChange={(e) => setPurposeFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            {purposeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="ml-auto flex items-center gap-2 text-sm border rounded-lg px-3 py-2 hover:bg-gray-50"
          onClick={fetchData}
          disabled={loading}
        >
          <RotateCcw size={16} /> {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[32px_160px_1fr_220px_140px_160px_80px] px-4 py-3 text-xs font-medium text-gray-500 border-b">
          <div></div>
          <div>DATA PRINCIPAL ID</div>
          <div>NAME</div>
          <div>CONTACT INFO</div>
          <div>CONSENT STATUS</div>
          <div>DATE OF CONSENT</div>
          <div className="text-right">ACTIONS</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading principals…</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">
            No principals match filters.
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p._id}
              className="grid grid-cols-[32px_160px_1fr_220px_140px_160px_80px] px-4 py-3 items-center border-b last:border-0 text-sm"
            >
              <div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              <div className="text-gray-700">{p.displayId}</div>
              <div className="font-medium text-gray-900">{p.fullName}</div>
              <div className="text-gray-700">{p.email || "-"}</div>
              <div>
                <Badge status={p.status} />
              </div>
              <div className="text-gray-700">
                {formatDate(p.lastConsentDate)}
              </div>
              <div className="text-right">
                <button className="p-1 rounded hover:bg-gray-100">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DataPrincipalsPage;
