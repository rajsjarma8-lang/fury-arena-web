
import React, { useState, useEffect, useCallback } from 'react';
import { User, Tournament, AppSettings, AudiencePlayer, TournamentType, AppNotification, Message, RedeemCard } from './types';
import { translations, Language } from './translations';
import { Ban, WifiOff, ExternalLink } from 'lucide-react';
import Header from './components/Header';
import YouTubeBanner from './components/YouTubeBanner';
import PlayVideoBoard from './components/PlayVideoBoard';
import TournamentCard from './components/TournamentCard';
import ProfileView from './components/ProfileView';
import AuthView from './components/AuthView';
import AdminPanel from './components/AdminPanel';
import JoinModal from './components/JoinModal';
import BottomNav from './components/BottomNav';
import RewardsView from './components/RewardsView';
import NotificationsModal from './components/NotificationsModal';
import ChatView from './components/ChatView';
import CompleteProfile from './components/CompleteProfile';
import SplashScreen from './components/SplashScreen';
import AdOverlay from './components/AdOverlay';
import { db, firebaseSaveUser, firebaseLeaveTournament } from './firebase';
import { refreshAds } from './AdSenseService';
import { Country } from './types';
import { AnimatePresence } from 'motion/react';

const firebase = (window as any).firebase;

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'play' | 'gift' | 'profile'>('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [joinTournament, setJoinTournament] = useState<Tournament | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [language, setLanguage] = useState<Language>('en');

  // Sync Language with Country
  useEffect(() => {
    if (user?.country) {
      if (user.country === 'ID') {
        setLanguage('id');
      } else if (user.country === 'IN') {
        // Default to Hindi for India as requested (or English if preferred, but user said English/Hindi)
        // I'll set it to 'hi' for India.
        setLanguage('hi');
      }
    }
  }, [user?.country]);

  // Country State
  const [vpnMessage, setVpnMessage] = useState<string | null>(null);

  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Data State
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [audiencePlayers, setAudiencePlayers] = useState<AudiencePlayer[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    youtubeVideoId: 'dQw4w9WgXcQ',
    playVideoId: '',
    youtubeChannelUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    appLogo: '',
    appBackground: '#020617',
    logoScale: 100
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [redeemStore, setRedeemStore] = useState<RedeemCard[]>([]);

  const t = translations[language];

  // Splash Screen Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // 1. Service Worker Registration & Automatic Permission Request on Load
  useEffect(() => {
    if ('serviceWorker' in navigator && firebase && firebase.messaging) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Show permission popup automatically if it's the first time (default)
          if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
              console.log('Notification permission status:', permission);
            });
          }
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    }
  }, []);

  // 2. Token Generation & Saving (Only when granted and user is logged in)
  useEffect(() => {
    if (user?.id && firebase && firebase.messaging && Notification.permission === 'granted') {
      const messaging = firebase.messaging();
      
      messaging.getToken()
        .then((token: string) => {
          if (token) {
            // Save token to user document
            db.collection("users").doc(user.id).update({
              fcmToken: token
            }).catch((err: any) => console.debug("Token save error:", err));
          }
        })
        .catch((err: any) => console.debug("Messaging token error:", err));

      // Handle foreground messages
      const unsubscribe = messaging.onMessage((payload: any) => {
        console.log('Foreground message received:', payload);
      });

      return () => unsubscribe();
    }
  }, [user?.id]);

  // Load Persisted User
  useEffect(() => {
    const saved = localStorage.getItem('fury_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setShowAuth(false);
      } catch (e) { localStorage.removeItem('fury_user'); }
    }
  }, []);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // VPN Check - Aggressive Detection
  useEffect(() => {
    const detectVPN = async () => {
      let isVpn = false;
      
      const services = [
        { url: 'https://ipapi.co/json/', check: (d: any) => d.security && (d.security.vpn || d.security.proxy) },
        { url: 'https://ipwho.is/', check: (d: any) => d.security && (d.security.vpn || d.security.proxy || d.security.hosting) }
      ];

      for (const service of services) {
        try {
          const response = await fetch(service.url);
          if (response.ok) {
            const data = await response.json();
            if (service.check(data)) {
              isVpn = true;
              break;
            }
          }
        } catch (e) {
          console.debug("VPN service failed:", service.url);
        }
      }

      if (isVpn) {
        setVpnMessage('VPN Detected! Kripya VPN ya Proxy ko band karein. App suraksha ke liye VPN allowed nahi hai.');
      } else {
        setVpnMessage(null);
      }
    };

    detectVPN();
    // Re-check every 5 minutes to prevent turning VPN on after app starts
    const interval = setInterval(detectVPN, 300000);
    return () => clearInterval(interval);
  }, []);

  // Sync Current User Data
  useEffect(() => {
    if (user?.id) {
      const unsub = db.collection("users").doc(user.id).onSnapshot(
        (doc: any) => {
          if (doc.exists) {
            const fresh = { id: doc.id, ...doc.data() } as User;
            setUser(fresh);
            localStorage.setItem('fury_user', JSON.stringify(fresh));
          }
        },
        (error: any) => console.debug("User sync permission denied or error:", error)
      );
      return () => unsub();
    }
  }, [user?.id, showAuth]);

  // Sync Tournaments
  useEffect(() => {
    const unsub = db.collection("tournaments").orderBy("id", "desc").onSnapshot(
      (snap: any) => {
        const list = snap.docs.map((d: any) => d.data() as Tournament);
        setTournaments(list);
      },
      (error: any) => console.debug("Tournaments sync permission denied:", error)
    );
    return () => unsub();
  }, []);

  // Sync Audience
  useEffect(() => {
    const unsub = db.collection("audience_players").onSnapshot(
      (snap: any) => {
        setAudiencePlayers(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AudiencePlayer)));
      },
      (error: any) => console.debug("Audience sync permission denied:", error)
    );
    return () => unsub();
  }, []);

  // Sync Notifications
  useEffect(() => {
    const unsub = db.collection("notifications").orderBy("timestamp", "desc").onSnapshot(
      (snap: any) => {
        setNotifications(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AppNotification)));
      },
      (error: any) => console.debug("Notifications sync permission denied:", error)
    );
    return () => unsub();
  }, []);

  // Sync Settings
  useEffect(() => {
    refreshAds();

    const unsub = db.collection("settings").doc("global").onSnapshot(
      (doc: any) => {
        if (doc.exists) setSettings(doc.data() as AppSettings);
      },
      (error: any) => console.debug("Settings sync permission denied:", error)
    );

    return () => {
      unsub();
    };
  }, []);

  // Sync All Users (Admin Only)
  useEffect(() => {
    if (user?.isAdmin && !showAuth) {
      const unsub = db.collection("users").onSnapshot(
        (snap: any) => {
          setAllUsers(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User)));
        },
        (error: any) => console.debug("Admin users sync permission denied:", error)
      );
      return () => unsub();
    }
  }, [user?.isAdmin, showAuth]);

  // Sync Messages
  useEffect(() => {
    const unsub = db.collection("redeemStore").onSnapshot(
      (snap: any) => {
        setRedeemStore(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as RedeemCard)));
      },
      (error: any) => console.debug("Redeem store sync permission denied:", error)
    );
    return () => unsub();
  }, []);

  // Sync Messages
  useEffect(() => {
    if (showChat && user?.id) {
      const unsub = db.collection("messages")
        .where("userId", "==", user.id)
        .onSnapshot(
          (snap: any) => {
            const msgs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Message));
            msgs.sort((a: Message, b: Message) => a.timestamp - b.timestamp);
            setMessages(msgs);
          },
          (error: any) => console.debug("Messages sync permission denied:", error)
        );
      return () => unsub();
    }
  }, [showChat, user?.id]);

  const handleLogin = async (userData: User, isSignup: boolean) => {
    setUser(userData);
    setShowAuth(false);
    localStorage.setItem('fury_user', JSON.stringify(userData));
    await firebaseSaveUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setShowAuth(true);
    localStorage.removeItem('fury_user');
  };

  const addTournament = async (tn: Tournament) => {
    await db.collection("tournaments").doc(tn.id).set(tn);
  };
  const deleteTournament = async (id: string) => {
    await db.collection("tournaments").doc(id).delete();
  };
  const updateTournament = async (tn: Tournament) => {
    // Update local state immediately for better UX, especially if onSnapshot is slow or failing
    setTournaments(prev => prev.map(t => t.id === tn.id ? tn : t));
    try {
      await db.collection("tournaments").doc(tn.id).set(tn, { merge: true });
    } catch (e) {
      console.debug("Tournament update error:", e);
    }
  };
  const addAudience = async (p: Omit<AudiencePlayer, 'id'>) => {
    const id = Date.now().toString();
    await db.collection("audience_players").doc(id).set({ ...p, id });
  };
  const deleteAudience = async (id: string) => {
    await db.collection("audience_players").doc(id).delete();
  };
  const updateSettings = async (s: AppSettings) => {
    await db.collection("settings").doc("global").set(s, { merge: true });
  };
  const updateAnyUser = async (uid: string, data: Partial<User>) => {
    await db.collection("users").doc(uid).update(data);
  };

  const handleSendMessage = async (text: string, image?: string) => {
    if (!user) return;
    await db.collection("messages").add({
      text,
      image: image || null,
      timestamp: Date.now(),
      userId: user.id,
      isRead: false
    });
  };

  const handleAdComplete = async () => {
    if (!user) return;
    
    setShowAdOverlay(false);
    const today = new Date().toISOString().split('T')[0];
    const isSameDay = user.lastClickDate === today;

    const updatedUser: User = {
      ...user,
      coins: (user.coins || 0) + 10,
      dailyClicks: (isSameDay ? user.dailyClicks || 0 : 0) + 1,
      lastClickDate: today
    };

    setUser(updatedUser);
    localStorage.setItem('fury_user', JSON.stringify(updatedUser));
    await firebaseSaveUser(updatedUser);

    // Start 30-second cooldown
    const endTime = Date.now() + 30000;
    localStorage.setItem(`ad_cooldown_${user.id}`, endTime.toString());
  };

  if (vpnMessage) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
        <div className="absolute w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px] -bottom-48 -right-48 animate-pulse delay-1000"></div>

        <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-red-500/50 p-10 rounded-[3rem] max-w-md space-y-6 relative z-10 shadow-[0_0_50px_rgba(220,38,38,0.2)] scale-in-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pan"></div>
          
          <div className="bg-red-500/20 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-red-500/30">
            <Ban className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
          
          <div>
            <h2 className="text-white font-gaming font-bold italic uppercase text-2xl tracking-tighter mb-1">
              <span className="text-red-500">SECURITY</span> LOCKDOWN
            </h2>
            <div className="h-0.5 w-12 bg-red-500 mx-auto rounded-full mb-4"></div>
          </div>

          <p className="text-slate-300 text-sm font-bold leading-relaxed">
            {vpnMessage}
          </p>
          
          <div className="pt-4 border-t border-slate-800">
             <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.3em] mb-4">Detection ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
             <button 
               onClick={() => window.location.reload()}
               className="w-full py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-xs tracking-widest hover:bg-red-500 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95"
             >
               RETRY CONNECTION
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSplash) return <SplashScreen />;

  if (showAuth) return <AuthView onLogin={handleLogin} t={t} settings={settings} />;

  if (user && !user.phone_number) {
    return (
      <CompleteProfile 
        user={user} 
        onComplete={(updatedUser) => setUser(updatedUser)} 
        t={t} 
        settings={settings} 
      />
    );
  }

  return (
    <div 
      className="min-h-screen text-white relative overflow-x-hidden selection:bg-yellow-500 selection:text-slate-950 transition-colors duration-700"
      style={{ 
        background: settings.appBackground || '#020617',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)'
      }}
    >
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none z-0"></div>
      
      <Header 
        user={user} 
        onAdminClick={() => setShowAdmin(true)} 
        notifications={notifications.filter(n => !n.targetCountry || n.targetCountry === 'BOTH' || n.targetCountry === user?.country)}
        onOpenNotifications={() => setShowNotifications(true)}
        t={t}
        settings={settings}
      />

      <main 
        className="container mx-auto px-4 max-w-2xl relative z-10"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 80px)'
        }}
      >
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <YouTubeBanner videoId={settings.youtubeVideoId} />

            {/* AdSense Leaderboard Slot Top */}
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-2 overflow-hidden min-h-[90px] flex items-center justify-center relative">
               <ins className="adsbygoogle"
                  style={{display:'inline-block',width:'100%',height:'90px'}}
                  data-ad-client="ca-pub-6143426799651234"
                  data-ad-slot="1234567890"></ins>
               <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <span className="text-[8px] text-slate-700 font-bold uppercase tracking-tighter mb-1">AdSense Banner Area</span>
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20"></div>
                  </div>
               </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-gaming font-bold italic tracking-wider text-white flex items-center gap-2">
                  <span className="w-1 h-6 bg-yellow-500 rounded-full shadow-[0_0_10px_#eab308]"></span>
                  {t.tournaments}
                </h2>
                <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                     {tournaments.filter(tn => !tn.targetCountry || tn.targetCountry === 'BOTH' || (user?.country && tn.targetCountry === user.country)).length} ACTIVE
                   </span>
                </div>
              </div>
              
              <div className="space-y-6">
                {tournaments.filter(tn => !tn.targetCountry || tn.targetCountry === 'BOTH' || (user?.country && tn.targetCountry === user.country)).length === 0 ? (
                  <div className="py-20 text-center opacity-50">
                    <p className="font-gaming font-bold italic uppercase tracking-widest text-slate-600">No active battles deployed</p>
                  </div>
                ) : (
                  tournaments.filter(tn => !tn.targetCountry || tn.targetCountry === 'BOTH' || (user?.country && tn.targetCountry === user.country)).map(tn => (
                    <TournamentCard 
                      key={tn.id} 
                      tournament={tn} 
                      t={t}
                      onJoin={() => setJoinTournament(tn)} 
                      isJoined={user?.joinedTournament && user.lastJoinedTournamentId === tn.id}
                      user={user}
                      onCancel={async () => {
                        if (!user) return;
                        await firebaseLeaveTournament(user.id, tn.id);
                        // Let Firebase onSnapshot handle the sync to prevent 2-point jumping.
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'play' && (
          <PlayVideoBoard 
            videoUrl={settings.playVideoId} 
            audiencePlayers={audiencePlayers.filter(ap => !ap.country || ap.country === user?.country)}
            settings={settings}
          />
        )}

        {activeTab === 'gift' && user && (
           <RewardsView 
             user={user} 
             redeemStore={redeemStore}
             settings={settings}
             t={t}
             onUpdateUser={async (u) => {
               setUser(u);
               await firebaseSaveUser(u);
             }}
             onWatchAd={() => setShowAdOverlay(true)}
           />
        )}

        {activeTab === 'profile' && user && (
          <ProfileView 
            user={user} 
            settings={settings}
            onLogout={handleLogout}
            t={t}
            currentLang={language}
            onLangChange={setLanguage}
            onSupportClick={() => setShowChat(true)}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} t={t} />

      {showAdmin && (
        <AdminPanel 
          tournaments={tournaments}
          onAdd={addTournament}
          onDelete={deleteTournament}
          onUpdateTournament={updateTournament}
          audiencePlayers={audiencePlayers}
          onAddAudience={addAudience}
          onDeleteAudience={deleteAudience}
          onBroadcastNotification={async (title, message, targetCountry) => {
            await db.collection("notifications").add({
              title, message, timestamp: Date.now(), isRead: false, targetCountry
            });
          }}
          notifications={notifications}
          onDeleteNotification={async (id) => {
            console.log("App: Deleting notification:", id);
            try {
              await db.collection("notifications").doc(id).delete();
              console.log("App: Notification deleted successfully");
            } catch (err: any) {
              console.error("App: Delete notification failed:", err);
            }
          }}
          settings={settings}
          onUpdateSettings={updateSettings}
          allUsers={allUsers}
          redeemStore={redeemStore}
          onUpdateAnyUser={updateAnyUser}
          onDeleteUser={async (uid) => {
            try {
              await db.collection("users").doc(uid).delete();
            } catch (err) {
              console.error("Delete user failed:", err);
            }
          }}
          onClose={() => setShowAdmin(false)}
        />
      )}

      {joinTournament && user && (
        <JoinModal 
          tournament={joinTournament} 
          user={user} 
          t={t}
          onClose={() => setJoinTournament(null)}
          onSuccess={() => {
            setJoinTournament(null);
            // Removed optimistic UI update here because Firebase onSnapshot handles this reliably
            // and doing it locally causes a temporary flash of 2 points (optimistic + network).
          }}
        />
      )}

      {showNotifications && (
        <NotificationsModal 
          notifications={notifications.filter(n => !n.targetCountry || n.targetCountry === 'BOTH' || n.targetCountry === user?.country)} 
          onClose={() => setShowNotifications(false)} 
          isAdmin={user?.isAdmin}
          t={t}
          onDelete={async (id) => {
            try {
              await db.collection("notifications").doc(id).delete();
            } catch (err: any) {
              console.error("Delete notification failed:", err);
            }
          }}
        />
      )}

      {showChat && user && (
        <ChatView
          user={user}
          messages={messages}
          onSendMessage={handleSendMessage}
          onClose={() => setShowChat(false)}
          t={t}
        />
      )}

      <AnimatePresence>
        {showAdOverlay && (
          <AdOverlay 
            onComplete={handleAdComplete} 
            onClose={() => setShowAdOverlay(false)} 
          />
        )}
      </AnimatePresence>

      {isOffline && (
        <div className="fixed inset-0 z-[9999] bg-[#020617]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute inset-0 bg-red-600 rounded-full blur-[60px] opacity-20 animate-pulse"></div>
            <div className="bg-slate-900 border-2 border-red-500/50 p-8 rounded-full relative z-10 animate-bounce shadow-[0_0_50px_rgba(220,38,38,0.3)]">
              <WifiOff className="w-16 h-16 text-red-500" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-gaming font-bold italic text-white mb-4 tracking-widest uppercase text-center drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            Connection Lost
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs sm:text-sm text-center max-w-sm leading-relaxed border border-slate-800 bg-slate-900/50 p-6 rounded-3xl">
            Aapka internet band hai. Kripya apna data ya Wi-Fi chalu karein taaki game aage badh sake.
          </p>
          <div className="mt-12 flex gap-3 items-center text-red-500 text-xs font-black uppercase tracking-[0.2em]">
             <span className="w-2 h-2 rounded-full bg-red-500 blink-animation"></span> Reconnecting
             <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping delay-75"></span>
             <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping delay-150"></span>
             <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping delay-300"></span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
