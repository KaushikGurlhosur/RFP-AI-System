"use client";

import { useState } from "react";

export default function TestVendorsPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store created vendor email for email webhook
  const [createdVendorEmail, setCreatedVendorEmail] = useState<string | null>(
    null
  );

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
      const vendorEmail = `testvendor${Date.now()}@example.com`;
      const newVendor = {
        name: "Tech Supplies Inc.",
        email: vendorEmail,
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

      // Store vendor ID AND email for later use
      if (data.success && data.data?._id) {
        localStorage.setItem("testVendorId", data.data._id);
        localStorage.setItem("testVendorEmail", data.data.email);
        setCreatedVendorEmail(data.data.email);
        alert(`Vendor created with email: ${data.data.email}`);
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

  const testCreateRFP = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get vendor ID from localStorage
      const vendorId = localStorage.getItem("testVendorId");

      if (!vendorId) {
        alert("Please create a vendor first using the 'POST Vendor' button");
        setLoading(false);
        return;
      }

      const newRFP = {
        title: "Office Equipment Procurement",
        description:
          "Need 20 laptops with 16GB RAM and 15 monitors 27-inch. Budget is $50,000 total. Need delivery within 30 days. Payment terms should be net 30, and we need at least 1 year warranty.",
        budget: 50000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        terms: {
          payment: "Net 30",
          warranty: "1 year",
          delivery: "Within 30 days",
        },
        status: "sent", // Changed from "draft" to "sent" so vendor can respond
        createdBy: "test@example.com",
        assignedVendors: [vendorId], // CRITICAL: Assign the vendor to the RFP
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

      if (data.success && data.data?._id) {
        localStorage.setItem("testRfpId", data.data._id);
        alert(`RFP created and assigned to vendor`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const testGetProposals = async () => {
    setLoading(true);
    setError(null);
    try {
      const rfpId = localStorage.getItem("testRfpId");
      const url = rfpId ? `/api/proposals?rfpId=${rfpId}` : "/api/proposals";

      const response = await fetch(url);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const testCreateProposal = async () => {
    setLoading(true);
    setError(null);
    try {
      const rfpId = localStorage.getItem("testRfpId");
      const vendorId = localStorage.getItem("testVendorId");

      if (!rfpId || !vendorId) {
        alert("Please create a Vendor and RFP first using the test buttons");
        setLoading(false);
        return;
      }

      const newProposal = {
        rfpId: rfpId,
        vendorId: vendorId,
        rawEmailContent:
          "We propose to supply 20 laptops at $1,200 each and 15 monitors at $300 each. Total: $28,500. Delivery: 15 days. Warranty: 2 years. Payment: Net 45.",
        extractedData: {
          totalPrice: 28500,
          deliveryDays: 15,
          warranty: "2 years",
          paymentTerms: "Net 45",
          specifications: {
            laptops: "16GB RAM, 512GB SSD, Intel i7",
            monitors: "27-inch, 4K resolution",
          },
          complianceScore: 85,
        },
        aiAnalysis: {
          score: 88,
          summary: "Competitive pricing with good warranty terms",
          strengths: ["Below budget", "Fast delivery", "Extended warranty"],
          weaknesses: ["Payment terms longer than requested"],
          recommendations: ["Negotiate payment terms to Net 30"],
        },
      };

      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProposal),
      });

      const data = await response.json();
      setResult(data);

      if (data.success && data.data?._id) {
        localStorage.setItem("testProposalId", data.data._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const testEmailWebhook = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get vendor email from localStorage
      const vendorEmail = localStorage.getItem("testVendorEmail");

      if (!vendorEmail) {
        alert("Please create a vendor first to get the email");
        setLoading(false);
        return;
      }

      const testEmail = {
        from: vendorEmail, // Use the actual vendor email
        subject: "Re: RFP Office Equipment Procurement",
        text: `Dear Procurement Manager,

We are pleased to submit our proposal for your RFP.

20 Laptops with 16GB RAM: $24,000 ($1,200 each)
15 27-inch Monitors: $4,500 ($300 each)
Total: $28,500

Delivery: 20 business days
Warranty: 18 months
Payment Terms: Net 30

All equipment includes standard warranty and technical support.

Best regards,
Tech Supplies Inc.`,
        html: `<p>Dear Procurement Manager,</p>
<p>We are pleased to submit our proposal for your RFP.</p>
<p><strong>20 Laptops with 16GB RAM:</strong> $24,000 ($1,200 each)<br>
<strong>15 27-inch Monitors:</strong> $4,500 ($300 each)<br>
<strong>Total:</strong> $28,500</p>
<p><strong>Delivery:</strong> 20 business days<br>
<strong>Warranty:</strong> 18 months<br>
<strong>Payment Terms:</strong> Net 30</p>
<p>All equipment includes standard warranty and technical support.</p>
<p>Best regards,<br>
Tech Supplies Inc.</p>`,
        attachments: [],
      };

      const response = await fetch("/api/email-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testEmail),
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

  const clearLocalStorage = () => {
    localStorage.removeItem("testRfpId");
    localStorage.removeItem("testVendorId");
    localStorage.removeItem("testVendorEmail");
    localStorage.removeItem("testProposalId");
    setCreatedVendorEmail(null);
    alert("Local storage cleared");
  };

  const checkSetup = () => {
    const vendorId = localStorage.getItem("testVendorId");
    const vendorEmail = localStorage.getItem("testVendorEmail");
    const rfpId = localStorage.getItem("testRfpId");

    alert(`Current Setup:
Vendor ID: ${vendorId ? "✓ Set" : "✗ Missing"}
Vendor Email: ${vendorEmail ? "✓ " + vendorEmail : "✗ Missing"}
RFP ID: ${rfpId ? "✓ Set" : "✗ Missing"}

Test in this order:
1. POST Vendor (creates vendor)
2. POST RFP (creates RFP with vendor assigned)
3. POST Proposal OR Email Webhook`);
  };

  // Add a complete workflow test
  const testCompleteWorkflow = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = [];

      // 1. Create Vendor
      const vendorEmail = `workflow${Date.now()}@example.com`;
      const vendorRes = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Workflow Test Vendor",
          email: vendorEmail,
          category: ["IT Equipment"],
        }),
      });
      const vendorData = await vendorRes.json();
      results.push({ step: "Create Vendor", data: vendorData });
      if (!vendorData.success) throw new Error("Failed to create vendor");

      const vendorId = vendorData.data._id;

      // 2. Create RFP with vendor assigned
      const rfpRes = await fetch("/api/rfps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Workflow Test RFP",
          description: "Testing complete workflow",
          status: "sent",
          createdBy: "workflow@test.com",
          assignedVendors: [vendorId],
        }),
      });
      const rfpData = await rfpRes.json();
      results.push({ step: "Create RFP", data: rfpData });
      if (!rfpData.success) throw new Error("Failed to create RFP");

      const rfpId = rfpData.data._id;

      // 3. Test email webhook
      const emailRes = await fetch("/api/email-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: vendorEmail,
          subject: "Re: Workflow Test RFP",
          text: "Proposal: $10,000, 30 days delivery, 1 year warranty.",
        }),
      });
      const emailData = await emailRes.json();
      results.push({ step: "Email Webhook", data: emailData });

      setResult({
        success: true,
        message: "Complete workflow test successful!",
        results: results,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">RFP System API Tests</h1>

      {/* Instructions */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Test Instructions:</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={checkSetup}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm">
            Check Current Setup
          </button>
          <button
            onClick={testCompleteWorkflow}
            disabled={loading}
            className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:opacity-90 disabled:bg-gray-400 text-sm">
            Test Complete Workflow
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Or test manually: 1. POST Vendor → 2. POST RFP → 3. POST Proposal or
          Email Webhook
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Database Connection Test</h2>
        <a
          href="/test-db"
          className="text-blue-600 hover:text-blue-800 underline"
          target="_blank"
          rel="noopener noreferrer">
          Test MongoDB Connection
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Vendor Tests */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Vendor Tests</h3>
          <div className="space-y-3">
            <button
              onClick={testGetVendors}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
              GET Vendors
            </button>
            <button
              onClick={testCreateVendor}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400">
              POST Vendor
            </button>
          </div>
          {createdVendorEmail && (
            <p className="text-xs text-green-600 mt-2">
              Vendor email: {createdVendorEmail}
            </p>
          )}
        </div>

        {/* RFP Tests */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">RFP Tests</h3>
          <div className="space-y-3">
            <button
              onClick={testGetRFPs}
              disabled={loading}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400">
              GET RFPs
            </button>
            <button
              onClick={testCreateRFP}
              disabled={loading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400">
              POST RFP (with vendor)
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Creates RFP with assigned vendor
          </p>
        </div>

        {/* Proposal Tests */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-3">Proposal Tests</h3>
          <div className="space-y-3">
            <button
              onClick={testGetProposals}
              disabled={loading}
              className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:bg-gray-400">
              GET Proposals
            </button>
            <button
              onClick={testCreateProposal}
              disabled={loading}
              className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:bg-gray-400">
              POST Proposal
            </button>
            <button
              onClick={testEmailWebhook}
              disabled={loading}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400">
              Email Webhook
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Use after vendor & RFP created
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
          Clear Results
        </button>
        <button
          onClick={clearLocalStorage}
          className="px-4 py-2 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300">
          Clear All Test Data
        </button>
      </div>

      {/* Results Panel */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Test Results</h3>
          <div className="text-sm text-gray-600">
            {loading && "⏳ Testing..."}
            {!loading && result && "✅ Test Completed"}
            {!loading && error && "❌ Test Failed"}
          </div>
        </div>

        {loading && (
          <div className="text-blue-600 animate-pulse">
            Loading test results...
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="mt-4">
            <div className="mb-3">
              <strong>Status:</strong>{" "}
              {result.success ? "✅ Success" : "❌ Failed"}
            </div>
            {result.message && (
              <div className="mb-3">
                <strong>Message:</strong> {result.message}
              </div>
            )}
            <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto text-sm max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
