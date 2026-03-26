import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busIcon = new L.DivIcon({
  className: 'custom-bus-icon',
  html: `
    <div style="
      background: linear-gradient(135deg, #E63946, #D62828);
      width: 44px; height: 44px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 15px rgba(230, 57, 70, 0.4);
      border: 3px solid white;
      font-size: 20px;
      position: relative;
    ">
      🚌
      <div style="position: absolute; bottom: -8px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid #D62828;"></div>
    </div>
  `,
  iconSize: [44, 52],
  iconAnchor: [22, 52],
  popupAnchor: [0, -45]
});

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
  
  // Search State
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  // Routing State
  const [selectedBus, setSelectedBus] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'map'
  const [routeStops, setRouteStops] = useState([]);
  const [closestStopId, setClosestStopId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/student/buses');
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
    return () => socket.disconnect();
  }, []);

  // Fetch stops when a bus is selected
  useEffect(() => {
    if (selectedBus) {
      const fetchStops = async () => {
        try {
          const res = await axios.get(`/api/student/routes/${selectedBus.route_id}/stops`);
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
      if (!liveData) return;

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

  const center = [16.3433, 80.5242];
  const zoom = 14;

  const filteredBuses = busesInfo.filter(bus => {
    const origin = (bus.start_origin || '').toLowerCase();
    const dest = (bus.end_destination || '').toLowerCase();
    const fromMatch = !searchFrom || origin.includes(searchFrom.toLowerCase());
    const toMatch = !searchTo || dest.includes(searchTo.toLowerCase());
    return fromMatch && toMatch;
  });

  // --------------------------------------------------------------------------
  // MASTER VIEW: SEARCH & LIST (Where is my train - Home Screen)
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
                  placeholder="From Station" 
                  value={searchFrom}
                  onChange={e => setSearchFrom(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl border-2 border-slate-200 focus:border-[#E63946] focus:ring-[#E63946] focus:outline-none transition-all font-medium text-slate-700"
                />
              </div>
              
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">📍</span>
                <input 
                  type="text" 
                  placeholder="To Station" 
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
                 {Object.keys(liveLocations).length > 0 && (
                   <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">{Object.keys(liveLocations).length} Live Now</span>
                 )}
              </div>
              
              <div className="divide-y divide-slate-100">
                {filteredBuses.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 italic">No buses match your search.</div>
                ) : (
                  filteredBuses.map(bus => {
                    const isLive = !!liveLocations[bus.id];
                    return (
                      <div 
                        key={bus.id} 
                        onClick={() => setSelectedBus(bus)}
                        className="p-4 sm:p-5 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center group"
                      >
                         <div>
                            <div className="flex items-center gap-3 mb-2">
                               <h4 className="text-lg font-bold text-[#1D3557]">{bus.bus_number}</h4>
                               {isLive ? (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold uppercase tracking-wide">Live</span>
                               ) : (
                                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase tracking-wide">Scheduled</span>
                               )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 font-medium">{bus.route_name}</p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                               <span>{bus.start_origin || 'Origin'}</span>
                               <span className="text-[#E63946] block rotate-90 sm:rotate-0">➔</span>
                               <span>{bus.end_destination || 'Destination'}</span>
                            </div>
                         </div>
                         <div className="text-slate-300 group-hover:text-[#E63946] group-hover:translate-x-1 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
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

  // --------------------------------------------------------------------------
  // DETAIL VIEW: TIMELINE & MAP (Train Status Detail Screen)
  // --------------------------------------------------------------------------
  const liveData = liveLocations[selectedBus.id];

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] sm:h-[calc(100vh-76px)] bg-slate-50 w-full">
      
      {/* Detail Header */}
      <div className="bg-[#025199] text-white p-4 shadow-md z-20 flex flex-col pt-4 pb-0">
         <div className="flex items-center justify-between mb-4">
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
            {liveData && (
              <span className="flex h-3 w-3 relative mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              </span>
            )}
         </div>

         {/* View Toggles underneath header */}
         <div className="flex gap-4">
            <button 
              onClick={() => setViewMode('timeline')}
              className={`pb-3 px-2 text-sm font-bold border-b-4 transition-all ${viewMode === 'timeline' ? 'border-[#E63946] text-white' : 'border-transparent text-blue-200 hover:text-white'}`}
            >
              📍 Route Timeline
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={`pb-3 px-2 text-sm font-bold border-b-4 transition-all ${viewMode === 'map' ? 'border-[#E63946] text-white' : 'border-transparent text-blue-200 hover:text-white'}`}
            >
              🗺️ Live Map
            </button>
         </div>
      </div>

      {/* Detail Body */}
      <div className="flex-1 relative overflow-hidden bg-white">
        
        {viewMode === 'map' ? (
          <div className="absolute inset-0 z-0">
            <MapContainer center={center} zoom={zoom} zoomControl={false} scrollWheelZoom={true} className="w-full h-full">
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <ZoomControl position="bottomright" />
              
              {/* Show All Route Stops as small markers */}
              {routeStops.map(stop => (
                <Marker key={stop.id} position={[stop.latitude, stop.longitude]} icon={new L.DivIcon({
                  className: 'bg-white border-4 border-[#1D3557] rounded-full w-3 h-3 shadow-md',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8]
                })} />
              ))}
              
              {/* Current Live Bus Marker */}
              {liveData && (
                <Marker position={[liveData.lat, liveData.lng]} icon={busIcon}>
                  <Popup className="premium-popup">
                    <div className="p-1 min-w-[150px]">
                      <div className="text-[10px] uppercase font-bold text-[#E63946] tracking-wider mb-1">Live Location</div>
                      <strong className="block text-xl text-[#1D3557] tracking-tight leading-none mb-2">{selectedBus.bus_number}</strong>
                      <p className="text-xs text-slate-500">Updated just now</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-4 sm:p-8 max-w-3xl mx-auto custom-scrollbar">
             <div className="relative border-l-4 border-slate-200 ml-[80px] sm:ml-[120px] py-10 my-4 space-y-16">
                    
              {routeStops.length === 0 ? (
                <div className="pl-8 text-slate-500 italic">No scheduled stops available for this route.</div>
              ) : (
                routeStops.map((stop, index) => {
                  const isClosest = closestStopId === stop.id;
                  
                  return (
                    <div key={stop.id} className="relative flex items-center">
                      
                      {/* Sequence / Distance equivalent */}
                      <div className="absolute -left-[80px] sm:-left-[120px] w-[60px] sm:w-[100px] text-right pr-4">
                        <span className="block text-sm sm:text-base font-bold text-[#1D3557]">Seq {stop.sequence_order}</span>
                        {isClosest && <span className="block text-xs font-bold text-[#E63946]">Current</span>}
                      </div>
                      
                      {/* The Node */}
                      <div className="absolute -left-[14px] flex items-center justify-center">
                        {isClosest ? (
                          <div className="z-10 bg-white p-1 rounded-full shadow-lg border border-[#025199] relative">
                            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping scale-150 opacity-40"></div>
                            <div className="text-xl relative z-10 w-6 h-6 flex items-center justify-center bg-[#025199] rounded-full text-white text-xs">🚌</div>
                          </div>
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-4 border-white shadow-sm z-0 ${liveData && stop.sequence_order < (routeStops.find(s=>s.id===closestStopId)?.sequence_order || 0) ? 'bg-[#E63946]' : 'bg-slate-300'}`}></div>
                        )}
                      </div>
                      
                      {/* Stop Detail Row */}
                      <div className="ml-8 sm:ml-12 w-full pr-4 pb-2">
                        <h3 className={`text-base sm:text-lg font-bold ${isClosest ? 'text-[#025199]' : 'text-slate-700'}`}>{stop.name}</h3>
                        
                        {/* The Floating Status Box exactly like Train App */}
                        {isClosest && liveData && (
                          <div className="mt-3 bg-[#025199] text-white p-3 sm:p-4 rounded-xl shadow-md relative max-w-sm ml-0">
                            <div className="absolute -left-2 top-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-[#025199] hidden sm:block"></div>
                            <div className="absolute top-[-8px] left-6 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-[#025199] block sm:hidden"></div>
                            <div className="flex items-center gap-2 mb-1">
                               <p className="font-bold text-sm sm:text-base tracking-wide">Last location: {stop.name}</p>
                            </div>
                            <p className="text-xs text-blue-100 font-mono tracking-wider">
                              Updated {Math.floor((Date.now() - liveData.timestamp) / 1000)}s ago
                            </p>
                          </div>
                        )}
                      </div>
                      
                    </div>
                  )
                })
              )}
              
            </div>
          </div>
        )}
      </div>

      <style>{`
        .premium-popup .leaflet-popup-content-wrapper { border-radius: 16px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15); padding: 8px; }
        .premium-popup .leaflet-popup-tip { box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15); }
      `}</style>
    </div>
  );
}
