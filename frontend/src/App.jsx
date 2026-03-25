import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  const [user, setUser] = useState(null);

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
              <div className="flex-shrink-0 cursor-pointer">
                <img src="/vvit-logo.svg" alt="VVIT" className="h-14 sm:h-20 object-contain" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
              </div>
              
              {/* Right Menu Items */}
              <div className="flex items-center gap-2 sm:gap-5">
                {/* User Info Pill */}
                <div className="bg-[#f27461] hover:bg-[#e06553] text-white px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-full font-medium text-xs sm:text-base tracking-wide shadow-sm transition-colors cursor-default flex items-center gap-1 sm:gap-2">
                  <span className="max-w-[80px] sm:max-w-none truncate">{user.name}</span>
                  <span className="opacity-80 font-normal hidden xs:inline">| {user.role}</span>
                </div>
                
                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-full border-[1.5px] border-[#f27461] text-[#f27461] font-bold text-xs sm:text-base flex items-center justify-center hover:bg-[#f27461] hover:text-white transition-all active:scale-95"
                >
                  Logout
                </button>
              </div>

            </div>
            
            {/* Split Bottom Border (Coral/Grey) */}
            <div className="w-full flex h-[3px]">
               <div className="bg-[#f27461] w-1/4 sm:w-[22%]"></div>
               <div className="bg-[#595959] w-3/4 sm:w-[78%]"></div>
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
      </div>
    </BrowserRouter>
  );
}

export default App;
