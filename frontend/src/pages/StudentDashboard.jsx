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
  if (!selectedBus) {
    return (
      <div className="min-h-[calc(100vh-60px)] sm:min-h-[calc(100vh-76px)] bg-slate-50 w-full flex flex-col">
        {/* Search Header Container */}
        <div className="bg-[#025199] w-full pt-8 pb-16 px-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/4"></div>

          <div className="max-w-2xl mx-auto relative z-10">
            <h2 className="text-2xl font-bold text-white mb-6 tracking-tight">Search Live Buses</h2>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🟢</span>
                <input
                  type="text"
                  placeholder="From Town/Area"
                  value={searchFrom}
                  onChange={e => setSearchFrom(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl border-2 border-slate-200 focus:border-[#E63946] focus:ring-[#E63946] focus:outline-none transition-all font-medium text-slate-700"
                />
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">📍</span>
                <input
                  type="text"
                  placeholder="To VVIT Campus"
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Available Buses ({filteredBuses.length})</h3>
              {Object.values(liveLocations).filter(l => l.status !== 'ended').length > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
                  {Object.values(liveLocations).filter(l => l.status !== 'ended').length} Live Now
                </span>
              )}
            </div>

            <div className="p-3 sm:p-4 space-y-3">
              {filteredBuses.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-slate-400 font-semibold">No buses match your search</p>
                  <p className="text-slate-300 text-xs mt-1">Try a different origin or destination</p>
                </div>
              ) : (
                filteredBuses.map((bus, idx) => {
                  const isLive = liveLocations[bus.id] && liveLocations[bus.id].status !== 'ended';
                  return (
                    <div
                      key={bus.id}
                      onClick={() => setSelectedBus(bus)}
                      style={{ animationDelay: `${idx * 60}ms` }}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(2,81,153,0.12)] hover:border-[#025199]/30 transition-all duration-300 cursor-pointer group relative overflow-hidden animate-[fadeSlideUp_0.4s_ease-out_both]"
                    >
                      {/* Shimmer gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#025199]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                      {/* Accent bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full transition-all duration-300 ${isLive ? 'bg-gradient-to-b from-emerald-400 to-emerald-600' : 'bg-slate-200 group-hover:bg-gradient-to-b group-hover:from-[#025199] group-hover:to-[#1D3557]'}`}></div>

                      <div className="p-4 sm:p-5 pl-5 sm:pl-6 flex items-center gap-4">
                        {/* Bus Icon */}
                        <div className={`shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isLive ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/80 text-emerald-700 border border-emerald-200/60 group-hover:shadow-emerald-100 group-hover:shadow-md' : 'bg-gradient-to-br from-slate-50 to-blue-50 text-[#1D3557] border border-blue-100/60 group-hover:shadow-blue-100 group-hover:shadow-md'}`}>
                          <span className="text-xl sm:text-2xl">🚌</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <h4 className="text-base sm:text-lg font-extrabold text-[#1D3557] tracking-tight">{bus.bus_number}</h4>
                            {isLive ? (
                              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 pl-1.5 pr-2.5 py-0.5 rounded-full border border-emerald-200/60 text-[10px] font-bold uppercase tracking-wider">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                Live
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-slate-200/60">Offline</span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider truncate">{bus.route_name}</p>

                          {/* Route path */}
                          <div className="flex items-center gap-2 mt-3 text-xs sm:text-sm text-slate-600">
                            <span className="font-semibold truncate max-w-[120px] sm:max-w-none">{bus.start_origin || 'Origin'}</span>
                            <div className="flex-1 flex items-center gap-0.5 min-w-[60px] max-w-[120px]">
                              <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-300 to-transparent rounded-full"></div>
                              <span className="text-[10px] shrink-0">🚌</span>
                              <div className="h-[2px] flex-1 bg-gradient-to-l from-[#E63946]/60 to-transparent rounded-full"></div>
                            </div>
                            <span className="font-semibold truncate max-w-[120px] sm:max-w-none text-[#1D3557]">{bus.end_destination || 'Destination'}</span>
                          </div>
                        </div>

                        {/* Arrow CTA */}
                        <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 group-hover:bg-[#025199] text-slate-300 group-hover:text-white transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <style>{`
              @keyframes fadeSlideUp {
                from { opacity: 0; transform: translateY(12px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
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
      <div className="bg-[#025199] text-white p-4 shadow-md z-20 flex flex-col pt-4 pb-4">
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
              <p className="text-xs text-blue-200">{selectedBus.start_origin || 'Origin'} ➔ {selectedBus.end_destination || 'Destination'}</p>
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
            <span className="text-[10px] font-bold uppercase bg-red-500/20 text-red-200 px-3 py-1.5 rounded-full border border-red-500/30">Trip Ended</span>
          )}
        </div>
      </div>

      {/* Detail Body */}
      <div className="flex-1 relative overflow-y-auto bg-white custom-scrollbar">
        <div className="h-full p-4 sm:p-8 max-w-3xl mx-auto">
          <div className="relative border-l-4 border-slate-100 ml-[80px] sm:ml-[120px] py-10 my-4 space-y-16">

            {routeStops.length === 0 ? (
              <div className="pl-8 text-slate-500 italic">No scheduled stops available for this route.</div>
            ) : (
              routeStops.map((stop, index) => {
                const isClosest = closestStopId === stop.id;
                const isPast = liveData && !isTripEnded && stop.sequence_order < (routeStops.find(s => s.id === closestStopId)?.sequence_order || 0);

                return (
                  <div key={stop.id} className="relative flex items-center">

                    {/* Sequence Number */}
                    <div className="absolute -left-[80px] sm:-left-[120px] w-[60px] sm:w-[100px] text-right pr-4">
                      <span className="block text-sm sm:text-base font-bold text-[#1D3557]">Seq {stop.sequence_order}</span>
                      {isClosest && <span className="block text-[10px] font-extrabold text-[#E63946] uppercase tracking-tighter">Live Status</span>}
                    </div>

                    {/* Timeline Node */}
                    <div className="absolute -left-[14px] flex items-center justify-center">
                      {isClosest ? (
                        <div className="z-10 bg-white p-1 rounded-full shadow-lg border border-[#025199] relative">
                          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping scale-150 opacity-40"></div>
                          <div className="text-xl relative z-10 w-6 h-6 flex items-center justify-center bg-[#025199] rounded-full text-white text-[10px]">🚌</div>
                        </div>
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-4 border-white shadow-sm z-0 ${isPast ? 'bg-[#E63946]' : 'bg-slate-200'}`}></div>
                      )}
                    </div>

                    {/* Stop Detail Content */}
                    <div className="ml-8 sm:ml-12 w-full pr-4 pb-2">
                      <h3 className={`text-base sm:text-lg font-bold ${isClosest ? 'text-[#025199]' : 'text-slate-700'}`}>{stop.name}</h3>

                      {/* Live Info Card */}
                      {isClosest && liveData && !isTripEnded && (
                        <div className="mt-3 bg-[#025199] text-white p-3 sm:p-4 rounded-xl shadow-md relative max-w-sm animate-[slideUp_0.3s_ease-out]">
                          <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-[#025199] hidden sm:block"></div>
                          <div className="absolute top-[-8px] left-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-[#025199] block sm:hidden"></div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-sm sm:text-base tracking-wide">At or near: {stop.name}</p>
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
