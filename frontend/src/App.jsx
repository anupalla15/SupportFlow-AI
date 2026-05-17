import { FaRobot, FaTicketAlt, FaChartBar } from "react-icons/fa";

function App() {
  return (
    <div className="flex h-screen bg-[#0B0F19] text-white">

      {/* Sidebar */}
      <div className="w-64 bg-[#111827] p-6 hidden md:flex flex-col">
        <h1 className="text-2xl font-bold text-cyan-400 mb-10">
          SupportFlow AI
        </h1>

        <nav className="space-y-6">
          <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400 transition">
            <FaRobot />
            <span>AI Chat</span>
          </div>

          <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400 transition">
            <FaTicketAlt />
            <span>Tickets</span>
          </div>

          <div className="flex items-center gap-3 cursor-pointer hover:text-cyan-400 transition">
            <FaChartBar />
            <span>Analytics</span>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Topbar */}
        <div className="h-16 bg-[#111827] border-b border-gray-800 flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold">
            Autonomous Support Intelligence Platform
          </h2>

          <button className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-lg transition">
            Admin
          </button>
        </div>

        {/* Dashboard */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-[#111827] p-6 rounded-2xl shadow-lg border border-gray-800">
            <h3 className="text-gray-400 mb-2">Total Tickets</h3>
            <p className="text-3xl font-bold">1,248</p>
          </div>

          <div className="bg-[#111827] p-6 rounded-2xl shadow-lg border border-gray-800">
            <h3 className="text-gray-400 mb-2">AI Resolution Rate</h3>
            <p className="text-3xl font-bold">92%</p>
          </div>

          <div className="bg-[#111827] p-6 rounded-2xl shadow-lg border border-gray-800">
            <h3 className="text-gray-400 mb-2">Urgent Escalations</h3>
            <p className="text-3xl font-bold">38</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-6">
          <div className="bg-[#111827] h-full rounded-2xl border border-gray-800 p-6 flex flex-col justify-between">

            <div>
              <div className="mb-4">
                <div className="bg-cyan-500 text-black inline-block px-4 py-2 rounded-2xl">
                  Hello! How can I assist you today?
                </div>
              </div>

              <div className="text-right">
                <div className="bg-gray-700 inline-block px-4 py-2 rounded-2xl">
                  My payment failed and I need help.
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <input
                type="text"
                placeholder="Ask SupportFlow AI..."
                className="flex-1 bg-[#0B0F19] border border-gray-700 rounded-xl px-4 py-3 outline-none"
              />

              <button className="bg-cyan-500 hover:bg-cyan-600 px-6 rounded-xl transition">
                Send
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default App;