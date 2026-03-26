import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
        
        {/* Responsive Header - VVIT Style */}
        {user && (
          <header className="bg-white sticky top-0 z-50 w-full flex flex-col shadow-sm">
            <div className="flex justify-between items-center px-4 sm:px-8 py-3 w-full bg-white max-w-[1600px] mx-auto">
              
              {/* Left Logo */}
              <div className="flex-shrink-0 cursor-pointer flex items-center">
                {!logoError ? (
                  <img src="/vvit-logo.svg" alt="VVIT Logo" className="h-14 sm:h-20 object-contain" onError={() => setLogoError(true)} />
                ) : (
                  <span className="text-2xl font-black text-[#1D3557] tracking-tight">VVIT<span className="text-[#E63946]">BTS</span></span>
                )}
              </div>
              
              {/* Right Menu Items */}
              <div className="flex items-center gap-2 sm:gap-5">
                {/* User Info Pill */}
                <div className="bg-[#E63946] hover:bg-[#D62828] text-white px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-full font-medium text-xs sm:text-base tracking-wide shadow-sm transition-colors cursor-default flex items-center gap-1 sm:gap-2">
                  <span className="max-w-[80px] sm:max-w-none truncate">{user.name}</span>
                  <span className="opacity-80 font-normal inline border-l border-white/40 pl-1 ml-1 sm:border-none sm:pl-0 sm:ml-0">| {user.role}</span>
                </div>
                
                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full border-[1.5px] border-[#E63946] text-[#E63946] font-bold text-xs sm:text-base flex items-center justify-center hover:bg-[#E63946] hover:text-white transition-all active:scale-95"
                >
                  Logout
                </button>
              </div>

            </div>
            
            {/* Split Bottom Border (Coral/Navy) */}
            <div className="w-full flex h-[3px]">
               <div className="bg-[#E63946] w-1/4 sm:w-[22%]"></div>
               <div className="bg-[#1D3557] w-3/4 sm:w-[78%]"></div>
            </div>
          </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative w-full h-full max-w-[100vw] overflow-x-hidden">
          <Routes>
            <Route path="/" element={
              user ? (
                user.role === 'Admin' ? <Navigate to="/admin" /> :
                user.role === 'Driver' ? <Navigate to="/driver" /> :
                <Navigate to="/student" />
              ) : <Navigate to="/login" />
            } />
            
            <Route path="/login" element={
              user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
            } />
            
            <Route path="/admin" element={
              user?.role === 'Admin' ? <AdminDashboard /> : <Navigate to="/login" />
            } />
            
            <Route path="/driver" element={
              user?.role === 'Driver' ? <DriverDashboard user={user} /> : <Navigate to="/login" />
            } />
            
            <Route path="/student" element={
              user?.role === 'Student' ? <StudentDashboard /> : <Navigate to="/login" />
            } />
          </Routes>
        </main>

        {user && (
          <footer className="w-full bg-white border-t border-slate-200 py-6 mt-auto">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} VVIT Bus Tracking System.</p>
              <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
                <span>Designed for Students & Staff</span>
                <span>•</span>
                <span className="flex items-center gap-1">Powered by <span className="text-[#1D3557] font-bold">VVIT</span></span>
              </div>
            </div>
          </footer>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
