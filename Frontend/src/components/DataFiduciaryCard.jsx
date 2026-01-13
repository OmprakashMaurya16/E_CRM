import { useEffect, useState } from "react";
import axios from "axios";
import Card from "./Card";
import ConsentTable from "./ConsentTable";
import FiduciaryPrincipalsTable from "./FiduciaryPrincipalsTable";
import FiduciaryProcessorsTable from "./FiduciaryProcessorsTable";
import { ShieldCheck, Users, Database } from "lucide-react";

const DataFiduciaryCard = () => {
  const [showTable, setShowTable] = useState(true);
  const [activeMetric, setActiveMetric] = useState("consents");
  const [isLoading, setIsLoading] = useState(true);

  const [metrics, setMetrics] = useState({
    consents: 0,
    principals: 0,
    processors: 0,
  });

  const [consents, setConsents] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const token = localStorage.getItem("token");

        const { data } = await axios.get(`${API_BASE}/fiduciary/consents`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = data?.data;

        setConsents(result?.consentsList ?? []);
        setMetrics(
          result?.metrics ?? {
            consents: 0,
            principals: 0,
            processors: 0,
          }
        );
      } catch (error) {
        console.error("Error fetching fiduciary data:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [API_BASE]);

  const handleClick = (metric) => {
    setActiveMetric(metric);
    setShowTable(true);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card
          title="Total Consents"
          value={isLoading ? "…" : metrics.consents}
          subtitle="All recorded consents"
          icon={<ShieldCheck className="text-slate-500" />}
          color="bg-slate-100"
          onClick={() => handleClick("consents")}
        />

        <Card
          title="Total Data Principals"
          value={isLoading ? "…" : metrics.principals}
          subtitle="Registered individuals"
          icon={<Users className="text-slate-500" />}
          color="bg-slate-100"
          onClick={() => handleClick("principals")}
        />

        <Card
          title="Total Data Processors"
          value={isLoading ? "…" : metrics.processors}
          subtitle="Active processors"
          icon={<Database className="text-slate-500" />}
          color="bg-slate-100"
          onClick={() => handleClick("processors")}
        />
      </div>

      {showTable && (
        <div className="mt-6">
          {activeMetric === "consents" && (
            <ConsentTable
              key="consents"
              data={consents}
              title="Consents"
              viewAllPath="/data-fiduciary?view=consents"
            />
          )}
          {activeMetric === "principals" && (
            <FiduciaryPrincipalsTable key="principals" />
          )}
          {activeMetric === "processors" && (
            <FiduciaryProcessorsTable key="processors" />
          )}
        </div>
      )}
    </div>
  );
};

export default DataFiduciaryCard;
