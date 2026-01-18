"use client";

import { useState } from "react";

export default function TestVendorsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testGetVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/vendors");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const testCreateVendor = async () => {
    setLoading(true);
    setError(null);
    try {
      const newVendor = {
        name: "Test Vendor Inc.",
        email: `test${Date.now()}@example.com`,
        contactPerson: "John Doe",
        phone: "+1234567890",
        category: ["IT Equipment"],
        notes: "Test vendor for demonstration",
        rating: 4,
      };

      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newVendor),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  // Update app/test-vendors/page.tsx - add RFP test functions
  const testCreateRFP = async () => {
    setLoading(true);
    setError(null);
    try {
      const newRFP = {
        title: "Office Equipment Procurement",
        description:
          "Need 20 laptops with 16GB RAM and 15 monitors 27-inch. Budget is $50,000 total. Need delivery within 30 days. Payment terms should be net 30, and we need at least 1 year warranty.",
        budget: 50000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        terms: {
          payment: "Net 30",
          warranty: "1 year",
          delivery: "Within 30 days",
        },
        status: "draft",
        createdBy: "test@example.com",
      };

      const response = await fetch("/api/rfps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newRFP),
      });

      const data = await response.json();
      setResult(data);

      // Store the RFP ID for future tests
      if (data.success && data.data?._id) {
        localStorage.setItem("testRfpId", data.data._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const testGetRFPs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/rfps");
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Vendor API Tests</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Database Connection Test</h2>
        <a
          href="/api/test-db"
          className="text-blue-600 hover:text-blue-800 underline"
          target="_blank">
          Test MongoDB Connection
        </a>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-3">API Endpoints</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium">GET /api/vendors</h4>
              <p className="text-sm text-gray-600">Fetch all active vendors</p>
              <button
                onClick={testGetVendors}
                disabled={loading}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                Test GET Vendors
              </button>
            </div>

            <div>
              <h4 className="font-medium">POST /api/vendors</h4>
              <p className="text-sm text-gray-600">Create a new vendor</p>
              <button
                onClick={testCreateVendor}
                disabled={loading}
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">
                Test Create Vendor
              </button>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium">GET /api/rfps</h4>
          <p className="text-sm text-gray-600">Fetch all RFPs</p>
          <button
            onClick={testGetRFPs}
            disabled={loading}
            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400">
            Test GET RFPs
          </button>
        </div>

        <div>
          <h4 className="font-medium">POST /api/rfps</h4>
          <p className="text-sm text-gray-600">Create a new RFP</p>
          <button
            onClick={testCreateRFP}
            disabled={loading}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400">
            Test Create RFP
          </button>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Results</h3>
            <button
              onClick={clearResults}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">
              Clear
            </button>
          </div>

          {loading && <div className="text-blue-600">Loading...</div>}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className="mt-4">
              <div className="mb-2">
                <strong>Status:</strong>{" "}
                {result.success ? "✅ Success" : "❌ Failed"}
              </div>
              {result.message && (
                <div className="mb-2">
                  <strong>Message:</strong> {result.message}
                </div>
              )}
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
