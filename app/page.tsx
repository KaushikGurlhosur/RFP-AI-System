export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white-900 mb-6">
        AI-Powered RFP Management System
      </h1>
      <p className="text-gray-600 mb-8">
        Streamline your procurement process with AI automation
      </p>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">
          Getting Started
        </h2>
        <ul className="space-y-2 text-gray-700">
          <li>1. Create a new RFP using natural language</li>
          <li>2. Select vendors to send the RFP to</li>
          <li>3. Receive and parse vendor responses automatically</li>
          <li>4. Compare proposals with AI-powered insights</li>
        </ul>
      </div>
    </div>
  );
}
