
import React, { useState } from 'react';
import { Phone, ArrowRight, Loader2, Trophy } from 'lucide-react';
import { User, AppSettings } from '../types';
import { firebaseSaveUser } from '../firebase';

interface CompleteProfileProps {
  user: User;
  onComplete: (updatedUser: User) => void;
  t: any;
  settings: AppSettings;
}

const CompleteProfile: React.FC<CompleteProfileProps> = ({ user, onComplete, t, settings }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    const updatedUser = {
      ...user,
      phone_number: phoneNumber,
    };

    try {
      await firebaseSaveUser(updatedUser);
      onComplete(updatedUser);
    } catch (err) {
      setError("Failed to save profile. Try again.");
    } finally {
      setLoading(false);
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
            COMPLETE <span className="text-yellow-500">PROFILE</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">One last step to battle</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800/50 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-600/50 to-transparent"></div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-gaming font-bold text-white italic">
              Enter Phone Number
            </h2>
            <p className="text-slate-400 text-xs mt-2">Please provide your mobile number to continue.</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-600/10 border border-red-600/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
               <p className="text-xs font-bold text-red-500 uppercase tracking-wide">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors w-5 h-5" />
              <input 
                type="tel" 
                placeholder="Mobile Number" 
                required 
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-yellow-500 outline-none transition-all placeholder:text-slate-600" 
                value={phoneNumber} 
                onChange={e => { setPhoneNumber(e.target.value); setError(null); }} 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-red-600 text-white font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(220,38,38,0.2)] mt-6 flex items-center justify-center gap-3 hover:bg-red-500 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-xs">CONTINUE</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
