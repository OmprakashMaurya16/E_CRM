import { useState } from "react";
import axios from "axios";

const AcceptConsentPage = () => {
  const [termsChecked, setTermsChecked] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const CONSENT_VERSION = "v1.0";
  const CONSENT_DURATION_DAYS = 365;
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

  const handleAccept = async () => {
    if (!termsChecked || loading) return;

    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE}/consents/demo-static`,
        {
          consentVersion: CONSENT_VERSION,
          durationDays: CONSENT_DURATION_DAYS,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setAccepted(true);
      setShowDetails(false);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to save consent. Please try again.",
      );
      setAccepted(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Consent Confirmation
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Please review the consent details carefully before providing your
          explicit acceptance.
        </p>
      </div>

      {/* Consent Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Data Usage Consent
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Consent Version: {CONSENT_VERSION}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900">Data Fiduciary</p>
            <p>Example Bank Pvt. Ltd.</p>
          </div>

          <div>
            <p className="font-medium text-gray-900">Purpose of Processing</p>
            <p>
              Account servicing, customer communication, and service improvement
              activities strictly related to banking services.
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-900">Data Categories</p>
            <p>
              Identity details, contact information, and transaction summaries
              limited to the stated purpose.
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-900">Consent Validity</p>
            <p>{CONSENT_DURATION_DAYS} days from the date of acceptance</p>
          </div>
        </div>

        {/* Legal Highlights */}
        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-medium text-gray-900">Important Information</p>
          <ul className="list-disc list-inside space-y-1">
            <li>This consent is voluntary and purpose-specific.</li>
            <li>You may withdraw this consent at any time.</li>
            <li>
              Data will not be retained beyond the consent period unless
              required by law.
            </li>
            <li>
              Reasonable technical and organisational safeguards are applied.
            </li>
          </ul>
        </div>

        {/* View Full Terms */}
        <button
          className="text-sm text-indigo-600 hover:underline"
          onClick={() => setShowDetails(true)}
        >
          View full consent terms
        </button>

        {/* Affirmative Action */}
        <div className="flex items-start gap-3 pt-2">
          <input
            id="consentCheck"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-gray-300"
            checked={termsChecked}
            onChange={(e) => setTermsChecked(e.target.checked)}
          />
          <label
            htmlFor="consentCheck"
            className="text-sm text-gray-700 cursor-pointer"
          >
            I have read and understood the purpose, duration, benefits, and
            risks of this consent and I explicitly agree to the processing of my
            personal data as described above.
          </label>
        </div>

        {/* Action */}
        <div className="pt-3">
          <button
            onClick={handleAccept}
            disabled={!termsChecked || loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              termsChecked && !loading
                ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            }`}
          >
            {loading ? "Saving…" : "Provide Consent"}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        {accepted && (
          <p className="text-sm text-green-600 font-medium">
            Consent successfully recorded.
          </p>
        )}
      </div>

      {/* Full Consent Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Full Consent Terms
              </h2>
              <button
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => setShowDetails(false)}
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-700 max-h-80 overflow-y-auto">
              <p>
                This consent is being obtained by Example Bank Pvt. Ltd. for
                clearly defined banking-related purposes only.
              </p>

              <p>
                The consent remains valid for {CONSENT_DURATION_DAYS} days from
                acceptance and will automatically expire unless renewed through
                a fresh affirmative action.
              </p>

              <p>
                You may withdraw this consent at any time, after which all
                non-legally required processing will cease.
              </p>

              <p>
                Appropriate security safeguards are implemented to protect your
                personal data in accordance with applicable law.
              </p>

              <p>
                For queries or grievances, contact the Data Protection Officer
                at <strong>dpo@examplebank.test</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptConsentPage;
