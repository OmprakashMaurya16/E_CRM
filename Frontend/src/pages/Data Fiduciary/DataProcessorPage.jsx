import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { SearchContext } from "../../context/SearchContext";
import { RotateCcw, Trash2 } from "lucide-react";

const Badge = ({ status }) => {
  const map = {
    ACTIVE: "bg-green-100 text-green-700",
    SUSPENDED: "bg-gray-100 text-gray-700",
  };
  const label =
    status === "ACTIVE"
      ? "Active"
      : status === "SUSPENDED"
      ? "Suspended"
      : status || "-";
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${
        map[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {label}
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

const DataProcessorPage = () => {
  const { searchText } = useContext(SearchContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processors, setProcessors] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [namePrefix, setNamePrefix] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const fetchProcessors = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/fiduciary/processors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProcessors(
        Array.isArray(res?.data?.data?.processors)
          ? res.data.data.processors
          : []
      );
      setSelectedIds([]);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load processors.");
      setProcessors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessors();
  }, []);

  const filtered = useMemo(() => {
    let items = processors.slice();
    if (statusFilter !== "ALL") {
      items = items.filter((p) => p.status === statusFilter);
    }
    const q = (searchText || "").trim().toLowerCase();
    if (q) {
      items = items.filter((p) => {
        const hay = [p.name || "", p.status || ""].join(" \n ").toLowerCase();
        return hay.includes(q);
      });
    }
    if (namePrefix !== "ALL") {
      const pref = (namePrefix || "").toLowerCase();
      items = items.filter((p) =>
        (p.name || "").toLowerCase().startsWith(pref)
      );
    }
    return items;
  }, [processors, statusFilter, searchText, namePrefix]);

  const prefixOptions = useMemo(() => {
    const set = new Set();
    processors.forEach((p) => {
      const ch = (p?.name || "").trim().charAt(0).toUpperCase();
      if (ch >= "A" && ch <= "Z") set.add(ch);
    });
    return Array.from(set).sort();
  }, [processors]);

  const allVisibleIds = useMemo(() => filtered.map((p) => p._id), [filtered]);
  const allSelected = useMemo(
    () =>
      allVisibleIds.length > 0 &&
      allVisibleIds.every((id) => selectedIds.includes(id)),
    [allVisibleIds, selectedIds]
  );

  const toggleSelectAll = (checked) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) {
        allVisibleIds.forEach((id) => set.add(id));
      } else {
        allVisibleIds.forEach((id) => set.delete(id));
      }
      return Array.from(set);
    });
  };

  const toggleSelect = (id, checked) => {
    setSelectedIds((prev) => {
      const set = new Set(prev);
      if (checked) set.add(id);
      else set.delete(id);
      return Array.from(set);
    });
  };

  const removeSelected = async () => {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(
      `Remove ${selectedIds.length} processor${
        selectedIds.length > 1 ? "s" : ""
      }?`
    );
    if (!ok) return;
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await Promise.all(
        selectedIds.map((id) =>
          axios.delete(`${API_BASE}/fiduciary/processors/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setSelectedIds([]);
      await fetchProcessors();
    } catch (err) {
      setError(
        err?.response?.data?.message || "Failed to remove selected processors."
      );
    } finally {
      setLoading(false);
    }
  };

  const removeOne = async (id) => {
    const ok = window.confirm("Remove this processor?");
    if (!ok) return;
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/fiduciary/processors/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedIds((prev) => prev.filter((x) => x !== id));
      await fetchProcessors();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to remove processor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Processors</h1>
          <p className="text-sm text-gray-500 mt-1">
            Active processors associated with your fiduciary.
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
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Starts With:</label>
          <select
            className="text-sm border rounded-lg px-2 py-1 bg-white"
            value={namePrefix}
            onChange={(e) => setNamePrefix(e.target.value)}
          >
            <option value="ALL">All</option>
            {prefixOptions.map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {selectedIds.length > 0 && (
            <>
              <span className="text-sm text-gray-600">
                Selected: {selectedIds.length}
              </span>
              <button
                className="text-sm text-gray-600 underline"
                onClick={() => setSelectedIds([])}
                disabled={loading}
              >
                Clear
              </button>
            </>
          )}
          <button
            className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 hover:bg-gray-50"
            onClick={fetchProcessors}
            disabled={loading}
          >
            <RotateCcw size={16} /> {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-[32px_1fr_160px_160px_100px] px-4 py-3 text-xs font-medium text-gray-500 border-b">
          <div>
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300"
              checked={allSelected}
              onChange={(e) => toggleSelectAll(e.target.checked)}
            />
          </div>
          <div>NAME</div>
          <div>STATUS</div>
          <div>CREATED AT</div>
          <div className="text-right">ACTIONS</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading processors…</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">
            No processors match filters.
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p._id}
              className="grid grid-cols-[32px_1fr_160px_160px_100px] px-4 py-3 items-center border-b last:border-0 text-sm"
            >
              <div>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={selectedIds.includes(p._id)}
                  onChange={(e) => toggleSelect(p._id, e.target.checked)}
                />
              </div>
              <div className="font-medium text-gray-900">{p.name}</div>
              <div>
                <Badge status={p.status} />
              </div>
              <div className="text-gray-700">{formatDate(p.createdAt)}</div>
              <div className="text-right">
                {selectedIds.includes(p._id) ? (
                  <button
                    className="inline-flex items-center gap-1 text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50"
                    onClick={() => removeOne(p._id)}
                    disabled={loading}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                ) : (
                  <span className="text-xs text-gray-300">—</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DataProcessorPage;
