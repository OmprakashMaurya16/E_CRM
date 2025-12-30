import { BadgeCheck, Clock, RefreshCw, Shield, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

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
    color: "bg-green-100 text-green-700",
    icon: BadgeCheck,
  },
  WITHDRAWN: {
    label: "Withdrawn",
    color: "bg-gray-100 text-gray-700",
    icon: XCircle,
  },
  EXPIRED: {
    label: "Expired",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
};

const ConsentCard = ({ consent, onWithdraw }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const status = consent?.status;
  const meta = STATUS_META[status] || {
    label: status || "-",
    color: "bg-slate-100 text-slate-700",
    icon: Shield,
  };

  const Icon = meta.icon;

  const org = consent?.consentId?.dataEntityId;
  const purpose = consent?.purposeId;

  const canWithdraw = status === "GRANTED";
  const canRenew = status === "EXPIRED";

  const handleWithdraw = async () => {
    const ok = window.confirm(
      "Are you sure you want to withdraw this consent?"
    );
    if (!ok) return;
    try {
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_BASE_URL || "";
      await axios.post(
        `${base}/consents/${consent?._id}/withdraw`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Consent withdrawn");
      if (typeof onWithdraw === "function") onWithdraw();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to withdraw consent");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center border overflow-hidden">
            {org?.logoUrl && !imgError ? (
              <img
                src={org.logoUrl}
                alt={org.name}
                className="h-10 w-10 object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-sm font-semibold text-blue-700">
                {org?.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{org?.name || "-"}</p>
            <p className="text-xs text-gray-500">Data Fiduciary</p>
          </div>
        </div>

        <span
          className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${meta.color}`}
        >
          <Icon size={14} /> {meta.label}
        </span>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-xs text-gray-400">PURPOSE</p>
        <p className="text-sm font-medium text-gray-800">
          {purpose?.purposeName || "-"}
        </p>
        {purpose?.description && (
          <p className="text-sm text-gray-600">{purpose.description}</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="text-sm text-gray-600">
          <p className="text-xs text-gray-400">
            {status === "WITHDRAWN" ? "WITHDRAWN ON" : "EXPIRY"}
          </p>
          <p className="font-medium">
            {status === "WITHDRAWN"
              ? formatDate(consent?.withdrawnAt)
              : formatDate(consent?.expiryAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          onClick={() => navigate(`/details/${consent?.consentId?._id}`)}
        >
          View Details
        </button>

        {canWithdraw && (
          <button
            className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={handleWithdraw}
          >
            Withdraw
          </button>
        )}

        {canRenew && (
          <button
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
            onClick={() =>
              navigate("/renew", {
                state: { id: consent._id, action: "renew" },
              })
            }
          >
            <RefreshCw size={14} /> Renew
          </button>
        )}
      </div>
    </div>
  );
};

export default ConsentCard;
