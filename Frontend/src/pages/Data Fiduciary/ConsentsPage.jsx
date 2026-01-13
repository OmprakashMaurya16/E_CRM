import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import ConsentCard from "../../components/ConsentCard";
import { RotateCcw } from "lucide-react";
import { SearchContext } from "../../context/SearchContext";

const ConsentsPage = () => {
  const { searchText } = useContext(SearchContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consents, setConsents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [principalFilter, setPrincipalFilter] = useState("ALL");

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const fetchConsents = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/fiduciary/consents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res?.data?.data?.consentsList)
        ? res.data.data.consentsList
        : [];
      setConsents(list);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load consents.");
      setConsents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const now = new Date();
  const inNextDays = (d, days) => {
    if (!d) return false;
    const date = new Date(d);
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return date >= now && date <= end;
  };
  const inPastDays = (d, days) => {
    if (!d) return false;
    const date = new Date(d);
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return date >= start && date <= now;
  };

  const getPrincipalName = (c) => {
    return (
      c?.userId?.fullName ||
      c?.dataPrincipal?.name ||
      c?.principal?.fullName ||
      c?.principalName ||
      "Unknown"
    );
  };

  const principalOptions = useMemo(() => {
    const set = new Set();
    consents.forEach((c) => {
      const name = (getPrincipalName(c) || "").trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [consents]);

  const filtered = useMemo(() => {
    let data = consents.slice();

    // Status
    const getEffectiveStatus = (c) => {
      const vtVal = c?.validTill || c?.expiryAt;
      const vt = vtVal ? new Date(vtVal) : null;
      if (c?.status === "WITHDRAWN") return "WITHDRAWN";
      if (c?.status === "EXPIRED") return "EXPIRED";
      if (c?.status === "GRANTED") {
        if (vt && vt < now) return "EXPIRED";
        return "GRANTED";
      }
      return c?.status || "";
    };

    data = data.filter((c) => {
      if (statusFilter === "ALL") return true;
      const eff = getEffectiveStatus(c);
      if (statusFilter === "ACTIVE") return eff === "GRANTED";
      if (statusFilter === "WITHDRAWN") return eff === "WITHDRAWN";
      if (statusFilter === "EXPIRED") return eff === "EXPIRED";
      return true;
    });

    // Date range by expiry/withdrawn
    data = data.filter((c) => {
      if (dateRange === "ALL") return true;
      const vtField = c?.validTill || c?.expiryAt;
      if (dateRange === "NEXT_7") return inNextDays(vtField, 7);
      if (dateRange === "NEXT_30") return inNextDays(vtField, 30);
      if (dateRange === "PAST_MONTH")
        return inPastDays(c?.withdrawnAt || vtField, 30);
      return true;
    });

    // Principal filter
    data = data.filter((c) => {
      if (principalFilter === "ALL") return true;
      const name = (getPrincipalName(c) || "").trim();
      return name === principalFilter;
    });

    // Search
    const q = (searchText || "").trim().toLowerCase();
    if (q) {
      data = data.filter((c) => {
        const entityName = c?.consentId?.dataEntityId?.name || "";
        const principalName = getPrincipalName(c) || "";
        const title = c?.consentId?.consentTitle || "";
        const desc = c?.consentId?.consentDescription || "";
        const purpose = c?.purposeId?.purposeName || "";
        const status = c?.status || "";
        const haystack = [
          entityName,
          principalName,
          title,
          desc,
          purpose,
          status,
        ]
          .join(" \n ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    return data;
  }, [consents, statusFilter, dateRange, principalFilter, searchText]);

  const totals = useMemo(() => {
    const total = consents.length;
    const withdrawn = consents.reduce(
      (acc, c) => acc + (c?.status === "WITHDRAWN" ? 1 : 0),
      0
    );
    const expired = consents.reduce(
      (acc, c) => acc + (c?.status === "EXPIRED" ? 1 : 0),
      0
    );
    const active = consents.reduce(
      (acc, c) => acc + (c?.status === "GRANTED" ? 1 : 0),
      0
    );
    return { total, withdrawn, expired, active };
  }, [consents]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Consents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Consents associated with your Data Fiduciary.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Total Consents</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {totals.total}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Active Consents</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {totals.active}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Withdrawn</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1">
            {totals.withdrawn}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-sm text-gray-500">Expired</p>
          <p className="text-2xl font-semibold text-red-600 mt-1">
            {totals.expired}
          </p>
        </div>
      </div>

      {/* Single refresh lives in filters below */}

      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                className="text-sm border rounded-lg px-2 py-1 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="WITHDRAWN">Withdrawn</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Date Range:</label>
              <select
                className="text-sm border rounded-lg px-2 py-1 bg-white"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="ALL">All</option>
                <option value="NEXT_7">Next 7 days</option>
                <option value="NEXT_30">Next 30 days</option>
                <option value="PAST_MONTH">Past month</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Data Principal:</label>
              <select
                className="text-sm border rounded-lg px-2 py-1 bg-white"
                value={principalFilter}
                onChange={(e) => setPrincipalFilter(e.target.value)}
              >
                <option value="ALL">All</option>
                {principalOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="ml-auto flex items-center gap-2 text-sm border rounded-lg px-3 py-2 hover:bg-gray-50"
              onClick={fetchConsents}
              disabled={loading}
            >
              <RotateCcw size={16} /> {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {filtered.map((c) => (
              <ConsentCard
                key={c?._id}
                consent={c}
                onWithdraw={fetchConsents}
                entityLabel="Data Principal"
                entityName={getPrincipalName(c)}
              />
            ))}
          </div>

          {/* Optional: grids for specific statuses can be re-enabled if needed */}
        </>
      )}
    </div>
  );
};

export default ConsentsPage;
