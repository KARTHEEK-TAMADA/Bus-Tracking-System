import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form States
  const [routeForm, setRouteForm] = useState({ name: '', start_origin: '', end_destination: '' });
  const [busForm, setBusForm] = useState({ id: null, bus_number: '', driver_id: '', route_id: '', capacity: 40 });
  const [stopForm, setStopForm] = useState({ route_id: '', name: '', sequence_order: '' });
  const [geocoding, setGeocoding] = useState(false);
  
  const [selectedRouteForStops, setSelectedRouteForStops] = useState(null);
  const [routeStops, setRouteStops] = useState([]);

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [resRoutes, resBuses, resDrivers] = await Promise.all([
        axios.get('/api/admin/routes', config),
        axios.get('/api/admin/buses', config),
        axios.get('/api/admin/drivers', config)
      ]);
      
      setRoutes(resRoutes.data);
      setBuses(resBuses.data);
      setDrivers(resDrivers.data);
    } catch (err) {
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Route Handlers
  const handleAddRoute = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post('/api/admin/routes', routeForm, config);
      setRouteForm({ name: '', start_origin: '', end_destination: '' });
      setSuccess('Route added successfully');
      await fetchSummary();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add route');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Delete this route? This will not delete associated buses but may cause errors.')) return;
    clearMessages();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.delete(`/api/admin/routes/${id}`, config);
      setSuccess('Route deleted');
      await fetchSummary();
    } catch (err) {
      setError('Failed to delete route');
    }
  };

  // Stop Handlers
  const fetchStops = async (routeId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      const res = await axios.get(`/api/admin/routes/${routeId}/stops`, config);
      setRouteStops(res.data);
    } catch (err) {
      setError('Failed to fetch stops');
    }
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    clearMessages();
    setGeocoding(true);
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.post('/api/admin/stops', { ...stopForm, route_id: selectedRouteForStops.id }, config);
      setStopForm({ route_id: '', name: '', sequence_order: '' });
      setSuccess('Stop added (coordinates auto-detected)');
      fetchStops(selectedRouteForStops.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add stop. Could not find location.');
    } finally {
      setGeocoding(false);
    }
  };

  // Bus Handlers
  const handleBusSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      if (busForm.id) {
        // Edit functionality would go here if API supported PUT
        // For now, we'll just re-POST or show a message
        setError('Edit Bus API not implemented yet');
      } else {
        await axios.post('/api/admin/buses', busForm, config);
        setSuccess('Bus added successfully');
      }
      setBusForm({ id: null, bus_number: '', driver_id: '', route_id: '', capacity: 40 });
      await fetchSummary();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save bus');
    }
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm('Delete this bus?')) return;
    clearMessages();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
      await axios.delete(`/api/admin/buses/${id}`, config);
      setSuccess('Bus deleted');
      await fetchSummary();
    } catch (err) {
      setError('Failed to delete bus');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#E63946]/30 border-t-[#E63946] rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E63946]/10 flex items-center justify-center text-[#E63946] text-2xl">
            ⚙️
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D3557]">Control Center</h2>
            <p className="text-slate-500 font-medium text-sm">Manage routes, buses, and stops.</p>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-pulse">⚠️ {error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">✅ {success}</div>}
      
      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Routes Management */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl bg-[#E63946]/10 p-2 rounded-xl">🗺️</span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1D3557]">Manage Routes</h3>
          </div>

          <form onSubmit={handleAddRoute} className="space-y-4 mb-6">
            <input placeholder="Route Name (e.g., Campus Express)" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all font-medium" 
              value={routeForm.name} onChange={e => setRouteForm({...routeForm, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="From Origin" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all" 
                value={routeForm.start_origin} onChange={e => setRouteForm({...routeForm, start_origin: e.target.value})} />
              <input placeholder="To Destination" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all" 
                value={routeForm.end_destination} onChange={e => setRouteForm({...routeForm, end_destination: e.target.value})} />
            </div>
            <button className="bg-[#E63946] hover:bg-[#D62828] text-white font-bold py-3 px-4 rounded-xl w-full transition-all active:scale-95 shadow-lg shadow-[#E63946]/20">
              Add Route
            </button>
          </form>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {routes.map(r => (
              <div key={r.id} className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${selectedRouteForStops?.id === r.id ? 'border-[#E63946] bg-[#E63946]/5 shadow-sm' : 'border-slate-100 bg-slate-50'}`}>
                <div className="cursor-pointer flex-1" onClick={() => { setSelectedRouteForStops(r); fetchStops(r.id); }}>
                  <strong className="text-[#1D3557] font-bold block">{r.name}</strong>
                  <span className="text-xs text-slate-500 font-medium">From: {r.start_origin} → To: {r.end_destination}</span>
                </div>
                <div className="flex items-center gap-3">
                   <button onClick={() => { setSelectedRouteForStops(r); fetchStops(r.id); }} className="text-xs font-bold text-[#E63946] hover:underline">Stops</button>
                   <button onClick={() => handleDeleteRoute(r.id)} className="text-slate-300 hover:text-red-500 transition-colors text-lg">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bus Management */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl bg-[#1D3557]/10 p-2 rounded-xl">🚌</span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1D3557]">Manage Buses</h3>
          </div>

          <form onSubmit={handleBusSubmit} className="space-y-4 mb-6">
            <input placeholder="Bus Number (e.g., AP-16-X-1234)" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all font-medium uppercase" 
              value={busForm.bus_number} onChange={e => setBusForm({...busForm, bus_number: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
              <select required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all font-medium text-slate-700"
                value={busForm.driver_id} onChange={e => setBusForm({...busForm, driver_id: e.target.value})}>
                <option value="">Select Driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all font-medium text-slate-700"
                value={busForm.route_id} onChange={e => setBusForm({...busForm, route_id: e.target.value})}>
                <option value="">Select Route</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <input type="number" placeholder="Capacity (e.g., 40)" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all" 
              value={busForm.capacity} onChange={e => setBusForm({...busForm, capacity: e.target.value})} />

            <button className={`${busForm.id ? 'bg-[#457B9D]' : 'bg-[#1D3557]'} hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl w-full transition-all active:scale-95 shadow-lg shadow-[#1D3557]/20`}>
              {busForm.id ? 'Update Bus' : 'Add Bus'}
            </button>
            {busForm.id && <button type="button" onClick={() => setBusForm({ id: null, bus_number: '', driver_id: '', route_id: '', capacity: 40 })} className="w-full text-xs text-slate-400 font-bold hover:text-slate-600">Cancel Edit</button>}
          </form>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {buses.map(b => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex justify-between items-center mb-1">
                  <span className="bg-[#1D3557]/10 text-[#1D3557] text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {b.bus_number}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">Cap: {b.capacity}</span>
                    <button onClick={() => setBusForm({ id: b.id, bus_number: b.bus_number, driver_id: b.driver_id, route_id: b.route_id, capacity: b.capacity })} className="text-slate-400 hover:text-[#1D3557] text-xs font-bold">Edit</button>
                    <button onClick={() => handleDeleteBus(b.id)} className="text-slate-300 hover:text-red-500 transition-colors text-lg">✕</button>
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium text-slate-600 flex flex-col gap-1">
                  <span className="flex items-center gap-2">👨‍✈️ Driver: <b className="text-[#1D3557]">{b.driver_name || 'Unassigned'}</b></span>
                  <span className="flex items-center gap-2">🚏 Route: <b className="text-[#1D3557]">{b.route_name || 'Unassigned'}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Stops Management */}
        {selectedRouteForStops && (
          <div className="lg:col-span-2 bg-slate-100 p-6 sm:p-8 rounded-3xl border-2 border-dashed border-slate-300 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🛑</span>
                  <h3 className="text-xl font-bold text-[#1D3557]">Stops for {selectedRouteForStops.name}</h3>
                </div>
                <form onSubmit={handleAddStop} className="space-y-3">
                  <input placeholder="Stop Name (e.g., Guntur Bus Stand)" required className="white-input" value={stopForm.name} onChange={e => setStopForm({...stopForm, name: e.target.value})} />
                  <input placeholder="Sequence Order (1, 2, 3...)" type="number" required className="white-input" value={stopForm.sequence_order} onChange={e => setStopForm({...stopForm, sequence_order: e.target.value})} />
                  <p className="text-[10px] text-slate-400 italic">📍 Coordinates will be auto-detected from the stop name</p>
                  <button disabled={geocoding} className="w-full bg-[#1D3557] text-white py-3 rounded-xl font-bold hover:bg-[#1D3557]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {geocoding ? (<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Detecting location...</>) : 'Add Stop'}
                  </button>
                </form>
                <button onClick={() => setSelectedRouteForStops(null)} className="mt-4 text-sm text-slate-500 hover:underline">Done managing stops</button>
              </div>
              
              <div className="flex-1">
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold">
                        <th className="pb-3 pl-2">Seq</th>
                        <th className="pb-3">Stop Name</th>
                        <th className="pb-3">Coordinates</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {routeStops.map(s => (
                        <tr key={s.id} className="group">
                          <td className="py-3 pl-2 font-bold text-[#E63946]">{s.sequence_order}</td>
                          <td className="py-3 font-medium text-slate-700">{s.name}</td>
                          <td className="py-3 text-slate-400 font-mono text-xs">{s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}</td>
                          <td className="py-3 text-right pr-2">
                             {/* Delete stop functionality could be added here */}
                          </td>
                        </tr>
                      ))}
                      {routeStops.length === 0 && <tr><td colSpan="4" className="py-8 text-center text-slate-400 italic">No stops defined for this route.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`
        .white-input { background: white; border: 1px solid #e2e8f0; padding: 12px; border-radius: 12px; width: 100%; outline: none; transition: border-color 0.2s; }
        .white-input:focus { border-color: #1D3557; }
      `}</style>
    </div>
  );
}
