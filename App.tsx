
import React, { useState, useEffect, useCallback } from 'react';
import { User, Tournament, AppSettings, AudiencePlayer, TournamentType, AppNotification, Message, RedeemCard } from './types';
import { translations, Language } from './translations';
import { Ban } from 'lucide-react';
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
import { db, firebaseSaveUser, firebaseLeaveTournament, firebaseAwardReferral } from './firebase';
import { Country } from './types';

const firebase = (window as any).firebase;

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'play' | 'gift' | 'profile'>('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [joinTournament, setJoinTournament] = useState<Tournament | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
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
  const [showCountrySelection, setShowCountrySelection] = useState(false);

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
    // Parse referral code from URL if present
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      sessionStorage.setItem('fury_ref', refCode);
    }

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

  // Automatic Country Detection & VPN Check
  useEffect(() => {
    const detectCountry = async () => {
      if (!user || user.countryLocked) {
        if (vpnMessage) setVpnMessage(null);
        return;
      }

      let countryCode: string | null = null;
      let isVpn = false;

      // Try multiple services for robustness
      const services = [
        'https://ipapi.co/json/',
        'https://ipinfo.io/json',
        'https://api.country.is'
      ];

      for (const service of services) {
        try {
          const response = await fetch(service);
          if (response.ok) {
            const data = await response.json();
            countryCode = data.country_code || data.country;
            
            // VPN check if available (ipapi.co provides this)
            if (data.security && (data.security.vpn || data.security.proxy)) {
              isVpn = true;
            }
            
            if (countryCode) break;
          }
        } catch (e) {
          // Silent fallback
        }
      }

      if (isVpn) {
        setVpnMessage('Please disable VPN to use this app.');
        return;
      }

      if (countryCode) {
        let countryName = countryCode;
        try {
          if (window.Intl && Intl.DisplayNames) {
             const regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
             countryName = regionNames.of(countryCode) || countryCode;
          }
        } catch (err) {
          // ignore Intl error
        }

        const getFlagEmoji = (code: string) => code.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
        const flag = getFlagEmoji(countryCode);
        
        const updatedUser = { 
          ...user, 
          country: countryCode, 
          permanent_location: `${countryName} ${flag}`,
          countryLocked: true 
        };
        setUser(updatedUser);
        localStorage.setItem('fury_user', JSON.stringify(updatedUser));
        await firebaseSaveUser(updatedUser);
      } else {
        // Fallback to manual selection if detection fails or country is unsupported
        setShowCountrySelection(true);
      }
    };

    if (user && !user.countryLocked && !showAuth) {
      detectCountry();
    }
  }, [user?.id, user?.countryLocked, showAuth, vpnMessage]);

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
    const unsub = db.collection("settings").doc("global").onSnapshot(
      (doc: any) => {
        if (doc.exists) setSettings(doc.data() as AppSettings);
      },
      (error: any) => console.debug("Settings sync permission denied:", error)
    );
    return () => unsub();
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

  const handleLogin = async (userData: User, isSignup: boolean, manualReferralCode?: string) => {
    setUser(userData);
    setShowAuth(false);
    localStorage.setItem('fury_user', JSON.stringify(userData));
    await firebaseSaveUser(userData);

    if (isSignup) {
      const refCode = manualReferralCode || sessionStorage.getItem('fury_ref');
      if (refCode && refCode !== userData.id) {
        await firebaseAwardReferral(refCode);
        sessionStorage.removeItem('fury_ref');
      }
    }
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

  if (vpnMessage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-red-500/30 p-8 rounded-[2.5rem] max-w-sm space-y-4">
          <Ban className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-white font-gaming font-bold italic uppercase text-xl">Access Denied</h2>
          <p className="text-slate-400 text-sm">{vpnMessage}</p>
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
      className="min-h-[100dvh] text-white pb-20 relative overflow-x-hidden selection:bg-yellow-500 selection:text-slate-950 transition-colors duration-700"
      style={{ background: settings.appBackground || '#020617' }}
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

      <main className="container mx-auto px-4 pt-20 max-w-2xl relative z-10">
        {activeTab === 'home' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <YouTubeBanner videoId={settings.youtubeVideoId} />
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-gaming font-bold italic tracking-wider text-white flex items-center gap-2">
                  <span className="w-1 h-6 bg-yellow-500 rounded-full shadow-[0_0_10px_#eab308]"></span>
                  {t.tournaments}
                </h2>
                <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                   <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tournaments.length} ACTIVE</span>
                </div>
              </div>
              
              <div className="space-y-6">
                {tournaments.length === 0 ? (
                  <div className="py-20 text-center opacity-50">
                    <p className="font-gaming font-bold italic uppercase tracking-widest text-slate-600">No active battles deployed</p>
                  </div>
                ) : (
                  tournaments.map(tn => (
                    <TournamentCard 
                      key={tn.id} 
                      tournament={tn} 
                      t={t}
                      onJoin={() => setJoinTournament(tn)} 
                      isJoined={user?.joinedTournament && user.lastJoinedTournamentId === tn.id}
                      user={user}
                      onCancel={async () => {
                        if (!user) return;
                        const res = await firebaseLeaveTournament(user.id, tn.id);
                        if (res.success) {
                          // Update local state as fallback for onSnapshot
                          setTournaments(prev => prev.map(t => 
                            t.id === tn.id ? { ...t, filledSlots: Math.max(0, (t.filledSlots || 0) - 1) } : t
                          ));
                          // Also update local user state
                          setUser(prev => prev ? { ...prev, joinedTournament: false, lastJoinedTournamentId: undefined } : null);
                        }
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
            audiencePlayers={audiencePlayers}
          />
        )}

        {activeTab === 'gift' && user && (
           <RewardsView 
             user={user} 
             redeemStore={redeemStore}
             t={t}
             onUpdateUser={async (u) => {
               setUser(u);
               await firebaseSaveUser(u);
             }}
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
            const joinedId = joinTournament.id;
            const entryFee = joinTournament.entryFee || 0;
            setJoinTournament(null);
            // Update local state as fallback for onSnapshot
            setTournaments(prev => prev.map(t => 
              t.id === joinedId ? { ...t, filledSlots: (t.filledSlots || 0) + 1 } : t
            ));
            // Also update local user state
            setUser(prev => prev ? { 
              ...prev, 
              joinedTournament: true, 
              lastJoinedTournamentId: joinedId,
              diamonds: (prev.diamonds || 0) - entryFee
            } : null);
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

      {showCountrySelection && user && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] w-full max-w-sm space-y-8 animate-in zoom-in-95 duration-300">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-gaming font-bold italic uppercase text-white">{t.select_country}</h2>
              <p className="text-slate-400 text-sm">{t.detect_location_fail}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={async () => {
                  const updatedUser = { 
                    ...user, 
                    country: 'IN' as Country, 
                    permanent_location: 'India 🇮🇳',
                    countryLocked: true 
                  };
                  setUser(updatedUser);
                  localStorage.setItem('fury_user', JSON.stringify(updatedUser));
                  await firebaseSaveUser(updatedUser);
                  setShowCountrySelection(false);
                }}
                className="group relative bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 p-6 rounded-2xl transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🇮🇳</span>
                  <div>
                    <div className="text-white font-bold">{t.india}</div>
                    <div className="text-xs text-slate-400">{t.rupees_desc}</div>
                  </div>
                </div>
              </button>

              <button
                onClick={async () => {
                  const updatedUser = { 
                    ...user, 
                    country: 'ID' as Country, 
                    permanent_location: 'Indonesia 🇮🇩',
                    countryLocked: true 
                  };
                  setUser(updatedUser);
                  localStorage.setItem('fury_user', JSON.stringify(updatedUser));
                  await firebaseSaveUser(updatedUser);
                  setShowCountrySelection(false);
                }}
                className="group relative bg-slate-800 hover:bg-orange-600/20 border border-slate-700 hover:border-orange-500/50 p-6 rounded-2xl transition-all duration-300 text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">🇮🇩</span>
                  <div>
                    <div className="text-white font-bold">{t.indonesia}</div>
                    <div className="text-xs text-slate-400">{t.rupiah_desc}</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
