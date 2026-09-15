
import React, { useState, useEffect } from 'react';
import { Coins, Zap, Gem, RefreshCw, ArrowRight, Loader2, Banknote, ShieldCheck, Lock, Clock, CheckCircle2, X } from 'lucide-react';
import { User, RedeemCard } from '../types';
import { db } from '../firebase';

interface RewardsViewProps {
  user: User;
  redeemStore: RedeemCard[];
  t: any;
  onUpdateUser: (user: User) => void;
}

const MAX_DAILY_LIMIT = 20;
const EXCHANGE_RATE_COINS = 20;
const EXCHANGE_RATE_GEMS = 1;

const RewardsView: React.FC<RewardsViewProps> = ({ user, redeemStore, t, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{amount: number | string, cost: number, code?: string} | null>(null);
  const [redeemHistory, setRedeemHistory] = useState<any[]>([]);
  const [cooldownTime, setCooldownTime] = useState(0);

  const [paypalModal, setPaypalModal] = useState<{ id: string, diamonds: number, dollars: number } | null>(null);
  const [paypalEmail, setPaypalEmail] = useState("");

  const paypalTiers = [
    { id: 'pp1', diamonds: 5000, dollars: 5 },
    { id: 'pp2', diamonds: 10000, dollars: 10 },
    { id: 'pp3', diamonds: 25000, dollars: 50 },
  ];

  const currencySymbol = user.country === 'ID' ? 'Rp' : (['US', 'GB', 'CA', 'AU', 'EU'].includes(user.country || '') ? '$' : '₹');
  const redeemButtonText = (t.redeem || 'REDEEM').toUpperCase();

  const filteredRedeemStore = redeemStore.filter(card => 
    card.targetCountry === 'BOTH' || card.targetCountry === user.country
  );

  // Mining Logic
  const today = new Date().toISOString().split('T')[0];
  const isSameDay = user.lastClickDate === today;
  const currentDailyClicks = isSameDay ? (user.dailyClicks || 0) : 0;
  const isLimitReached = currentDailyClicks >= MAX_DAILY_LIMIT;
  const miningProgress = (currentDailyClicks / MAX_DAILY_LIMIT) * 100;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownTime]);

  useEffect(() => {
    if (user?.id) {
       const unsub = db.collection("redeem_requests")
         .where("userId", "==", user.id)
         .onSnapshot(
           (snap: any) => {
              const history = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
              history.sort((a: any, b: any) => b.timestamp - a.timestamp);
              setRedeemHistory(history);
           },
           (error: any) => console.debug("Redeem requests permission denied:", error)
         );
       return () => unsub();
    }
  }, [user?.id]);

  const executeRedeemTransaction = async (redeemItem: RedeemCard) => {
    if (processingId !== null) return;
    if (!user || !user.id) return;
    
    setProcessingId(redeemItem.id);
    
    try {
      const firebase = (window as any).firebase;
      const userRef = db.collection("users").doc(user.id);
      const requestRef = db.collection("redeem_requests").doc();

      await db.runTransaction(async (transaction: any) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User record does not exist!");

        const userData = userDoc.data();
        const currentDiamonds = userData.diamonds || 0;

        if (currentDiamonds < redeemItem.diamonds) {
          throw new Error(`Insufficient Diamonds! Server says you have ${currentDiamonds}.`);
        }

        transaction.update(userRef, {
          diamonds: firebase.firestore.FieldValue.increment(-redeemItem.diamonds)
        });

        transaction.set(requestRef, {
           userId: String(user.id),
           userName: user.name || "Unknown",
           amount: redeemItem.amount,
           packName: `${currencySymbol}${redeemItem.amount} Redeem`,
           cost: redeemItem.diamonds,
           imageUrl: redeemItem.imageUrl,
           status: "Pending",
           timestamp: Date.now(),
           country: user.country,
           countryFlag: user.permanent_location ? user.permanent_location.slice(-2) : (user.country === 'IN' ? '🇮🇳' : (user.country === 'ID' ? '🇮🇩' : '🌍')),
           permanent_location: user.permanent_location || (user.country === 'IN' ? 'India 🇮🇳' : (user.country === 'ID' ? 'Indonesia 🇮🇩' : 'Global'))
        });
      });

      onUpdateUser({ ...user, diamonds: (user.diamonds || 0) - redeemItem.diamonds });
      setSuccessData({ amount: redeemItem.amount, cost: redeemItem.diamonds });

    } catch (err: any) {
      console.error(err);
      alert("Transaction Failed: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePayPalSubmit = async () => {
    if (!paypalModal) return;
    if (!paypalEmail || !paypalEmail.includes('@')) return alert("Please enter a valid PayPal email address.");
    if (processingId !== null) return;
    if (!user || !user.id) return;
    
    setProcessingId(paypalModal.id);
    
    try {
      const firebase = (window as any).firebase;
      const userRef = db.collection("users").doc(user.id);
      const requestRef = db.collection("redeem_requests").doc();

      await db.runTransaction(async (transaction: any) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) throw new Error("User record does not exist!");

        const userData = userDoc.data();
        const currentDiamonds = userData.diamonds || 0;

        if (currentDiamonds < paypalModal.diamonds) {
          throw new Error(`Insufficient Diamonds! You need ${paypalModal.diamonds}.`);
        }

        transaction.update(userRef, {
          diamonds: firebase.firestore.FieldValue.increment(-paypalModal.diamonds)
        });

        transaction.set(requestRef, {
           userId: String(user.id),
           userName: user.name || "Unknown",
           amount: paypalModal.dollars,
           packName: `$${paypalModal.dollars} PayPal Withdrawal`,
           cost: paypalModal.diamonds,
           imageUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg", // Generic PayPal logo
           status: "Pending",
           timestamp: Date.now(),
           country: "PayPal",
           countryFlag: '🌍',
           permanent_location: user.permanent_location || "Global",
           paypalEmail: paypalEmail
        });
      });

      onUpdateUser({ ...user, diamonds: (user.diamonds || 0) - paypalModal.diamonds });
      setSuccessData({ amount: `$${paypalModal.dollars} (PayPal)`, cost: paypalModal.diamonds });
      setPaypalModal(null);
      setPaypalEmail("");

    } catch (err: any) {
      console.error(err);
      alert("Transaction Failed: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleCollectCoin = () => {
    if (isLimitReached || loading) return;
    setLoading(true);
    setIsClicked(true);
    
    window.open('https://omg10.com/4/11806796', '_blank');
    
    setTimeout(() => {
        const updatedUser: User = {
          ...user,
          coins: (user.coins || 0) + 10,
          dailyClicks: (isSameDay ? user.dailyClicks || 0 : 0) + 1,
          lastClickDate: today
        };
        onUpdateUser(updatedUser);
        setLoading(false);
        setIsClicked(false);
    }, 1500);
  };

  const handleRedeemClick = (opt: RedeemCard) => {
    if (processingId !== null) return;
    if (!user || !user.id) return alert("User Error");
    if ((user.diamonds || 0) < opt.diamonds) return alert(`Need ${opt.diamonds} diamonds.`);
    
    executeRedeemTransaction(opt);
  };

  const handleQuickExchange = () => {
    if ((user.coins || 0) < EXCHANGE_RATE_COINS) {
       alert(`Insufficient Coins! Need ${EXCHANGE_RATE_COINS}.`);
       return;
    }
    setLoading(true);
    setTimeout(() => {
       onUpdateUser({
          ...user,
          coins: (user.coins || 0) - EXCHANGE_RATE_COINS,
          diamonds: (user.diamonds || 0) + EXCHANGE_RATE_GEMS
       });
       setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Wallet Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center shadow-xl">
          <Coins className="w-8 h-8 text-yellow-500 mb-2 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.coins || 'COINS'}</span>
          <span className="text-2xl font-gaming font-bold text-white italic">{user.coins || 0}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center shadow-xl relative overflow-hidden">
          <Gem className="w-8 h-8 text-cyan-400 mb-2 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.kohinoor || 'DIAMONDS'}</span>
          <span className="text-2xl font-gaming font-bold text-white italic">{user.diamonds || 0}</span>
        </div>
      </div>

      {/* Mining Section */}
      <div className="bg-[#020617] border border-slate-800 rounded-[3rem] p-8 text-center relative overflow-hidden shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-yellow-500/10 px-4 py-1.5 rounded-full border border-yellow-500/20 mb-4">
            <h3 className="text-[10px] font-gaming font-bold text-yellow-500 italic tracking-[0.4em]">STARK CORE v2</h3>
          </div>
          <h2 className="text-white font-gaming font-bold text-lg italic tracking-widest uppercase">{t.mining || 'MINING'}</h2>
        </div>
        
        <div className="relative flex justify-center items-center mb-8">
          <button 
            onClick={handleCollectCoin}
            disabled={isLimitReached || loading}
            className={`group relative w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-500 z-10 overflow-hidden ${
              !isLimitReached
                ? 'bg-gradient-to-tr from-yellow-600 to-yellow-400 shadow-[0_0_50px_rgba(234,179,8,0.25)] active:scale-90 hover:shadow-[0_0_70px_rgba(234,179,8,0.4)]' 
                : 'bg-slate-900 cursor-not-allowed border border-slate-800'
            }`}
          >
            {loading ? (
               <Loader2 className="w-12 h-12 text-slate-950 animate-spin" />
            ) : (
               <Zap className={`w-12 h-12 transition-all duration-500 ${!isLimitReached ? 'text-slate-950' : 'text-slate-800'} ${isClicked ? 'scale-125 rotate-12' : 'scale-100 rotate-0'}`} />
            )}
            
            <span className={`text-[10px] font-black tracking-[0.1em] text-center leading-tight mt-1 ${!isLimitReached ? 'text-slate-950' : 'text-slate-500'}`}>
              {isLimitReached ? 'LIMIT\nREACHED' : loading ? 'MINING...' : 'MINE +10'}
            </span>
          </button>
          {!isLimitReached && <div className="absolute w-24 h-24 bg-yellow-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>}
        </div>

        <div className="max-w-[200px] mx-auto">
           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
              <span>Energy</span>
              <span>{currentDailyClicks}/{MAX_DAILY_LIMIT}</span>
           </div>
           <div className="h-2 w-full bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
              <div 
                 className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
                 style={{ width: `${miningProgress}%` }}
              ></div>
           </div>
        </div>
      </div>

      {/* Exchange & Redeem Sections */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden shadow-xl text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
           <RefreshCw className="w-5 h-5 text-purple-500" />
           <h3 className="text-white font-gaming font-bold italic uppercase">{t.trade || 'TRADE'}</h3>
        </div>
        <button 
          onClick={handleQuickExchange}
          disabled={loading || (user.coins || 0) < EXCHANGE_RATE_COINS}
          className="w-full relative group bg-slate-950 border border-slate-800 hover:border-purple-500/50 rounded-[2rem] p-6 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
           <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col items-center">
                 <Coins className="w-8 h-8 text-yellow-500 mb-2" />
                 <span className="text-white font-bold text-lg">{EXCHANGE_RATE_COINS}</span>
              </div>
              <ArrowRight className="w-6 h-6 text-slate-600" />
              <div className="flex flex-col items-center">
                 <Gem className="w-8 h-8 text-cyan-400 mb-2" />
                 <span className="text-white font-bold text-lg">{EXCHANGE_RATE_GEMS}</span>
              </div>
           </div>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
           <Banknote className="w-5 h-5 text-green-500" />
           <h3 className="text-white font-gaming font-bold italic uppercase tracking-wider">{t.redeem_options || 'REDEEM OPTIONS'}</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {paypalTiers.map((tier) => {
            const canAfford = (user.diamonds || 0) >= tier.diamonds;
            const isProcessing = processingId === tier.id;
            return (
              <div key={tier.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between group shadow-lg transition-all active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-2 flex items-center justify-center">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" 
                      alt={`PayPal $${tier.dollars}`} 
                      className="w-full h-auto object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-gaming font-bold italic text-lg">${tier.dollars}</span>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">PayPal</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Gem className={`w-3.5 h-3.5 ${canAfford ? 'text-cyan-400' : 'text-red-500'}`} />
                      <span className={`text-sm font-bold ${canAfford ? 'text-white' : 'text-red-400'}`}>{tier.diamonds}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase ml-1">{t.kohinoor || 'DIAMONDS'}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setPaypalModal(tier)}
                  disabled={processingId !== null || !canAfford} 
                  className={`h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${canAfford && !isProcessing ? 'bg-white text-slate-950 hover:scale-105 shadow-lg' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : !canAfford ? <Lock className="w-4 h-4" /> : 'WITHDRAW'}
                </button>
              </div>
            );
          })}

          {filteredRedeemStore.map((opt) => {
            const canAfford = (user.diamonds || 0) >= opt.diamonds;
            const isProcessing = processingId === opt.id;
            return (
              <div key={opt.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between group shadow-lg transition-all active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                    <img 
                      src={opt.imageUrl} 
                      alt={`${opt.amount}`} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-gaming font-bold italic text-lg">{currencySymbol}{opt.amount}</span>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{user.country === 'ID' ? 'Saldo' : 'Cash'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Gem className={`w-3.5 h-3.5 ${canAfford ? 'text-cyan-400' : 'text-red-500'}`} />
                      <span className={`text-sm font-bold ${canAfford ? 'text-white' : 'text-red-400'}`}>{opt.diamonds}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase ml-1">{t.kohinoor || 'DIAMONDS'}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleRedeemClick(opt)}
                  disabled={processingId !== null || !canAfford} 
                  className={`h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${canAfford && !isProcessing ? 'bg-white text-slate-950 hover:scale-105 shadow-lg' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : !canAfford ? <Lock className="w-4 h-4" /> : (opt.title ? opt.title.toUpperCase() : redeemButtonText)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 px-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <h3 className="text-white font-gaming font-bold italic uppercase tracking-wider">History</h3>
          </div>
          {redeemHistory.length === 0 ? <p className="text-center text-slate-600 text-xs py-4">No requests found.</p> : (
             <div className="grid grid-cols-1 gap-3">
                {redeemHistory.map((item) => (
                   <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2 animate-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-center">
                         <p className="text-white font-bold text-sm">{item.packName || 'Redeem'} ({currencySymbol}{item.amount})</p>
                         <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${item.status === 'Approved' || item.status === 'Completed' ? 'bg-green-500/20 text-green-500' : (item.status === 'Cancelled' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500')}`}>{item.status || 'Pending'}</span>
                      </div>
                      <div className={`p-3 rounded-xl flex items-center justify-center border ${item.redeem_code ? 'bg-green-900/20 border-green-500/30' : 'bg-slate-950 border-slate-800'}`}>
                         {item.redeem_code ? (
                             <div className="text-center">
                                <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest mb-1">Redeem Code Received</p>
                                <p className="text-lg font-mono font-bold text-white tracking-widest select-all">{item.redeem_code}</p>
                             </div>
                         ) : <p className="text-xs text-slate-500 font-bold uppercase animate-pulse">Wait for team (Max 24h)...</p>}
                      </div>
                   </div>
                ))}
             </div>
          )}
      </div>

      {/* PayPal Modal */}
      {paypalModal && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] p-8 relative shadow-2xl">
               <button onClick={() => setPaypalModal(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
               <h2 className="text-xl font-gaming font-bold text-white italic mb-2">PayPal Withdrawal</h2>
               <p className="text-slate-400 text-xs mb-6">
                  You are exchanging <span className="text-cyan-400 font-bold">{paypalModal.diamonds} Diamonds</span> for <span className="text-green-400 font-bold">${paypalModal.dollars}</span>.
               </p>
               <div className="mb-6">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">PayPal Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. your.email@example.com"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-500 transition-colors"
                  />
               </div>
               <button 
                  onClick={handlePayPalSubmit}
                  disabled={processingId === paypalModal.id}
                  className="w-full py-4 bg-white text-slate-950 font-black rounded-xl uppercase text-xs tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2"
               >
                  {processingId === paypalModal.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CONFIRM WITHDRAWAL'}
               </button>
           </div>
        </div>
      )}

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-green-500/50 w-full max-w-sm rounded-[2.5rem] p-8 text-center relative shadow-[0_0_50px_rgba(34,197,94,0.2)]">
               <button onClick={() => setSuccessData(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
               <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/40 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-slate-950" />
               </div>
               <h2 className="text-2xl font-gaming font-bold text-white italic mb-2">SUCCESS!</h2>
               <p className="text-slate-400 text-xs mb-6">
                  <span className="text-green-400 font-bold">{currencySymbol}{successData.amount}</span> Request Sent.<br/>
                  <span className="text-red-400 font-bold">-{successData.cost}</span> Diamonds Deducted.
               </p>
               
               <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Status</p>
                  <p className="text-yellow-500 font-bold uppercase text-xs">Waiting for Team Verification (Max 24h)</p>
               </div>

               <button 
                  onClick={() => setSuccessData(null)}
                  className="w-full py-4 bg-white text-slate-900 font-black rounded-xl uppercase text-xs tracking-widest hover:scale-105 transition-transform"
               >
                  Close Receipt
               </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default RewardsView;
