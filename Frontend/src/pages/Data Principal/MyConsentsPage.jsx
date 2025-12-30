import React, { useEffect, useMemo, useState, useContext } from "react";
import axios from "axios";
import ConsentCard from "../../components/ConsentCard";
import { RotateCcw } from "lucide-react";
import { SearchContext } from "../../context/SearchContext";

const MyConsentsPage = () => {
  const { searchText } = useContext(SearchContext);
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [fiduciaryFilter, setFiduciaryFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const fetchConsents = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_BASE_URL || "";
      const url = base ? `${base}/consents` : `consents`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConsents(Array.isArray(res.data?.data) ? res.data.data : []);
      setPage(1);
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

  const fiduciaryOptions = useMemo(() => {
    const set = new Set();
    consents.forEach((c) => {
      const entity = c?.consentId?.dataEntityId;
      const isFiduciary = entity?.entityType === "DATA_FIDUCIARY";
      const name = entity?.name?.trim();
      if (isFiduciary && name) set.add(name);
    });
    return Array.from(set).sort();
  }, [consents]);

  const filtered = useMemo(() => {
    let data = consents.slice();

    data = data.filter((c) => {
      if (statusFilter === "ALL") return true;
      const vt = c?.validTill
        ? new Date(c.validTill)
        : c?.expiryAt
        ? new Date(c.expiryAt)
        : null;
      const isActive = c?.status === "GRANTED" && vt && vt >= now;
      const isWithdrawn = c?.status === "WITHDRAWN";
      const isExpired =
        c?.status === "EXPIRED" || (c?.status === "GRANTED" && vt && vt < now);
      if (statusFilter === "ACTIVE") return isActive;
      if (statusFilter === "WITHDRAWN") return isWithdrawn;
      if (statusFilter === "EXPIRED") return isExpired;
      return true;
    });

    data = data.filter((c) => {
      if (dateRange === "ALL") return true;
      const vtField = c?.validTill || c?.expiryAt;
      if (dateRange === "NEXT_7") return inNextDays(vtField, 7);
      if (dateRange === "NEXT_30") return inNextDays(vtField, 30);
      if (dateRange === "PAST_MONTH")
        return inPastDays(c?.withdrawnAt || vtField, 30);
      return true;
    });

    data = data.filter((c) => {
      if (fiduciaryFilter === "ALL") return true;
      const name = c?.consentId?.dataEntityId?.name?.trim();
      return name === fiduciaryFilter;
    });
    // Search filter
    const q = (searchText || "").trim().toLowerCase();
    if (q) {
      data = data.filter((c) => {
        const entityName = c?.consentId?.dataEntityId?.name || "";
        const title = c?.consentId?.consentTitle || "";
        const desc = c?.consentId?.consentDescription || "";
        const purpose = c?.purposeId?.purposeName || "";
        const status = c?.status || "";
        const haystack = [entityName, title, desc, purpose, status]
          .join(" \n ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return data;
  }, [consents, statusFilter, dateRange, fiduciaryFilter, searchText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const totalConsents = consents.length;
  const totalFiduciaries = fiduciaryOptions.length;
  const activeConsents = useMemo(() => {
    return consents.reduce((acc, c) => {
      const vt = c?.validTill
        ? new Date(c.validTill)
        : c?.expiryAt
        ? new Date(c.expiryAt)
        : null;
      const isActive = c?.status === "GRANTED" && vt && vt >= now;
      return acc + (isActive ? 1 : 0);
    }, 0);
  }, [consents]);
  return (
    <div>
      {" "}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Consents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and review your data sharing permissions. Search is available
            in the navbar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Data Fiduciaries</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {totalFiduciaries}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Total Consents</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">
              {totalConsents}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-500">Active Consents</p>
            <p className="text-2xl font-semibold text-green-600 mt-1">
              {activeConsents}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              className="text-sm border rounded-lg px-2 py-1 bg-white"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
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
              onChange={(e) => {
                setDateRange(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All</option>
              <option value="NEXT_7">Next 7 days</option>
              <option value="NEXT_30">Next 30 days</option>
              <option value="PAST_MONTH">Past month</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Data Fiduciary:</label>
            <select
              className="text-sm border rounded-lg px-2 py-1 bg-white"
              value={fiduciaryFilter}
              onChange={(e) => {
                setFiduciaryFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All</option>
              {fiduciaryOptions.map((name) => (
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

        {loading ? (
          <div className="text-sm text-gray-500">Loading consents…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : pageItems.length === 0 ? (
          <div className="text-sm text-gray-500">
            No consents match filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {pageItems.map((c) => (
                <ConsentCard key={c?._id} consent={c} />
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
              <p>
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, filtered.length)} of{" "}
                {filtered.length} results
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 border rounded-lg disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <span className="px-3 py-1 border rounded-lg bg-gray-100">
                  {page}
                </span>
                <button
                  className="px-3 py-1 border rounded-lg disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyConsentsPage;
