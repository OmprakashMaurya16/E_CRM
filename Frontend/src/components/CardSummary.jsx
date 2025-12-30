import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Card from "./Card";
import { useState, useEffect } from "react";
import axios from "axios";

const CardSummary = () => {
  const [consents, setConsents] = useState([]);

  useEffect(() => {
    const fetchConsents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setConsents([]);
          return;
        }

        const response = await axios.get(
          import.meta.env.VITE_API_BASE_URL + "/consents",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

        setConsents(data);
      } catch (err) {
        console.warn("Failed to fetch consents:", err?.message || err);
        setConsents([]);
      }
    };

    fetchConsents();
  }, []);

  const active = consents.filter((c) => c.status === "GRANTED").length;

  const withdrawn = consents.filter((c) => c.status === "WITHDRAWN").length;

  const expired = consents.filter((c) => c.status === "EXPIRED").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <Card
        title="Active Consents"
        value={active}
        subtitle="In use right now"
        icon={<CheckCircle className="text-green-600" />}
        color="bg-green-100"
      />

      <Card
        title="Withdrawn Consents"
        value={withdrawn}
        subtitle="No longer active"
        icon={<XCircle className="text-red-500" />}
        color="bg-red-100"
      />

      <Card
        title="Expired Consents"
        value={expired}
        subtitle="This consent has no longer in use"
        icon={<AlertTriangle className="text-orange-500" />}
        color="bg-orange-100"
      />
    </div>
  );
};

export default CardSummary;
