import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

const ConsentTable = () => {
  const navigate = useNavigate();
  const [consents, setConsents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchConsents = async () => {
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

        // Dashboard = ACTIVE ONLY
        setConsents(raw.filter((c) => c.status === "GRANTED").slice(0, 5));
      } catch {
        setError("Failed to load active consents.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsents();
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-6 mt-10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-900">Active Consents</h3>
        <span
          className="text-blue-600 text-sm cursor-pointer hover:underline"
          onClick={() => navigate("/my-consents")}
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
                      Active
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
