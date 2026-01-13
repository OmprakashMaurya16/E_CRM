import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const FiduciaryProcessorsTable = () => {
  const navigate = useNavigate();
  const [processors, setProcessors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProcessors = async () => {
      try {
        const token = localStorage.getItem("token");
        const base = import.meta.env.VITE_API_BASE_URL || "";
        const { data } = await axios.get(`${base}/fiduciary/processors`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = Array.isArray(data?.data?.processors)
          ? data.data.processors
          : [];
        setProcessors(list.slice(0, 5));
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load processors.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProcessors();
  }, []);

  return (
    <div className="bg-white shadow rounded-xl p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-900">Data Processors</h3>
        <span
          className="text-blue-600 text-sm cursor-pointer hover:underline"
          onClick={() => navigate("/data-fiduciary?view=processors")}
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
      ) : processors.length === 0 ? (
        <div className="text-sm text-gray-600">No processors found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {processors.map((p) => (
                <tr
                  key={p._id}
                  className="border-b last:border-none hover:bg-gray-50"
                >
                  <td className="py-3">{p.name || p._id}</td>
                  <td>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {p.status || "ACTIVE"}
                    </span>
                  </td>
                  <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FiduciaryProcessorsTable;
