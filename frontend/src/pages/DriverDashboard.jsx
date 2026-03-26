import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

export default function DriverDashboard({ user }) {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  
  const socketRef = useRef(null);
  const watchIdRef = useRef(null);

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/student/buses', { headers: { Authorization: `Bearer ${token}` } });
        const myBuses = res.data.filter(b => b.driver_id === user.id);
        setBuses(myBuses);
      } catch (err) {
        console.error("Failed to fetch buses", err);
      }
    };
    fetchBuses();
    return () => stopTracking();
  }, [user.id]);

  const startTracking = () => {
    if (!selectedBus) {
      setError("Please select a bus first");
      return;
    }
    setError('');
    
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location sharing");
      return;
    }

    socketRef.current = io(window.location.origin.includes('localhost') ? 'http://localhost:5000' : '/');
    socketRef.current.emit('driver_start_trip', { driverId: user.id, busId: selectedBus });
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        socketRef.current.emit('driver_update_location', {
          driverId: user.id,
          busId: selectedBus,
          lat: latitude,
          lng: longitude
        });
      },
      (err) => {
        console.error(err);
        setError('Location access denied. Please allow location.');
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    if (socketRef.current) {
      socketRef.current.emit('driver_stop_trip');
      socketRef.current.disconnect();
    }
    setIsTracking(false);
    setLocation(null);
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] p-4 bg-slate-50">
      <div className="bg-white max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col pt-10 relative overflow-hidden">
        
        <div className={`absolute top-0 left-0 w-full h-24 transition-colors duration-500 ease-in-out ${isTracking ? 'bg-[#E63946]' : 'bg-[#1D3557]'}`}></div>

        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-4 text-4xl mt-[-2rem]">
            👨‍✈️
          </div>
          <h2 className="text-2xl font-bold text-[#1D3557] tracking-tight">Driver Terminal</h2>
          <p className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full mt-2">
            ID: {user.id} • {user.name}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        
        {!isTracking ? (
          <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Bus</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-lg outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all font-bold text-slate-700"
                value={selectedBus} onChange={(e) => { setSelectedBus(e.target.value); setError(''); }}
              >
                <option value="" className="font-normal text-slate-500">-- Select Bus --</option>
                {buses.map(b => <option key={b.id} value={b.id}>{b.bus_number}</option>)}
              </select>
            </div>
            
            <button 
              onClick={startTracking}
              className="w-full bg-[#1D3557] hover:bg-[#457B9D] text-white font-bold py-4 px-4 rounded-xl transition-all shadow-xl shadow-[#1D3557]/20 active:scale-95 text-lg flex justify-center items-center gap-2 group"
            >
              Start Trip <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-[fadeIn_0.5s_ease-out] flex flex-col items-center">
            
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full animate-pulse-ring bg-[#E63946]/20"></div>
              <div className="w-16 h-16 bg-[#E63946] rounded-full z-10 flex items-center justify-center shadow-lg shadow-[#E63946]/40">
                <div className="w-8 h-8 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-bold text-xl text-[#E63946] bg-[#E63946]/10 px-4 py-1.5 rounded-full inline-block">SHARING LOCATION</h3>
              <p className="text-sm text-slate-500 font-medium">Your location is live for students on the map.</p>
            </div>
            
            {location ? (
              <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between font-mono text-xs text-slate-600">
                <div className="flex flex-col"><span className="text-slate-400 font-sans uppercase font-bold text-[10px]">Latitude</span>{location.lat.toFixed(6)}</div>
                <div className="flex flex-col items-end"><span className="text-slate-400 font-sans uppercase font-bold text-[10px]">Longitude</span>{location.lng.toFixed(6)}</div>
              </div>
            ) : (
              <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 text-center text-sm font-medium text-slate-500 animate-pulse">
                Getting your location...
              </div>
            )}

            <button 
              onClick={stopTracking}
              className="w-full border-2 border-[#E63946] text-[#E63946] hover:bg-[#E63946]/5 font-bold py-4 px-4 rounded-xl transition-all active:scale-95 text-lg"
            >
              Stop Trip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
