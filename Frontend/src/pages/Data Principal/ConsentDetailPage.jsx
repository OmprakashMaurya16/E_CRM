import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Clock,
  XCircle,
  CalendarDays,
  ArrowLeft,
  AlertTriangle,
  Download,
} from "lucide-react";

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

const STATUS_META = {
  GRANTED: {
    label: "Active",
    bg: "bg-green-100",
    color: "text-green-700",
    icon: BadgeCheck,
  },
  WITHDRAWN: {
    label: "Withdrawn",
    bg: "bg-gray-100",
    color: "text-gray-700",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    bg: "bg-yellow-100",
    color: "text-yellow-700",
    icon: Clock,
  },
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b last:border-0">
    <span className="text-sm text-gray-500">{label}</span>
    <span className="text-sm font-medium text-gray-900">{value || "-"}</span>
  </div>
);

const getUserRole = () => {
  try {
    const raw = localStorage.getItem("user");
    const user = raw ? JSON.parse(raw) : null;
    return user?.role || localStorage.getItem("role") || null;
  } catch {
    return localStorage.getItem("role") || null;
  }
};

const ConsentDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const consentId = location.state?.id || params.consentId;
  const role = getUserRole();
  const userConsentId =
    location.state?.userConsentId || params.userConsentId || null;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchConsentDetail = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_BASE_URL || "";
      const endpoint =
        role === "DATA_FIDUCIARY"
          ? `${base}/fiduciary/user-consents/${userConsentId}`
          : `${base}/consents/${consentId}`;
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data?.data || null);
    } catch (err) {
      console.error("Consent detail fetch failed", {
        consentId,
        status: err?.response?.status,
        message: err?.response?.data?.message,
      });
      const msg =
        err?.response?.status === 404
          ? "Consent not found for this user."
          : err?.response?.data?.message || "Failed to load consent details.";
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "DATA_FIDUCIARY") {
      if (!userConsentId) {
        setError("Missing consent record id");
        setLoading(false);
        return;
      }
      fetchConsentDetail();
      return;
    }
    if (!consentId) {
      setError("Missing consent id");
      setLoading(false);
      return;
    }
    fetchConsentDetail();
  }, [consentId, userConsentId, role]);

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading consent details…</div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  const status = data?.status;
  const meta = STATUS_META[status] || {
    label: status || "-",
    bg: "bg-slate-100",
    color: "text-slate-700",
    icon: BadgeCheck,
  };
  const StatusIcon = meta.icon;

  const purpose = data.purposeId;
  const org = data.consentId?.dataEntityId;
  const cm = data.consentMetaDataId;
  // Only show Data Principal details when viewed in Data Fiduciary context
  const principalUser = role === "DATA_FIDUCIARY" ? data.userId : null;

  const canWithdraw = status === "GRANTED";

  const handleWithdraw = async () => {
    if (!data?._id) return;
    const ok = window.confirm(
      "Are you sure you want to withdraw this consent?",
    );
    if (!ok) return;
    try {
      setWithdrawing(true);
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_BASE_URL || "";
      const res = await axios.post(
        `${base}/consents/${data._id}/withdraw`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(res?.data?.message || "Consent withdrawn");
      await fetchConsentDetail();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to withdraw consent");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDownload = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const marginX = 40;
      let y = 50;

      doc.setFontSize(18);
      doc.text("Consent Details", marginX, y);
      y += 24;
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text("Detailed view of your data sharing consent", marginX, y);
      y += 24;

      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.text(
        `Status: ${STATUS_META[data?.status]?.label || data?.status || "-"}`,
        marginX,
        y,
      );
      y += 18;
      doc.text(`Given Date: ${formatDate(data?.givenAt)}`, marginX, y);
      y += 18;
      doc.text(`Expiry Date: ${formatDate(data?.expiryAt)}`, marginX, y);
      y += 28;

      doc.setFontSize(13);
      doc.text("Purpose Information", marginX, y);
      y += 18;
      doc.setFontSize(11);
      doc.text(
        `Purpose Name: ${data?.purposeId?.purposeName || "-"}`,
        marginX,
        y,
      );
      y += 16;
      doc.text(`Sector: ${data?.purposeId?.sector || "-"}`, marginX, y);
      y += 16;
      const desc = (data?.purposeId?.description || "-")
        .replace(/\s+/g, " ")
        .trim();
      const descLines = doc.splitTextToSize(`Description: ${desc}`, 515);
      doc.text(descLines, marginX, y);
      y += 16 * descLines.length + 12;

      doc.setFontSize(13);
      doc.text("Metadata", marginX, y);
      y += 18;
      doc.setFontSize(11);
      doc.text(
        `Consent Type: ${data?.consentId?.consentType || "-"}`,
        marginX,
        y,
      );
      y += 16;
      doc.text(
        `Version: ${data?.consentMetaDataId?.version || "-"}`,
        marginX,
        y,
      );
      y += 16;
      doc.text(
        `Collection Method: ${
          data?.consentMetaDataId?.methodOfCollection || "-"
        }`,
        marginX,
        y,
      );
      y += 28;

      doc.setFontSize(13);
      doc.text("Data Fiduciary", marginX, y);
      y += 18;
      doc.setFontSize(11);
      doc.text(
        `Organization Name: ${data?.consentId?.dataEntityId?.name || "-"}`,
        marginX,
        y,
      );
      y += 16;
      doc.text(
        `Entity Type: ${data?.consentId?.dataEntityId?.entityType || "-"}`,
        marginX,
        y,
      );
      y += 16;
      doc.text(
        `Contact Email: ${data?.consentId?.dataEntityId?.contactEmail || "-"}`,
        marginX,
        y,
      );
      y += 24;

      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(`Generated on ${new Date().toLocaleString()}`, marginX, 820);

      doc.save(`consent_${data?._id || consentId}.pdf`);
    } catch (e) {}
  };

  const backTarget =
    role === "DATA_FIDUCIARY" ? "/fiduciary/consents" : "/my-consents";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consent Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Detailed view of your data sharing consent
          </p>
        </div>
        <button
          className="text-sm px-3 py-2 rounded-lg border hover:bg-gray-50 flex items-center gap-2"
          onClick={() => navigate(backTarget)}
        >
          <ArrowLeft size={16} />{" "}
          {role === "DATA_FIDUCIARY"
            ? "Back to All Consents"
            : "Back to My Consents"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">CURRENT STATUS</p>
          <div
            className={`mt-2 inline-flex items-center gap-2 px-2 py-1 rounded-full ${meta.bg} ${meta.color}`}
          >
            <StatusIcon size={16} /> {meta.label}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">GIVEN DATE</p>
          <div className="mt-2 flex items-center gap-2 font-medium">
            <CalendarDays size={16} />
            {formatDate(data.givenAt)}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-500">EXPIRY DATE</p>
          <div className="mt-2 flex items-center gap-2 font-medium">
            <CalendarDays size={16} />
            {formatDate(data.expiryAt)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b flex justify-between">
            <p className="font-semibold">Purpose Information</p>
            {purpose?.isSensitive && (
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                Sensitive Data
              </span>
            )}
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Purpose Name" value={purpose?.purposeName} />
            <InfoRow label="Sector" value={purpose?.sector} />
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500">DESCRIPTION</p>
              <p className="text-sm mt-1 text-gray-700">
                {purpose?.description || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <p className="font-semibold">Metadata</p>
          </div>
          <div className="p-4">
            <InfoRow label="Consent Type" value={data.consentId?.consentType} />
            <InfoRow label="Version" value={cm?.version} />
            <InfoRow label="Collection Method" value={cm?.methodOfCollection} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-4 border-b">
          <p className="font-semibold">Data Fiduciary</p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <p className="text-xs text-gray-500">ORGANIZATION NAME</p>
            <p className="text-sm font-medium">{org?.name || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">ENTITY TYPE</p>
            <p className="text-sm font-medium">{org?.entityType || "-"}</p>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs text-gray-500">CONTACT EMAIL</p>
            <p className="text-sm font-medium">{org?.contactEmail || "-"}</p>
          </div>
        </div>
      </div>

      {principalUser && role === "DATA_FIDUCIARY" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b">
            <p className="font-semibold">Data Principal</p>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">FULL NAME</p>
              <p className="text-sm font-medium">
                {principalUser.fullName || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">EMAIL</p>
              <p className="text-sm font-medium">
                {principalUser.email || "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex justify-between items-start">
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="font-semibold">Revocation Zone</p>
            <p className="text-sm text-gray-600">
              Withdrawing consent will immediately stop data processing.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {canWithdraw && (
            <button
              disabled={withdrawing}
              onClick={handleWithdraw}
              className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg disabled:opacity-50"
            >
              <XCircle size={16} className="inline mr-1" />
              {withdrawing ? "Withdrawing…" : "Withdraw Consent"}
            </button>
          )}
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg"
          >
            <Download size={16} className="inline mr-1" />
            Download Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsentDetailPage;
