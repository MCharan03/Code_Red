import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Map, 
  Shield, 
  Activity, 
  Navigation, 
  Truck, 
  Radio, 
  Settings, 
  RefreshCw,
  AlertTriangle,
  Database,
  ChevronRight
} from 'lucide-react';

// --- Mock Data simulating your Django Backend ---



// Simulating navigation/services.py get_smart_route response
const MOCK_ROUTE_DATA = {
  route_id: 'rt-123',
  total_distance: '45.2 km',
  est_duration: '1h 12m',
  avg_risk_score: 2.1,
  weather_condition: 'Heavy Fog',
  segments: [
    { id: 1, start: 'Base Alpha', end: 'Outpost Sierra', distance: '12km', risk: 1, risk_label: 'LOW' },
    { id: 2, start: 'Outpost Sierra', end: 'Choke Point Valley', distance: '8km', risk: 4, risk_label: 'HIGH' },
    { id: 3, start: 'Choke Point Valley', end: 'FOB Delta', distance: '25km', risk: 2, risk_label: 'MODERATE' },
  ]
};

const App = () => {
  // --- State Management ---
  const [activeTab, setActiveTab] = useState('navigation');
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState(new Date(0).toISOString()); // Start from a long time ago
  const [checkpoints, setCheckpoints] = useState([]);
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [calculatedRoute, setCalculatedRoute] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // --- Data Fetching ---
  useEffect(() => {
    // Fetch initial data for checkpoints to populate dropdowns
    const fetchInitialData = async () => {
      if (!isOnline) return;
      try {
        const response = await fetch('/navigation/api/offline-data/');
        const data = await response.json();
        setCheckpoints(data.checkpoints || []);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchInitialData();
  }, [isOnline]);


  // --- Handlers ---

  // Calls /navigation/api/sync/
  const handleSync = async () => {
    if (!isOnline) return;
    setSyncing(true);
    try {
        const response = await fetch('/navigation/api/sync/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ last_sync_timestamp: lastSync })
        });
        const data = await response.json();
        // Here you would merge the updated data into your local state/database
        console.log("Synced data:", data); 
        setLastSync(data.current_server_time);
    } catch (error) {
        console.error("Sync failed:", error);
    } finally {
        setSyncing(false);
    }
  };

  // Calls /navigation/api/get-smart-route/
  const handleCalculateRoute = async () => {
    if (!selectedStart || !selectedEnd) return;
    setIsCalculating(true);
    setCalculatedRoute(null);
    
    try {
        const response = await fetch('/navigation/api/get-smart-route/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                start_checkpoint_id: selectedStart,
                end_checkpoint_id: selectedEnd
            })
        });
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }
        const data = await response.json();
        
        // We're using a mix of real API call and mock data for the visual representation
        // as our backend only returns a basic structure.
        setCalculatedRoute({
            ...MOCK_ROUTE_DATA, // Use mock data for rich visuals
            segments: data.primary_route.segments.map((seg, i) => ({
                ...seg,
                id: i,
                risk: seg.tari_score,
                risk_label: seg.tari_score >= 4 ? 'HIGH' : seg.tari_score >= 2 ? 'MODERATE' : 'LOW',
                start: checkpoints.find(c => c.id === selectedStart)?.name || 'Start',
                end: checkpoints.find(c => c.id === selectedEnd)?.name || 'End',
            }))
        });

    } catch (error) {
        console.error("Route calculation failed:", error);
        // Maybe show an error in the UI
    } finally {
        setIsCalculating(false);
    }
  };

  // --- Components ---

  const RiskBadge = ({ level }) => {
    const colors = {
      1: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      3: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      4: 'bg-red-500/20 text-red-400 border-red-500/50',
      5: 'bg-red-900/40 text-red-500 border-red-500 animate-pulse',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-mono border ${colors[level] || colors[1]} rounded`}>
        TARI: {level}
      </span>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-cyan-500/30">
      
      {/* --- Sidebar Navigation --- */}
      <div className="w-20 lg:w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between backdrop-blur-sm">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
            <Shield className="w-8 h-8 text-cyan-500" />
            <span className="hidden lg:block ml-3 font-bold text-lg tracking-wider text-cyan-500">CONVOY_OPS</span>
          </div>

          <nav className="mt-8 flex flex-col gap-2 px-2">
            {[
              { id: 'navigation', icon: Map, label: 'Navigation' },
              { id: 'convoys', icon: Truck, label: 'Active Convoys' },
              { id: 'comms', icon: Radio, label: 'Comms Relay' },
              { id: 'analytics', icon: Activity, label: 'Intel Analytics' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center p-3 rounded-lg transition-all duration-200 group
                  ${activeTab === item.id 
                    ? 'bg-cyan-950/40 text-cyan-400 border-l-2 border-cyan-400' 
                    : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="hidden lg:block ml-3 font-medium text-sm tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center text-slate-500 hover:text-slate-300 transition-colors w-full justify-center lg:justify-start">
            <Settings className="w-5 h-5" />
            <span className="hidden lg:block ml-3 text-sm">System Config</span>
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        
        {/* Top Header / Status Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              {activeTab === 'navigation' ? 'MISSION PLANNING // ROUTE INTELLIGENCE' : activeTab.toUpperCase()}
            </h2>
            {isCalculating && (
              <span className="text-xs font-mono text-cyan-400 animate-pulse flex items-center">
                <Activity className="w-3 h-3 mr-1" /> CALCULATING OPTIMAL PATH...
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Sync Status Widget */}
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest">Data Sync</span>
                <button 
                  onClick={handleSync}
                  disabled={!isOnline || syncing}
                  className={`p-1 rounded hover:bg-slate-800 ${syncing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`}
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {syncing ? 'SYNCING...' : `LAST: ${lastSync.split('T')[1].split('.')[0]}`}
              </span>
            </div>

            {/* Connection Toggle */}
            <button 
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                isOnline 
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400' 
                  : 'bg-rose-950/30 border-rose-500/50 text-rose-500'
              }`}
            >
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-xs font-bold tracking-wider">{isOnline ? 'ONLINE' : 'OFFLINE MODE'}</span>
            </button>
          </div>
        </header>

        {/* --- Dashboard Content --- */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Control Panel */}
          <div className="w-96 border-r border-slate-800 bg-slate-900/30 p-6 flex flex-col gap-6 overflow-y-auto">
            
            {/* Input Section */}
            <div className="space-y-4">
              <div className="text-xs font-mono text-cyan-500 mb-2 uppercase tracking-widest border-b border-slate-800 pb-1">
                Route Parameters
              </div>
              
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Start Checkpoint</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                  value={selectedStart}
                  onChange={(e) => setSelectedStart(e.target.value)}
                >
                  <option value="">Select Origin...</option>
                  {checkpoints.map(cp => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Target Destination</label>
                <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                  value={selectedEnd}
                  onChange={(e) => setSelectedEnd(e.target.value)}
                >
                  <option value="">Select Destination...</option>
                  {checkpoints.map(cp => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
                </select>
              </div>

              <button 
                onClick={handleCalculateRoute}
                disabled={!selectedStart || !selectedEnd || isCalculating}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_20px_rgba(8,145,178,0.3)]"
              >
                {isCalculating ? (
                  <>Processing Terrain Data...</>
                ) : (
                  <><Navigation className="w-4 h-4" /> GENERATE SMART ROUTE</>
                )}
              </button>
            </div>

            {/* Route Analysis Output */}
            {calculatedRoute && !isCalculating && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="text-xs font-mono text-cyan-500 mb-4 uppercase tracking-widest border-b border-slate-800 pb-1">
                  AI Intelligence Report
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                    <div className="text-xs text-slate-400">Distance</div>
                    <div className="text-xl font-mono text-slate-100">{calculatedRoute.total_distance}</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded border border-slate-700/50">
                    <div className="text-xs text-slate-400">Est. Time</div>
                    <div className="text-xl font-mono text-slate-100">{calculatedRoute.est_duration}</div>
                  </div>
                </div>

                {/* Segments List */}
                <div className="space-y-3">
                  {calculatedRoute.segments.map((seg, idx) => (
                    <div key={seg.id} className="relative pl-6 pb-4 border-l border-slate-700 last:pb-0">
                      <div className="absolute left-[-4px] top-0 w-2 h-2 rounded-full bg-slate-600"></div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-medium text-slate-200">{seg.end}</span>
                        <RiskBadge level={seg.risk} />
                      </div>
                      <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                        <span>{seg.distance}</span>
                        <span>•</span>
                        <span>{seg.risk_label} RISK</span>
                      </div>
                      {seg.risk >= 4 && (
                        <div className="mt-2 text-xs text-amber-500 bg-amber-950/30 p-2 rounded border border-amber-900/50 flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                          Possible Ambush / Steep Terrain
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Mode Indicator (Feature 2) */}
            {!isOnline && (
              <div className="mt-auto bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center gap-3">
                <Database className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="text-sm font-bold text-slate-300">Offline Mode Active</div>
                  <div className="text-xs text-slate-500">Serving cached data from local DB</div>
                </div>
              </div>
            )}
          </div>

          {/* Right Map Area (Visualization) */}
          <div className="flex-1 bg-[#0B1120] relative overflow-hidden group">
            {/* Grid Background Effect */}
            <div className="absolute inset-0" 
              style={{
                backgroundImage: 'linear-gradient(rgba(30, 41, 59, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 41, 59, 0.3) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            ></div>

            {/* Map Content Simulation */}
            <div className="absolute inset-0 flex items-center justify-center">
              {!calculatedRoute ? (
                <div className="text-center opacity-30">
                  <Map className="w-24 h-24 mx-auto text-cyan-900 mb-4" />
                  <h3 className="text-xl font-bold tracking-widest text-cyan-700">AWAITING ROUTE PARAMETERS</h3>
                  <p className="text-sm text-cyan-900 font-mono mt-2">SECURE SATELLITE LINK ESTABLISHED</p>
                </div>
              ) : (
                 <div className="relative w-full h-full p-20">
                    {/* Abstract SVG Map Visualization */}
                    <svg className="w-full h-full overflow-visible">
                      <defs>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* Connecting Lines */}
                      <path 
                        d="M100,300 L300,150 L500,300 L700,100" 
                        fill="none" 
                        stroke="#0e7490" 
                        strokeWidth="2" 
                        strokeDasharray="5,5"
                        opacity="0.3"
                      />

                      {/* Active Route */}
                      <path 
                        d="M100,300 L300,150 L500,300" 
                        fill="none" 
                        stroke="#06b6d4" 
                        strokeWidth="4"
                        filter="url(#glow)"
                        className="animate-pulse"
                      />
                      {/* High Risk Segment */}
                      <path 
                        d="M500,300 L700,100" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="4"
                        filter="url(#glow)"
                      />

                      {/* Nodes */}
                      <circle cx="100" cy="300" r="8" fill="#06b6d4" />
                      <text x="100" y="330" fill="white" fontSize="12" textAnchor="middle" fontFamily="monospace">BASE ALPHA</text>

                      <circle cx="300" cy="150" r="6" fill="#06b6d4" />
                      <text x="300" y="130" fill="white" fontSize="12" textAnchor="middle" fontFamily="monospace">OUTPOST</text>

                      <circle cx="500" cy="300" r="6" fill="#f59e0b" />
                      <text x="500" y="330" fill="#f59e0b" fontSize="12" textAnchor="middle" fontFamily="monospace">CHOKE POINT</text>

                      <circle cx="700" cy="100" r="8" fill="#ef4444" />
                      <text x="700" y="80" fill="#ef4444" fontSize="12" textAnchor="middle" fontFamily="monospace">TARGET</text>
                    </svg>

                    {/* Floating Tactical Info on Map */}
                    <div className="absolute top-10 right-10 bg-black/70 backdrop-blur border border-slate-700 p-4 rounded text-xs font-mono w-48">
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>ELEVATION</span>
                        <span>1,240m</span>
                      </div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>VISIBILITY</span>
                        <span className="text-amber-400">POOR</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>SURFACE</span>
                        <span>GRAVEL</span>
                      </div>
                    </div>
                 </div>
              )}
            </div>
            
            {/* Map Controls */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-2">
               <button className="w-10 h-10 bg-slate-800 border border-slate-600 text-slate-300 rounded hover:bg-slate-700 flex items-center justify-center font-bold">+</button>
               <button className="w-10 h-10 bg-slate-800 border border-slate-600 text-slate-300 rounded hover:bg-slate-700 flex items-center justify-center font-bold">-</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;