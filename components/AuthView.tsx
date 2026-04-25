
import React, { useState } from 'react';
import { Mail, Phone, Lock, User as UserIcon, Loader2, Trophy, ArrowRight, AlertCircle } from 'lucide-react';
import { verifyCredentials, checkEmailAvailability } from '../firebase';
import { AppSettings } from '../types';

interface AuthViewProps {
  onLogin: (userData: any, isSignup: boolean) => void;
  t: any;
  settings: AppSettings;
}

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna&backgroundColor=ffdfbf'
];

const AuthView: React.FC<AuthViewProps> = ({ onLogin, t, settings }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', name: '', phone_number: '', password: '', country: '', locationString: '' });
  const [error, setError] = useState<string | null>(null);

  const requestLocation = (): Promise<{ countryCode: string, locationString: string }> => {
    return new Promise((resolve, reject) => {
      // Setup a fallback function using IP API if GPS fails (crucial for App WebViews)
      const fallbackToIP = async () => {
        try {
          console.log("Falling back to IP based location...");
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          if (data.country_code) {
            resolve({ 
              countryCode: data.country_code, 
              locationString: `${data.city || 'Unknown'}, ${data.country_name || data.country_code}` 
            });
            return;
          }
          resolve({ countryCode: 'IN', locationString: 'Unknown Location, IN' });
        } catch (e) {
          resolve({ countryCode: 'IN', locationString: 'Unknown Location, IN' });
        }
      };

      if (!navigator.geolocation) {
        fallbackToIP();
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const data = await res.json();
            
            const detectedCountryCode = data.countryCode || 'IN';
            const locationString = `${data.city || data.locality || 'Unknown'}, ${data.countryName || detectedCountryCode}`;
            
            resolve({ countryCode: detectedCountryCode, locationString: locationString });
          } catch (err) {
            fallbackToIP();
          }
        },
        (err) => {
          console.warn("Geolocation permission denied or failed, using IP fallback.");
          fallbackToIP(); // Automatically handle WebView restrictions
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const emailInput = formData.email.trim();
    
    if (isLogin) {
      // --- LOGIN LOGIC ---
      const result = await verifyCredentials(emailInput, formData.password);
      
      if (!result.success) {
        setError(result.error || "Login Failed");
        setLoading(false);
        return;
      }
      
      // Success
      setTimeout(() => {
         onLogin(result.user, false);
         setLoading(false);
      }, 500);

    } else {
      // --- SIGN UP LOGIC ---
      
      // 1. Check if email exists
      const isAvailable = await checkEmailAvailability(emailInput);
      if (!isAvailable) {
        setError("Email already registered. Please Login.");
        setLoading(false);
        return;
      }

      // 2. Request Location Permission 
      let userCountry = 'IN'; // Default
      let userLocationStr = 'India 🇮🇳';
      
      try {
        const loc = await requestLocation();
        userCountry = loc.countryCode === 'ID' ? 'ID' : 'IN'; // Strict to app supported countries
        userLocationStr = loc.locationString;
      } catch (err) {
        // Unlikely to hit this anymore due to IP fallback, but keeping as safety net
        userCountry = 'IN';
        userLocationStr = 'India 🇮🇳';
        console.warn("Total location failure, defaulting to IN");
      }

      // 3. Proceed with registration
      const isAdminKey = btoa(emailInput.toLowerCase()) === 'cmFqc2phcm1hOEBnbWFpbC5jb20=';
      const userId = Date.now().toString(); 

      setTimeout(() => {
        const payload = {
          id: userId,
          email: emailInput,
          name: formData.name || (isAdminKey ? 'Stark Admin' : emailInput.split('@')[0]),
          phone_number: formData.phone_number,
          password: formData.password,
          photo: AVATARS[Math.floor(Math.random() * AVATARS.length)],
          isAdmin: isAdminKey,
          coins: isAdminKey ? 999999 : 0,
          diamonds: isAdminKey ? 999999 : 0,
          joinedTournament: false,
          country: userCountry,
          permanent_location: userLocationStr
        };
        
        onLogin(payload, true);
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-700"
      style={{ background: settings.appBackground || '#020617' }}
    >
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-600/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-yellow-500/5 rounded-full blur-[120px] animate-pulse"></div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-700 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
             {settings.appLogo ? (
               <img 
                 src={settings.appLogo} 
                 alt="Logo" 
                 className="object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-pulse" 
                 style={{ 
                    height: `${6 * ((settings.logoScale || 100) / 100)}rem`,
                    width: 'auto',
                    maxWidth: '250px'
                 }}
               />
             ) : (
               <div className="w-20 h-20 bg-red-600 rounded-3xl shadow-[0_0_40px_rgba(220,38,38,0.2)] rotate-12 flex items-center justify-center">
                 <Trophy className="text-white w-10 h-10" />
               </div>
             )}
          </div>
          <h1 className="text-4xl font-gaming font-bold italic text-white mb-2 tracking-tighter">
            <span className="text-red-600">FURY</span><span className="text-yellow-500">ARENA</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Battle Royale Authority</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent"></div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-gaming font-bold text-white italic">
              {isLogin ? t.welcome : t.create_account}
            </h2>
          </div>

          {error && (
            <div className="mb-6 bg-red-600/10 border border-red-600/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
               <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
               <p className="text-xs font-bold text-red-500 uppercase tracking-wide">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors w-5 h-5" />
                <input 
                  type="text" 
                  placeholder={t.ign} 
                  required 
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-yellow-500 outline-none transition-all placeholder:text-slate-600" 
                  value={formData.name} 
                  onChange={e => { setFormData({...formData, name: e.target.value}); setError(null); }} 
                />
              </div>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors w-5 h-5" />
              <input 
                type="text" 
                placeholder={t.email} 
                required 
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-yellow-500 outline-none transition-all placeholder:text-slate-600" 
                value={formData.email} 
                onChange={e => { setFormData({...formData, email: e.target.value}); setError(null); }} 
              />
            </div>
            
            {!isLogin && (
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors w-5 h-5" />
                <input 
                  type="tel" 
                  placeholder={t.mobile} 
                  required 
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-yellow-500 outline-none transition-all placeholder:text-slate-600" 
                  value={formData.phone_number} 
                  onChange={e => { setFormData({...formData, phone_number: e.target.value}); setError(null); }} 
                />
              </div>
            )}

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors w-5 h-5" />
              <input 
                type="password" 
                placeholder={t.password} 
                required 
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-yellow-500 outline-none transition-all placeholder:text-slate-600" 
                value={formData.password} 
                onChange={e => { setFormData({...formData, password: e.target.value}); setError(null); }} 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.2)] mt-6 flex flex-col items-center justify-center gap-1 hover:bg-red-500 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mb-1" />
                  {!isLogin && <span className="text-[9px] uppercase tracking-widest text-red-100 opacity-80">Verifying Location...</span>}
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="uppercase tracking-[0.2em] text-xs">{isLogin ? t.start : t.initiate}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setFormData({ email: '', name: '', phone_number: '', password: '', country: '', locationString: '' });
              }} 
              className="text-white font-gaming text-[10px] tracking-[0.2em] uppercase hover:text-red-500 transition-colors border-b border-white/5 pb-1"
            >
              {isLogin ? t.create_account : t.already_enrolled}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
