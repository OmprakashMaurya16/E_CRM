import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMethod = (value) => {
  switch (value) {
    case "ONLINE":
      return "WEB";
    case "MOBILE_APP":
      return "APP";
    case "OFFLINE":
      return "OFFLINE";
    case "IN_PERSON":
      return "IN-PERSON";
    default:
      return "-";
  }
};

const ConsentTable = ({ data, title, viewAllPath, status }) => {
  const navigate = useNavigate();
  const [consents, setConsents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConsents = async () => {
      // If `data` is passed, use it directly
      if (Array.isArray(data)) {
        try {
          const filtered = status
            ? data.filter((c) => c.status === status)
            : data;
          setConsents(filtered.slice(0, 5));
        } catch {
          setConsents([]);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          import.meta.env.VITE_API_BASE_URL + "/consents",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const raw = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

        const filtered = status ? raw.filter((c) => c.status === status) : raw;
        setConsents(filtered.filter((c) => c.status === "GRANTED").slice(0, 5));
      } catch {
        setError("Failed to load active consents.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsents();
  }, [data, status]);

  const headerTitle = useMemo(() => {
    if (title) return title;
    if (status === "WITHDRAWN") return "Withdrawn Consents";
    if (status === "EXPIRED") return "Expired Consents";
    return "Active Consents";
  }, [title, status]);

  const viewAllTarget = useMemo(() => {
    if (viewAllPath) return viewAllPath;
    return "/my-consents";
  }, [viewAllPath]);

  return (
    <div className="bg-white shadow rounded-xl p-6 mt-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-900">{headerTitle}</h3>
        <span
          className="text-blue-600 text-sm cursor-pointer hover:underline"
          onClick={() => navigate(viewAllTarget)}
        >
          View All →
        </span>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-md" />
          ))}
        </div>
      ) : consents.length === 0 ? (
        <div className="text-sm text-gray-600">No active consents found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left py-2">Purpose</th>
                <th className="text-left py-2">Data Fiduciary</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Given On</th>
                <th className="text-left py-2">Valid Till</th>
                <th className="text-left py-2">Version</th>
                <th className="text-left py-2">Collection</th>
              </tr>
            </thead>
            <tbody>
              {consents.map((c) => (
                <tr
                  key={c._id}
                  className="border-b last:border-none hover:bg-gray-50"
                >
                  <td className="py-3">{c?.purposeId?.purposeName || "-"}</td>
                  <td>{c?.consentId?.dataEntityId?.name || "-"}</td>
                  <td>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {c.status === "GRANTED"
                        ? "Active"
                        : c.status === "WITHDRAWN"
                        ? "Withdrawn"
                        : c.status === "EXPIRED"
                        ? "Expired"
                        : c.status || "-"}
                    </span>
                  </td>
                  <td>{formatDate(c.givenAt)}</td>
                  <td>{formatDate(c.expiryAt)}</td>
                  <td>{c?.consentMetaDataId?.version || "-"}</td>
                  <td>
                    {formatMethod(c?.consentMetaDataId?.methodOfCollection)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ConsentTable;
