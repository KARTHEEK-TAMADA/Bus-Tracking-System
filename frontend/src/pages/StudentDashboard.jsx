import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

// Haversine distance formula to find closest stop
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function StudentDashboard() {
  const [busesInfo, setBusesInfo] = useState([]);
  const [liveLocations, setLiveLocations] = useState({});
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  
  // Search State
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  // Routing State
  const [selectedBus, setSelectedBus] = useState(null);
  const [routeStops, setRouteStops] = useState([]);
  const [closestStopId, setClosestStopId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('/api/student/buses', config);
        setBusesInfo(res.data);
      } catch (err) {
        console.error("Failed to fetch bus routes", err);
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const socket = io(window.location.origin.includes('localhost') ? 'http://localhost:5000' : '/');
    socket.on('bus_location_update', (data) => {
      setLiveLocations(prev => ({ ...prev, [data.busId]: data }));
    });

    const timer = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      socket.disconnect();
      clearInterval(timer);
    };
  }, []);

  // Fetch stops when a bus is selected
  useEffect(() => {
    if (selectedBus) {
      const fetchStops = async () => {
        try {
          const token = localStorage.getItem('token');
          const config = { headers: { Authorization: `Bearer ${token}` } };
          const res = await axios.get(`/api/student/routes/${selectedBus.route_id}/stops`, config);
          setRouteStops(res.data);
        } catch (err) {
          console.error("Failed to fetch route stops", err);
          if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
      };
      fetchStops();
    }
  }, [selectedBus]);

  // Recalculate closest stop continuously
  useEffect(() => {
    if (selectedBus && routeStops.length > 0) {
      const liveData = liveLocations[selectedBus.id];
      if (!liveData || liveData.status === 'ended') {
        setClosestStopId(null);
        return;
      }

      let minDistance = Infinity;
      let closestId = null;

      routeStops.forEach(stop => {
        const dist = calculateDistance(liveData.lat, liveData.lng, stop.latitude, stop.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = stop.id;
        }
      });
      setClosestStopId(closestId);
    }
  }, [liveLocations, selectedBus, routeStops]);

  const filteredBuses = busesInfo.filter(bus => {
    const origin = (bus.start_origin || '').toLowerCase();
    const dest = (bus.end_destination || '').toLowerCase();
    const fromMatch = !searchFrom || origin.includes(searchFrom.toLowerCase());
    const toMatch = !searchTo || dest.includes(searchTo.toLowerCase());
    return fromMatch && toMatch;
  });

  // --------------------------------------------------------------------------
  // MASTER VIEW: SEARCH & LIST (Where is my bus - Home Screen)
  // --------------------------------------------------------------------------
  if (loading && !selectedBus) {
    return (
      <div className="min-h-[calc(100vh-60px)] sm:min-h-[calc(100vh-76px)] bg-slate-50 w-full flex flex-col items-center justify-center">
         <div className="w-10 h-10 border-4 border-[#1D3557] border-t-transparent rounded-full animate-spin"></div>
         <p className="mt-4 text-[#1D3557] font-medium font-bold">Loading buses...</p>
      </div>
    );
  }

  if (!selectedBus) {
    return (
      <div className="min-h-[calc(100vh-60px)] sm:min-h-[calc(100vh-76px)] bg-slate-50 w-full flex flex-col">
        {/* Search Header Container */}
        <div className="bg-[#1D3557] w-full pt-8 pb-16 px-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
          
          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Find Your Bus</h2>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🟢</span>
                <input 
                  type="text" 
                  placeholder="From (e.g., Guntur)" 
                  value={searchFrom}
                  onChange={e => setSearchFrom(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl border-2 border-slate-200 focus:border-[#E63946] focus:ring-[#E63946] focus:outline-none transition-all font-medium text-slate-700"
                />
              </div>
              
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">📍</span>
                <input 
                  type="text" 
                  placeholder="To (e.g., VVIT)" 
                  value={searchTo}
                  onChange={e => setSearchTo(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl border-2 border-slate-200 focus:border-[#E63946] focus:ring-[#E63946] focus:outline-none transition-all font-medium text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 -mt-8 relative z-20 pb-12">
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-bold text-slate-700 text-lg">Buses Found ({filteredBuses.length})</h3>
                {Object.values(liveLocations).filter(l => l.status !== 'ended').length > 0 && (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full shadow-sm animate-pulse">
                    {Object.values(liveLocations).filter(l => l.status !== 'ended').length} Live Now
                  </span>
                )}
            </div>
              
            <div className="space-y-4">
              {filteredBuses.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-slate-200">
                   <div className="text-4xl mb-3 opacity-50">📭</div>
                   <p className="text-slate-500 font-medium">No buses found.</p>
                </div>
              ) : (
                filteredBuses.map(bus => {
                  const isLive = liveLocations[bus.id] && liveLocations[bus.id].status !== 'ended';
                  return (
                    <div 
                      key={bus.id} 
                      onClick={() => setSelectedBus(bus)}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 transition-all duration-400 cursor-pointer flex justify-between items-center group relative overflow-hidden"
                    >
                       {/* Status left indicator border */}
                       <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 ${isLive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-200'}`}></div>
                       
                       <div className="flex items-center gap-5 pl-2">
                          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-xl shadow-inner border border-slate-100 transition-transform duration-300">🚌</div>
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <h4 className="text-xl font-black text-[#1D3557] tracking-tight">{bus.bus_number}</h4>
                                {isLive ? (
                                   <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-emerald-100">Live</span>
                                ) : (
                                   <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-slate-200">Offline</span>
                                )}
                             </div>
                             <p className="text-sm text-slate-600 font-semibold mb-2">{bus.route_name}</p>
                             <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-flex">
                                <span className="text-slate-700">{bus.start_origin || 'Start'}</span>
                                <span className="text-[#E63946] mx-1">➔</span>
                                <span className="text-slate-700">{bus.end_destination || 'End'}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="text-slate-300 transition-all duration-300 pr-2">
                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                          </div>
                       </div>
                    </div>
                  )
                })
              )}
            </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // DETAIL VIEW: TIMELINE ONLY (Live Map Removed)
  // --------------------------------------------------------------------------
  const liveData = liveLocations[selectedBus.id];
  const isTripEnded = liveData?.status === 'ended';

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] sm:h-[calc(100vh-76px)] bg-slate-50 w-full">
      
      {/* Detail Header */}
      <div className="bg-[#1D3557] text-white p-4 shadow-md z-20 flex flex-col pt-4 pb-4">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedBus(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
              </button>
              <div>
                <h2 className="text-lg font-bold tracking-tight">{selectedBus.bus_number}</h2>
                <p className="text-xs text-blue-200">{selectedBus.start_origin || 'Start'} ➔ {selectedBus.end_destination || 'End'}</p>
              </div>
            </div>
            {liveData && !isTripEnded && (
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Live Tracking</span>
              </div>
            )}
            {isTripEnded && (
              <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-200 px-3 py-1.5 rounded-full border border-red-500/30">Finished</span>
            )}
            {!liveData && (
              <span className="text-[10px] font-bold uppercase bg-white/10 text-blue-100 px-3 py-1.5 rounded-full border border-white/20">Not Running</span>
            )}
         </div>
      </div>

      {/* Detail Body */}
      <div className="flex-1 relative overflow-y-auto bg-white custom-scrollbar">
        <div className="h-full p-4 sm:p-8 max-w-3xl mx-auto">
             <div className="relative border-l-4 border-slate-100 ml-[80px] sm:ml-[120px] py-10 my-4 space-y-8">
                    
              {routeStops.length === 0 ? (
                <div className="pl-8 text-slate-500 italic">No stops added to this bus yet.</div>
              ) : (
                routeStops.map((stop, index) => {
                  const isClosest = closestStopId === stop.id;
                  const isPast = liveData && !isTripEnded && stop.sequence_order < (routeStops.find(s=>s.id===closestStopId)?.sequence_order || 0);

                  return (
                    <div key={stop.id} className="relative flex items-center">
                      
                      {/* Sequence Number */}
                      <div className="absolute -left-[80px] sm:-left-[120px] w-[60px] sm:w-[100px] text-right pr-4">
                        <span className="block text-sm sm:text-base font-bold text-[#1D3557]">Stop {stop.sequence_order}</span>
                        {isClosest && <span className="block text-[10px] font-extrabold text-[#E63946] uppercase tracking-tighter">Live</span>}
                      </div>
                      
                      {/* Timeline Node */}
                      <div className="absolute -left-[14px] flex items-center justify-center">
                        {isClosest ? (
                          <div className="z-10 bg-white p-1 rounded-full shadow-lg border border-[#1D3557] relative">
                            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping scale-150 opacity-40"></div>
                            <div className="text-xl relative z-10 w-6 h-6 flex items-center justify-center bg-[#1D3557] rounded-full text-white text-[10px]">🚌</div>
                          </div>
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-4 border-white shadow-sm z-0 ${isPast ? 'bg-[#E63946]' : 'bg-slate-200'}`}></div>
                        )}
                      </div>
                      
                      {/* Stop Detail Content */}
                      <div className="ml-8 sm:ml-12 w-full pr-4 pb-2">
                        <h3 className={`text-base sm:text-lg font-bold ${isClosest ? 'text-[#1D3557]' : 'text-slate-700'}`}>{stop.name}</h3>
                        
                        {/* Live Info Card */}
                        {isClosest && liveData && !isTripEnded && (
                          <div className="mt-3 bg-[#1D3557] text-white p-3 sm:p-4 rounded-xl shadow-md relative max-w-sm animate-[slideUp_0.3s_ease-out]">
                            <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-[#1D3557] hidden sm:block"></div>
                            <div className="absolute top-[-8px] left-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-[#1D3557] block sm:hidden"></div>
                            <div className="flex items-center gap-2 mb-1">
                               <p className="font-bold text-sm sm:text-base tracking-wide">Near: {stop.name}</p>
                            </div>
                            <p className="text-[10px] text-blue-100 font-mono tracking-wider">
                              Updated {Math.max(0, Math.floor((now - (liveData.timestamp || now)) / 1000))}s ago
                            </p>
                          </div>
                        )}

                        {isPast && (
                          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">✓ Passed</p>
                        )}
                      </div>
                      
                    </div>
                  )
                })
              )}
              
            </div>
          </div>
      </div>
    </div>
  );
}
