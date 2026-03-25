import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [routeForm, setRouteForm] = useState({ name: '', start_origin: '', end_destination: '' });
  const [busForm, setBusForm] = useState({ bus_number: '', driver_id: '', route_id: '', capacity: 40 });

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const resRoutes = await axios.get('/api/admin/routes', config);
      const resBuses = await axios.get('/api/admin/buses', config);
      const resDrivers = await axios.get('/api/admin/drivers', config);
      
      setRoutes(resRoutes.data);
      setBuses(resBuses.data);
      setDrivers(resDrivers.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleAddRoute = async (e) => {
    e.preventDefault();
    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    await axios.post('/api/admin/routes', routeForm, config);
    setRouteForm({ name: '', start_origin: '', end_destination: '' });
    fetchSummary();
  };

  const handleAddBus = async (e) => {
    e.preventDefault();
    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    await axios.post('/api/admin/buses', busForm, config);
    setBusForm({ bus_number: '', driver_id: '', route_id: '', capacity: 40 });
    fetchSummary();
  };

  const handleDeleteRoute = async (id) => {
    if (!confirm('Delete this route?')) return;
    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    try {
      await axios.delete(`/api/admin/routes/${id}`, config);
      fetchSummary();
    } catch (err) { console.error(err); }
  };

  const handleDeleteBus = async (id) => {
    if (!confirm('Delete this bus?')) return;
    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
    try {
      await axios.delete(`/api/admin/buses/${id}`, config);
      fetchSummary();
    } catch (err) { console.error(err); }
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
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-[#E63946]/10 flex items-center justify-center text-[#E63946] text-2xl">
          ⚙️
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D3557]">Control Center</h2>
          <p className="text-slate-500 font-medium text-sm">Add and manage bus routes and buses.</p>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Routes Management */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl bg-[#E63946]/10 p-2 rounded-xl">🗺️</span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1D3557]">Manage Routes</h3>
          </div>

          <form onSubmit={handleAddRoute} className="space-y-4 mb-6">
            <input placeholder="Route Name (e.g., Campus Express)" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all font-medium" 
              value={routeForm.name} onChange={e => setRouteForm({...routeForm, name: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="From" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all" 
                value={routeForm.start_origin} onChange={e => setRouteForm({...routeForm, start_origin: e.target.value})} />
              <input placeholder="To" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all" 
                value={routeForm.end_destination} onChange={e => setRouteForm({...routeForm, end_destination: e.target.value})} />
            </div>
            <button className="bg-[#E63946] hover:bg-[#D62828] text-white font-bold py-3 px-4 rounded-xl w-full transition-all active:scale-95 shadow-lg shadow-[#E63946]/20">
              Add Route
            </button>
          </form>

          <div className="flex-1 overflow-hidden">
            <h4 className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-3">Routes</h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {routes.map(r => (
                <div key={r.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between group">
                  <div>
                    <strong className="text-[#1D3557] font-bold block">{r.name}</strong>
                    <span className="text-xs text-slate-500 font-medium">From: {r.start_origin} → To: {r.end_destination}</span>
                  </div>
                  <button onClick={() => handleDeleteRoute(r.id)} className="text-slate-300 hover:text-red-500 transition-colors text-lg" title="Delete route">✕</button>
                </div>
              ))}
              {routes.length === 0 && <p className="text-sm text-slate-400 italic">No routes added yet.</p>}
            </div>
          </div>
        </div>

        {/* Bus Management */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col h-full hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl bg-[#1D3557]/10 p-2 rounded-xl">🚌</span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1D3557]">Manage Buses</h3>
          </div>

          <form onSubmit={handleAddBus} className="space-y-4 mb-6">
            <input placeholder="Bus Number (e.g., TS-09-1234)" required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all font-medium uppercase" 
              value={busForm.bus_number} onChange={e => setBusForm({...busForm, bus_number: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
              <select required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all font-medium text-slate-700"
                value={busForm.driver_id} onChange={e => setBusForm({...busForm, driver_id: e.target.value})}>
                <option value="">Assigned Driver</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select required className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-[#1D3557]/30 transition-all font-medium text-slate-700"
                value={busForm.route_id} onChange={e => setBusForm({...busForm, route_id: e.target.value})}>
                <option value="">Assigned Route</option>
                {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <button className="bg-[#1D3557] hover:bg-[#457B9D] text-white font-bold py-3 px-4 rounded-xl w-full transition-all active:scale-95 shadow-lg shadow-[#1D3557]/20">
              Add Bus
            </button>
          </form>

          <div className="flex-1 overflow-hidden">
            <h4 className="font-bold text-slate-500 uppercase tracking-wider text-xs mb-3">Buses</h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {buses.map(b => (
                <div key={b.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="bg-[#1D3557]/10 text-[#1D3557] text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {b.bus_number}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">Cap: 40</span>
                      <button onClick={() => handleDeleteBus(b.id)} className="text-slate-300 hover:text-red-500 transition-colors text-sm" title="Delete bus">✕</button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm font-medium text-slate-600 flex flex-col gap-1">
                    <span className="flex items-center gap-2">👨‍✈️ Driver: <b className="text-[#1D3557]">{b.driver_name || 'Unassigned'}</b></span>
                    <span className="flex items-center gap-2">🚏 Route: <b className="text-[#1D3557]">{b.route_name || 'Unassigned'}</b></span>
                  </div>
                </div>
              ))}
              {buses.length === 0 && <p className="text-sm text-slate-400 italic">No buses added yet.</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
