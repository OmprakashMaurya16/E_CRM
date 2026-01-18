import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FiduciaryPrincipalsTable = () => {
  const navigate = useNavigate();
  const [principals, setPrincipals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPrincipals = async () => {
      try {
        const token = localStorage.getItem("token");
        const base = import.meta.env.VITE_API_BASE_URL || "";
        const { data } = await axios.get(`${base}/fiduciary/principals`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(data?.data?.principals)
          ? data.data.principals
          : [];

        setPrincipals(list.slice(0, 5));
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load principals.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrincipals();
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-900">Data Principals</h3>
        <span
          className="text-blue-600 text-sm cursor-pointer hover:underline"
          onClick={() => navigate("/fiduciary/data-principals")}
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
      ) : principals.length === 0 ? (
        <div className="text-sm text-gray-600">No principals found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {principals.map((u) => (
                <tr
                  key={u._id}
                  className="border-b last:border-none hover:bg-gray-50"
                >
                  <td className="py-3">{u.name || u.fullName || u._id}</td>
                  <td>{u.email || "-"}</td>
                  <td>{u.role || "DATA_PRINCIPAL"}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FiduciaryPrincipalsTable;
