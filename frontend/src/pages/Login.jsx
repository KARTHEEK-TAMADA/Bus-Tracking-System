import { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'Student', driverCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(''); // Fix #3: Clear error when switching modes
    setFormData({ name: '', email: '', password: '', role: 'Student', driverCode: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const res = await axios.post('/api/auth/login', { email: formData.email, password: formData.password });
        onLogin(res.data.user, res.data.token);
      } else {
        await axios.post('/api/auth/register', formData);
        // Auto-login after registration
        const res = await axios.post('/api/auth/login', { email: formData.email, password: formData.password });
        onLogin(res.data.user, res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      
      {/* Left Branding Panel - visible on all screens */}
      <div className="hidden lg:flex w-1/2 bg-[#1D3557] p-12 flex-col justify-center items-start text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1D3557] via-[#2A4B75] to-[#E63946] opacity-90"></div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-2xl border border-white/20 animate-float">🚌</div>
          <h1 className="text-5xl font-black mb-4 leading-tight tracking-tighter uppercase">VVIT<br/><span className="text-[#E63946]">BTS</span></h1>
          <p className="text-white/70 text-lg max-w-sm font-medium leading-relaxed">The live bus tracking app for VVIT students and staff.</p>
        </div>
        
        <div className="absolute bottom-10 left-10 flex gap-3">
          <div className="w-12 h-1.5 rounded-full bg-[#E63946]"></div>
          <div className="w-4 h-1.5 rounded-full bg-white/20"></div>
          <div className="w-4 h-1.5 rounded-full bg-white/10"></div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="w-full lg:w-1/2 p-6 sm:p-12 md:p-20 flex flex-col justify-center bg-slate-50 relative overflow-hidden">
        
        {/* Mobile branding */}
        <div className="lg:hidden text-center mb-10">
          <div className="flex justify-center mb-4">
            {!logoError ? (
              <img src="/vvit-logo.svg" alt="VVIT Logo" className="h-20 object-contain" onError={() => setLogoError(true)} />
            ) : (
              <div className="w-16 h-16 bg-[#1D3557] text-white rounded-2xl flex items-center justify-center text-2xl shadow-xl border-4 border-white">🚌</div>
            )}
          </div>
          <h2 className="text-3xl font-black text-[#1D3557] tracking-tighter uppercase mt-2">VVIT <span className="text-[#E63946]">BTS</span></h2>
        </div>

        {/* Desktop branding */}
        <div className="mb-8 text-center lg:text-left">
          <div className="hidden lg:flex justify-start mb-4">
            {!logoError && <img src="/vvit-logo.svg" alt="VVIT Logo" className="h-20 object-contain" onError={() => setLogoError(true)} />}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1D3557] mb-1 leading-tight">
            Vasireddy Venkatadri<br/>International Technological University
          </h2>
          <p className="text-[#1D3557]/60 font-semibold text-sm">
            {isLogin ? 'Login to your account' : 'Create an account'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {!isLogin && (
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
              <input type="text" required placeholder="Your full name" autoComplete="name"
                className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1D3557]/30 focus:border-[#1D3557] transition-all font-medium"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
          )}
          
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <input type="email" required placeholder="xxxxxxxxxx@vvit.net" autoComplete="email"
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1D3557]/30 focus:border-[#1D3557] transition-all font-medium"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          <div className="group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <input type="password" required placeholder="Enter your password" autoComplete={isLogin ? "current-password" : "new-password"}
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1D3557]/30 focus:border-[#1D3557] transition-all font-medium"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          </div>

          {!isLogin && (
            <div className="group">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Role</label>
              <div className="relative">
                <select autoComplete="off"
                  className="w-full appearance-none bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1D3557]/30 focus:border-[#1D3557] transition-all font-medium text-slate-700"
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="Student">🎓 Student</option>
                  <option value="Driver">🚌 Bus Driver</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
          )}
          
          {!isLogin && formData.role === 'Driver' && (
            <div className="group animate-in fade-in duration-300">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Driver Admin Code</label>
              <input type="text" required placeholder="Enter driver code"
                className="w-full bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#E63946]/30 focus:border-[#E63946] transition-all font-medium text-slate-700"
                value={formData.driverCode} onChange={e => setFormData({...formData, driverCode: e.target.value})} />
            </div>
          )}
          
          <button disabled={loading} type="submit" className="w-full bg-[#1D3557] hover:bg-[#457B9D] text-white p-3.5 rounded-xl font-bold shadow-lg shadow-[#1D3557]/20 hover:shadow-[#1D3557]/30 hover:-translate-y-0.5 transition-all active:scale-[0.98] mt-2 flex justify-center items-center">
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              isLogin ? 'Login' : 'Register'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <hr className="border-slate-200 mb-4" />
          <p className="text-sm text-slate-500 font-medium">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={toggleMode} className="text-[#E63946] font-bold hover:text-[#D62828] transition-colors underline underline-offset-2">
              {isLogin ? 'Register now' : 'Login here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
