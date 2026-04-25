
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, LayoutGrid, Users, Video, ShieldCheck, Database, Trophy, ImageIcon, MonitorPlay, CheckCircle2, ChevronRight, Loader2, Camera, Gem, Coins, Phone, Search, Upload, Eye, Bell, Instagram, Facebook, Youtube, Download, Key, FileText, Lock, Mail, Smartphone, MessageCircle, Send, CheckCheck, MessageSquare, Palette, Image as ImageIcon2, RefreshCw, Maximize, Minimize, Gift, Edit3, Link as LinkIcon, Shield, Banknote, Ban, Globe, Zap } from 'lucide-react';
import { Tournament, TournamentType, AppSettings, AudiencePlayer, User, Message, AppNotification, RedeemCard, TargetCountry, Country } from '../types';
import { firebaseAddAssets, firebaseGetParticipants, uploadToCloudinary, firebaseGetAllUsers, db, firebaseDeductDiamonds, firebase } from '../firebase';

interface AdminPanelProps {
  tournaments: Tournament[];
  onAdd: (t: Tournament) => void;
  onDelete: (id: string) => void;
  onUpdateTournament: (t: Tournament) => void;
  audiencePlayers: AudiencePlayer[];
  onAddAudience: (p: Omit<AudiencePlayer, 'id'>) => void;
  onDeleteAudience: (id: string) => void;
  onBroadcastNotification: (title: string, message: string, targetCountry: TargetCountry) => void;
  notifications: AppNotification[];
  onDeleteNotification: (id: string) => void;
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  allUsers: User[]; 
  redeemStore: RedeemCard[];
  onUpdateAnyUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (userId: string) => void;
  onClose: () => void;
}

const GAMING_THEMES = [
  { name: 'Midnight Void', value: '#020617' },
  { name: 'Crimson Fury', value: 'linear-gradient(to bottom right, #450a0a, #020617)' },
  { name: 'Cyber Neon', value: 'linear-gradient(to right, #0f0c29, #302b63, #24243e)' },
  { name: 'Toxic Zone', value: 'radial-gradient(circle at center, #064e3b, #020617)' },
  { name: 'Royal Gold', value: 'linear-gradient(135deg, #422006, #020617)' },
  { name: 'Deep Ocean', value: 'linear-gradient(to bottom, #172554, #020617)' },
  { name: 'Phantom Violet', value: 'linear-gradient(to bottom, #2e1065, #020617)' },
  { name: 'Solar Flare', value: 'linear-gradient(135deg, #7c2d12, #020617)' },
  { name: 'Stealth Ops', value: 'linear-gradient(to bottom, #18181b, #09090b)' },
  { name: 'Aurora', value: 'linear-gradient(to right, #022c22, #111827, #0f172a)' },
  { name: 'Synthwave', value: 'linear-gradient(to bottom right, #581c87, #be185d, #020617)' },
  { name: 'Glacier', value: 'linear-gradient(to bottom, #083344, #0f172a)' },
  { name: 'Blood Moon', value: 'radial-gradient(circle at top, #450a0a, #020617)' },
  { name: 'Emerald City', value: 'linear-gradient(to bottom right, #064e3b, #022c22, #020617)' },
  { name: 'Galaxy', value: 'radial-gradient(circle at center, #312e81, #020617)' }
];

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  tournaments, onAdd, onDelete, onUpdateTournament, audiencePlayers, onAddAudience, onDeleteAudience,
  settings, onUpdateSettings, allUsers, onUpdateAnyUser, onDeleteUser, onBroadcastNotification, notifications, onDeleteNotification, redeemStore, onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'tournaments' | 'audience' | 'settings' | 'users' | 'notify' | 'credentials' | 'support' | 'payouts' | 'redeemStore'>('menu');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  const [newT, setNewT] = useState<Partial<Tournament>>({
    title: '', image: '', type: TournamentType.SOLO, entryFee: 10, prizePool: 1000, slots: 48, status: 'OPEN'
  });
  const [notif, setNotif] = useState({ title: '', message: '', targetCountry: 'BOTH' as TargetCountry });
  const [newAudience, setNewAudience] = useState({ name: '', ffId: '', photo: '', country: 'IN' as Country });
  const [userSearch, setUserSearch] = useState('');
  const [phoneToCredit, setPhoneToCredit] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditType, setCreditType] = useState<'diamonds' | 'coins'>('diamonds');
  const [viewingTournament, setViewingTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [editingRoomTournament, setEditingRoomTournament] = useState<Tournament | null>(null);
  const [roomForm, setRoomForm] = useState({ roomId: '', roomPassword: '' });
  const [supportMessages, setSupportMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState<{[key: string]: string}>({});
  const [redeemRequests, setRedeemRequests] = useState<any[]>([]);
  const [redeemCodeInputs, setRedeemCodeInputs] = useState<{[key: string]: string}>({});
  const [activeRedeemId, setActiveRedeemId] = useState<string | null>(null);
  const [directMsgUser, setDirectMsgUser] = useState<User | null>(null);
  const [directMsgText, setDirectMsgText] = useState('');
  const [cancellingUser, setCancellingUser] = useState<User | null>(null);
  
  const [newRedeem, setNewRedeem] = useState({ 
    title: '',
    imageUrl: '', 
    amount: '', 
    diamonds: '', 
    targetCountry: 'BOTH' as TargetCountry
  });
  const [payoutFilter, setPayoutFilter] = useState<'ALL' | 'IN' | 'ID'>('ALL');
  const [userCountryFilter, setUserCountryFilter] = useState<'ALL' | 'IN' | 'ID'>('ALL');
  
  useEffect(() => {
    if (activeTab === 'credentials' || activeTab === 'support') {
      const fetchUsers = async () => {
        setLoading(true);
        setLoadingText('Decrypting User Data...');
        const users = await firebaseGetAllUsers();
        setDbUsers(users);
        setLoading(false);
        setLoadingText('');
      };
      fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'support') {
      const unsub = db.collection("messages").orderBy("timestamp", "desc").onSnapshot(
        (snap: any) => {
          setSupportMessages(snap.docs.map((d: any) => ({id: d.id, ...d.data()} as Message)));
        },
        (error: any) => console.debug("Support messages permission denied:", error)
      );
      return () => unsub();
    }
  }, [activeTab]);
  
  useEffect(() => {
    if (activeTab === 'payouts') {
      const unsub = db.collection("redeem_requests").onSnapshot(
        (snap: any) => {
          const reqs = snap.docs.map((d: any) => ({
              id: d.id, 
              ...d.data()
          }));
          reqs.sort((a: any, b: any) => b.timestamp - a.timestamp);
          setRedeemRequests(reqs);
        },
        (error: any) => console.debug("Payouts permission denied:", error)
      );
      return () => unsub();
    }
  }, [activeTab]);

  const filteredDbUsers = allUsers.filter(u => {
    // Apply country filter
    if (userCountryFilter !== 'ALL' && u.country !== userCountryFilter) return false;

    const search = userSearch.toLowerCase();
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone_number || '');
    return name.includes(search) || phone.includes(search) || email.includes(search);
  });

  const filteredRedeemRequests = redeemRequests.filter(req => {
    if (payoutFilter === 'ALL') return true;
    return req.country === payoutFilter;
  });

  const handleAddTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newT.image) {
      console.warn("16:9 Banner Image Required");
      return;
    }
    try {
      setLoading(true);
      setLoadingText('Deploying Battle Banner...');
      let finalImg = newT.image;
      if (newT.image.startsWith('data:')) {
        finalImg = await uploadToCloudinary(newT.image, 'image');
      }
      onAdd({ ...newT as Tournament, id: Date.now().toString(), image: finalImg, filledSlots: 0 });
      setNewT({ title: '', image: '', type: TournamentType.SOLO, entryFee: 10, prizePool: 1000, slots: 48, status: 'OPEN' });
      setActiveTab('tournaments');
    } catch (err) { console.error("Error adding battle:", err); }
    finally { setLoading(false); setLoadingText(''); }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        console.warn("File too large! Max video size is 100MB for direct upload.");
        return;
      }
      try {
        setLoading(true);
        setLoadingText('Uploading Video (Please Wait)...');
        const url = await uploadToCloudinary(file, 'video');
        onUpdateSettings({ ...settings, playVideoId: url });
        console.log("Video Uploaded Successfully!");
      } catch (err) { 
        console.error("Upload Failed:", err); 
      } finally { 
        setLoading(false); 
        setLoadingText(''); 
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        setLoadingText('Updating App Logo...');
        const url = await uploadToCloudinary(file, 'image');
        onUpdateSettings({...settings, appLogo: url});
      } catch (err) { console.error("Upload Failed:", err); }
      finally { setLoading(false); setLoadingText(''); }
    }
  };

  const handlePlayBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        setLoadingText(`Uploading battlefield ${type}...`);
        const url = await uploadToCloudinary(file, type);
        onUpdateSettings({ ...settings, playBannerMedia: url, playBannerType: type });
      } catch (err) { 
        console.error("Upload Failed:", err); 
      } finally { 
        setLoading(false); 
        setLoadingText(''); 
      }
    }
  };

  const handleViewParticipants = async (tn: Tournament) => {
    setLoading(true);
    setLoadingText('Fetching Enlisted Players...');
    const users = await firebaseGetParticipants(tn.id);
    setParticipants(users);
    setViewingTournament(tn);
    setLoading(false);
    setLoadingText('');
  };

  const handleEditRoom = (tn: Tournament) => {
    setEditingRoomTournament(tn);
    setRoomForm({ roomId: tn.roomId || '', roomPassword: tn.roomPassword || '' });
  };

  const saveRoomDetails = () => {
    if (editingRoomTournament) {
      onUpdateTournament({
        ...editingRoomTournament,
        roomId: roomForm.roomId,
        roomPassword: roomForm.roomPassword
      });
      if (roomForm.roomId && roomForm.roomPassword) {
         onBroadcastNotification(
           `ID/PASS UPDATED: ${editingRoomTournament.title}`,
           `Room ID and Password have been updated. Check the tournament card in "Joined" section now!`
         );
         console.log("Room Details Saved & Notification Sent to All Users!");
      } else {
         console.log("Room Details Saved");
      }
      setEditingRoomTournament(null);
    }
  };

  const handleQuickCredit = async () => {
    if (!phoneToCredit || !creditAmount) {
      console.warn("Fill all details");
      return;
    }
    setLoading(true);
    setLoadingText('Injecting Assets...');
    const result = await firebaseAddAssets(phoneToCredit, creditType, parseInt(creditAmount));
    setLoading(false);
    setLoadingText('');
    if (result.success) {
      console.log(`Success! Credited to ${result.name}`);
      setPhoneToCredit('');
      setCreditAmount('');
    } else { console.error("Error: User not found"); }
  };

  const sendReply = async (messageId: string) => {
    const text = replyText[messageId];
    if (!text || !text.trim()) return;
    try {
      await db.collection("messages").doc(messageId).update({
        reply: text,
        isRead: true
      });
      setReplyText({ ...replyText, [messageId]: '' });
      console.log("Reply Sent");
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  const deleteSupportMessage = async (id: string) => {
    console.log("Attempting to delete support message with ID:", id);
    try {
      await db.collection("messages").doc(id).delete();
    } catch (e: any) {
      console.error("Delete support message failed:", e);
    }
  };
  
  const handleApprovePayout = async (req: any) => {
     if (!req.id) return console.error("System Error: Request ID missing.");
     setLoading(true);
     setLoadingText('Processing Payout...');
     try {
       const result = await firebaseDeductDiamonds(String(req.userId).trim(), Number(req.cost));
       if (result.success) {
          await db.collection("redeem_requests").doc(req.id).update({ status: 'Approved' });
          console.log(`Success! ${req.cost} Diamonds deducted. Request Approved.`);
       } else {
          console.error(`Transaction Failed: ${result.error}`);
       }
     } catch(e: any) {
       console.error(e);
     } finally {
       setLoading(false);
       setLoadingText('');
     }
  };

  const handleCancelPayout = async (req: any) => {
    if (!req.id) return console.error("System Error: Missing Request ID");
    try {
      await db.collection("redeem_requests").doc(req.id).update({
        status: "Cancelled"
      });
      console.log("Request Marked as Cancelled.");
    } catch (e: any) {
      console.error("Error cancelling payout:", e);
    }
  };

  const handleSendRedeemCode = async (reqId: string) => {
    const code = redeemCodeInputs[reqId];
    if (!code || !code.trim()) {
      return;
    }
    try {
      await db.collection("redeem_requests").doc(reqId).update({
        redeem_code: code,
        status: 'Completed'
      });
      console.log("Code Sent Successfully!");
      setRedeemCodeInputs(prev => ({ ...prev, [reqId]: '' }));
      setActiveRedeemId(null);
    } catch (err: any) {
      console.error("Error sending code:", err);
    }
  };

  const deleteRedeemRequest = async (id: string) => {
     try {
       await db.collection("redeem_requests").doc(id).delete();
       console.log("Redeem Request Deleted:", id);
     } catch(e) { 
       console.error("Delete failed:", e);
     }
  };

  const sendDirectMessage = async () => {
    if (!directMsgUser || !directMsgText.trim()) return;
    setLoading(true);
    setLoadingText('Transmitting...');
    try {
      await db.collection("messages").add({
        userId: directMsgUser.id,
        text: "System: Support Channel Open",
        reply: directMsgText,
        timestamp: Date.now(),
        isRead: false
      });
      setDirectMsgUser(null);
      setDirectMsgText('');
      console.log("Message Sent Successfully!");
    } catch (e) {
      console.error("Transmission Failed:", e);
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

  const handleCancelJoin = async (targetUser: any, reason: string) => {
    if (!viewingTournament) return;
    setLoading(true);
    setLoadingText('Cancelling Entry...');
    try {
      // 1. Update User
      await db.collection("users").doc(targetUser.id).update({
        joinedTournament: false,
        cancelReason: reason
      });

      // 2. Decrement Tournament Slots
      await db.collection("tournaments").doc(viewingTournament.id).update({
        filledSlots: firebase.firestore.FieldValue.increment(-1)
      });
      
      // Update local viewingTournament state to reflect the decrement
      const updatedTournament = {
        ...viewingTournament,
        filledSlots: Math.max(0, (viewingTournament.filledSlots || 0) - 1)
      };
      setViewingTournament(updatedTournament);
      
      // Notify parent about the update to ensure the main UI reflects the change
      onUpdateTournament(updatedTournament);

      // 3. Refresh participants list
      const updatedParticipants = participants.filter(p => p.id !== targetUser.id);
      setParticipants(updatedParticipants);

      // 4. Notify User via System Message (Optional but helpful)
      await db.collection("messages").add({
        userId: targetUser.id,
        text: `System: Your entry for "${viewingTournament.title}" was cancelled.`,
        reply: `Reason: ${reason}`,
        timestamp: Date.now(),
        isRead: false
      });

      console.log("Join Cancelled Successfully");
    } catch (e) {
      console.error("Cancellation Failed:", e);
    } finally {
      setLoading(false);
      setLoadingText('');
      setCancellingUser(null);
    }
  };

  const handleAddAudience = async () => {
    if(!newAudience.name || !newAudience.ffId || !newAudience.photo) {
      console.warn("Fill Name, UID and Photo");
      return;
    }
    setLoading(true);
    setLoadingText('Recruiting Player...');
    let photoUrl = newAudience.photo;
    if (photoUrl.startsWith('data:')) {
        photoUrl = await uploadToCloudinary(photoUrl, 'image');
    }
    onAddAudience({ ...newAudience, photo: photoUrl });
    setNewAudience({ name: '', ffId: '', photo: '', country: 'IN' });
    setLoading(false);
    setLoadingText('');
  };

   const handleAddRedeemCard = async () => {
    if (!newRedeem.imageUrl || !newRedeem.amount || !newRedeem.diamonds) {
      console.warn("Fill all details");
      return;
    }
    setLoading(true);
    setLoadingText('Saving Redeem Card...');
    try {
      let finalImg = newRedeem.imageUrl;
      if (finalImg.startsWith('data:')) {
        finalImg = await uploadToCloudinary(finalImg, 'image');
      }
      await db.collection("redeemStore").add({
        title: newRedeem.title,
        imageUrl: finalImg,
        amount: parseInt(newRedeem.amount),
        diamonds: parseInt(newRedeem.diamonds),
        targetCountry: newRedeem.targetCountry || 'BOTH'
      });
      setNewRedeem({ 
        title: '',
        imageUrl: '', 
        amount: '', 
        diamonds: '', 
        targetCountry: 'BOTH'
      });
      console.log("Redeem Card Added!");
    } catch (err) {
      console.error("Error adding card:", err);
    } finally {
      setLoading(false);
      setLoadingText('');
    }
  };

  const handleDeleteRedeemCard = async (id: string) => {
    try {
      await db.collection("redeemStore").doc(id).delete();
      console.log("Redeem Card Deleted:", id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const MenuButton = ({ id, label, icon: Icon, color, sub }: any) => (
    <button 
      onClick={() => setActiveTab(id)} 
      className="w-full bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-4 rounded-3xl flex items-center gap-4 group hover:border-white/30 hover:bg-slate-800/60 transition-all active:scale-95 shadow-2xl relative overflow-hidden ring-1 ring-white/5 h-24"
    >
      <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${color} shadow-lg group-hover:scale-110 transition-transform duration-500 relative z-10`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="text-left relative z-10 flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="text-white font-gaming font-bold italic uppercase text-[11px] sm:text-xs tracking-wider group-hover:text-white transition-colors leading-tight line-clamp-2">{label}</h4>
        <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.1em] opacity-40 group-hover:opacity-80 transition-all mt-1 truncate">{sub}</p>
      </div>
      <div className={`absolute inset-0 bg-gradient-to-r ${color.replace('bg-', 'from-')}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] flex flex-col overflow-hidden">
      <header 
        className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-50"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingBottom: '1.5rem'
        }}
      >
        <div className="flex items-center gap-4">
          {(activeTab !== 'menu' || viewingTournament) && <button onClick={() => { if(viewingTournament) setViewingTournament(null); else setActiveTab('menu'); }} className="p-2 text-slate-400 hover:text-white"><ChevronRight className="w-6 h-6 rotate-180" /></button>}
          <div className="bg-red-600 p-2 rounded-xl"><ShieldCheck className="w-6 h-6 text-white" /></div>
          <div>
            <h2 className="text-lg font-gaming font-bold text-white italic leading-none uppercase tracking-tight">STARK TERMINAL</h2>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Authorized Access Only</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-red-600 text-white rounded-xl transition-all"><X className="w-6 h-6" /></button>
      </header>

      <div 
        className="flex-grow overflow-y-auto no-scrollbar"
        style={{
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingTop: '1.5rem',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 8rem)'
        }}
      >
        {loading && (
          <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
            <Loader2 className="w-16 h-16 text-red-600 animate-spin mb-4" />
            <h3 className="text-white font-gaming font-bold italic uppercase tracking-widest text-sm">{loadingText}</h3>
          </div>
        )}

        {cancellingUser && (
          <div className="fixed inset-0 z-[350] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-red-500/30 w-full max-w-sm space-y-6 animate-in zoom-in duration-300">
              <div className="text-center">
                <Ban className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-white font-gaming font-bold italic uppercase">Cancel Entry</h3>
                <p className="text-slate-400 text-xs mt-2">Select a reason for cancelling <span className="text-white font-bold">{cancellingUser.name}</span>'s join.</p>
              </div>
              
              <div className="space-y-3">
                {[
                  "Photo kharab (Bad Photo)",
                  "ID number galat (Wrong ID)",
                  "Incomplete Details",
                  "Other Reason"
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => handleCancelJoin(cancellingUser, reason)}
                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white text-xs font-bold hover:border-red-500 transition-all text-left flex items-center justify-between group"
                  >
                    {reason}
                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-red-500" />
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCancellingUser(null)}
                className="w-full py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
              >
                CLOSE WINDOW
              </button>
            </div>
          </div>
        )}
        
        {editingRoomTournament && (
           <div className="fixed inset-0 z-[250] bg-black/80 flex items-center justify-center p-4">
              <div className="bg-slate-900 p-8 rounded-3xl border border-yellow-500/30 w-full max-w-sm space-y-4">
                 <h3 className="text-white font-bold uppercase">Update Room Details</h3>
                 <input type="text" placeholder="Room ID" className="w-full bg-slate-950 p-3 rounded-xl text-white border border-slate-800" value={roomForm.roomId} onChange={e => setRoomForm({...roomForm, roomId: e.target.value})} />
                 <input type="text" placeholder="Password" className="w-full bg-slate-950 p-3 rounded-xl text-white border border-slate-800" value={roomForm.roomPassword} onChange={e => setRoomForm({...roomForm, roomPassword: e.target.value})} />
                 <div className="flex gap-2">
                    <button onClick={saveRoomDetails} className="flex-1 bg-yellow-500 text-slate-950 font-bold py-3 rounded-xl">SAVE & NOTIFY</button>
                    <button onClick={() => setEditingRoomTournament(null)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-xl">CANCEL</button>
                 </div>
              </div>
           </div>
        )}

        {viewingTournament ? (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right">
             <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 flex justify-between items-center">
               <h3 className="text-white font-gaming font-bold italic uppercase">{viewingTournament.title} - Enlisted</h3>
               <span className="text-yellow-500 font-bold text-xs uppercase tracking-widest">{participants.length} Personnel</span>
             </div>
             
             <div className="grid grid-cols-1 gap-4">
               {participants.map((p: any) => (
                 <div key={p.id} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 hover:border-cyan-500/30 transition-all shadow-lg">
                   {p.squadDetails ? (
                      <div className="space-y-4">
                         <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                            <div>
                              <h4 className="text-white font-gaming font-bold italic text-lg flex items-center gap-2">
                                 {p.squadDetails.teamName}
                                 <span className="text-xl" title={p.country === 'ID' ? 'Indonesia' : 'India'}>
                                    {p.country === 'ID' ? '🇮🇩' : '🇮🇳'}
                                 </span>
                              </h4>
                               <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 font-bold uppercase">Squad Entry</span>
                               <div className="flex items-center gap-2 mt-2">
                                  <Phone className="w-3 h-3 text-slate-500" />
                                  <p className="text-slate-400 text-xs font-mono font-bold break-all">{p.phone_number || p.email || 'No Contact'}</p>
                               </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                               <div className="relative group cursor-pointer w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shadow-lg" onClick={() => window.open(p.squadDetails.teamLogo, '_blank')}>
                                  <img src={p.squadDetails.teamLogo} className="w-full h-full object-cover" alt="Team Logo" />
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                     <Download className="w-5 h-5 text-white" />
                                  </div>
                               </div>
                               <span className="text-[8px] text-slate-500 font-black uppercase">Team Logo</span>
                            </div>
                            <button 
                              onClick={() => setCancellingUser(p)}
                              className="bg-red-600/10 text-red-500 p-2 rounded-xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all"
                              title="Cancel Join"
                            >
                              <Ban className="w-5 h-5" />
                            </button>
                         </div>
                         <div>
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest block mb-2">Squad Roster (4)</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                               {p.squadDetails.members && p.squadDetails.members.map((m: any, idx: number) => (
                                 <div key={idx} className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                                    <div className="relative group cursor-pointer shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-slate-800" onClick={() => window.open(m.photo, '_blank')}>
                                       <img src={m.photo} className="w-full h-full object-cover" alt={`P${idx+1}`} />
                                       <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Download className="w-4 h-4 text-white" />
                                       </div>
                                    </div>
                                    <div className="overflow-hidden">
                                       <p className="text-white text-xs font-bold truncate">{m.name}</p>
                                       <p className="text-cyan-400 text-[10px] font-mono truncate">UID: {m.ffId}</p>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                        <button 
                          onClick={() => setCancellingUser(p)}
                          className="bg-red-600/10 text-red-500 p-3 rounded-xl border border-red-500/20 hover:bg-red-600 hover:text-white transition-all"
                          title="Cancel Join"
                        >
                          <Ban className="w-5 h-5" />
                        </button>
                      </div>
                   ) : (
                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                       <div className="relative group cursor-pointer shrink-0" onClick={() => window.open(p.idPhoto, '_blank')}>
                         <img src={p.idPhoto || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-lg" alt="Proof" />
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                            <Download className="w-6 h-6 text-white" />
                         </div>
                       </div>
                       <div className="flex-grow">
                         <p className="text-white font-bold text-sm italic flex items-center gap-2">
                            {p.name} 
                            <span className="text-lg" title={p.country === 'ID' ? 'Indonesia' : 'India'}>
                               {p.country === 'ID' ? '🇮🇩' : '🇮🇳'}
                            </span>
                            <span className="text-[10px] text-slate-500">(Solo)</span>
                         </p>
                         <p className="text-cyan-400 text-[10px] font-gaming uppercase tracking-tighter">FF ID: {p.freeFireId || 'N/A'}</p>
                         <div className="flex items-center gap-2 mt-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <p className="text-slate-400 text-[10px] font-mono break-all line-clamp-2">{p.phone_number || p.email}</p>
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               ))}
               {participants.length === 0 && <p className="text-slate-600 text-center py-20 col-span-full uppercase font-black tracking-widest text-[10px]">No personnel found for this sector.</p>}
             </div>
          </div>
        ) : activeTab === 'menu' ? (
          <div className="max-w-2xl mx-auto space-y-6 pt-4 animate-in slide-in-from-bottom-10">
            {/* User Counters Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-4xl mb-2">🇮🇳</div>
                <div className="text-3xl font-gaming font-bold text-white italic">{allUsers.filter(u => u.country === 'IN').length}</div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">India Users</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-4xl mb-2">🇮🇩</div>
                <div className="text-3xl font-gaming font-bold text-white italic">{allUsers.filter(u => u.country === 'ID').length}</div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Indonesia Users</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex flex-col items-center justify-center shadow-xl relative overflow-hidden group col-span-1 sm:col-span-1">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="bg-emerald-600/20 p-3 rounded-full mb-2">
                  <Users className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-3xl font-gaming font-bold text-white italic">{allUsers.length}</div>
                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Total Users</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MenuButton id="payouts" label="Payouts" sub="Redeem Requests" icon={Banknote} color="bg-green-600" />
              <MenuButton id="redeemStore" label="Redeem Store" sub="Manage Cards" icon={Gift} color="bg-purple-600" />
              <MenuButton id="support" label="Support" sub="User Messages" icon={MessageCircle} color="bg-blue-600" />
              <MenuButton id="credentials" label="User Data" sub="View Credentials" icon={FileText} color="bg-rose-500" />
              <MenuButton id="tournaments" label="Tournaments" sub="Deploy Battles" icon={LayoutGrid} color="bg-red-600" />
              <MenuButton id="users" label="User Credits" sub="Asset Management" icon={Database} color="bg-emerald-600" />
              <MenuButton id="settings" label="App Branding & Media" sub="Logo, Colors & Videos" icon={Palette} color="bg-cyan-600" />
              <MenuButton id="audience" label="Elite Roster" sub="Player Personnel" icon={Users} color="bg-indigo-600" />
              <MenuButton id="notify" label="Broadcast" sub="Alert System" icon={Bell} color="bg-orange-600" />
            </div>
          </div>
        ) : activeTab === 'payouts' ? (
           <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-gaming font-bold italic uppercase flex items-center gap-2">
                   <Banknote className="w-5 h-5 text-green-500" /> Redeem Requests
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPayoutFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${payoutFilter === 'ALL' ? 'bg-white text-slate-950' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
                  >
                    ALL
                  </button>
                  <button 
                    onClick={() => setPayoutFilter('IN')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${payoutFilter === 'IN' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
                  >
                    🇮🇳 INDIA
                  </button>
                  <button 
                    onClick={() => setPayoutFilter('ID')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${payoutFilter === 'ID' ? 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
                  >
                    🇮🇩 INDONESIA
                  </button>
                </div>
              </div>

              {filteredRedeemRequests.length === 0 && <p className="text-center text-slate-500 py-10">No requests found for this filter.</p>}
              {filteredRedeemRequests.map((req) => {
                const isIndia = req.country === 'IN';
                const isIndo = req.country === 'ID';
                const bgColor = isIndia ? 'bg-blue-950/20 border-blue-500/20' : isIndo ? 'bg-orange-950/20 border-orange-500/20' : 'bg-slate-900 border-slate-800';
                const currency = isIndo ? 'Rp' : '₹';

                return (
                  <div key={req.id} className={`${bgColor} border p-5 rounded-2xl flex flex-col gap-4 group hover:border-green-500/30 transition-all`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {req.imageUrl && (
                          <div className="w-16 h-12 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shrink-0">
                            <img src={req.imageUrl} className="w-full h-full object-cover" alt="Redeem Card" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <div>
                           <h4 className="text-white font-bold text-lg">{currency}{req.amount} <span className="text-xs text-slate-500 font-normal">({req.cost} Gems)</span></h4>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg">{req.countryFlag || (isIndia ? '🇮🇳' : isIndo ? '🇮🇩' : '')}</span>
                            <p className="text-slate-400 text-xs font-mono">User: {req.userName} ({req.permanent_location || 'Unknown'})</p>
                         </div>
                         <p className="text-[9px] text-slate-600 mt-1">{new Date(req.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                         <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${req.status === 'Approved' || req.status === 'Completed' ? 'bg-green-500/20 text-green-500' : (req.status && req.status.includes('Cancelled')) ? 'bg-red-500/20 text-red-500' : (req.status && req.status.includes('Rejected')) ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{req.status || 'Pending'}</span>
                         <div className="flex gap-2">
                            {req.status === 'Pending' && (
                              <>
                                <button onClick={() => handleApprovePayout(req)} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-500 shadow-lg" title="Approve & Deduct"><CheckCheck className="w-4 h-4" /></button>
                                <button onClick={() => handleCancelPayout(req)} className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 shadow-lg" title="Reject/Cancel"><X className="w-4 h-4" /></button>
                              </>
                            )}
                            <button onClick={() => {
                              console.log("Admin: Attempting to delete redeem request:", req.id);
                              deleteRedeemRequest(req.id);
                            }} className="p-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-colors" title="Delete History"><Trash2 className="w-4 h-4" /></button>
                         </div>
                      </div>
                    </div>
                    <div className="border-t border-slate-800 pt-3">
                       {activeRedeemId === req.id ? (
                         <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in">
                           <input 
                             autoFocus
                             type="text" 
                             placeholder="Enter Personal Gift Code..." 
                             className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-green-500 transition-all"
                             value={redeemCodeInputs[req.id] || ''}
                             onChange={(e) => setRedeemCodeInputs({...redeemCodeInputs, [req.id]: e.target.value})}
                           />
                           <button 
                             onClick={() => handleSendRedeemCode(req.id)} 
                             className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                           >
                              SEND <Send className="w-3 h-3" />
                           </button>
                           <button 
                             onClick={() => setActiveRedeemId(null)} 
                             className="bg-slate-800 hover:bg-slate-700 text-white px-3 rounded-xl transition-all"
                           >
                              <X className="w-4 h-4" />
                           </button>
                         </div>
                       ) : (
                         <button 
                            onClick={() => setActiveRedeemId(req.id)} 
                            className="w-full py-2 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white hover:border-slate-600 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                         >
                            <Gift className="w-3 h-3" /> Send Gift Code manually
                         </button>
                       )}
                    </div>
                  </div>
                );
              })}
           </div>
        ) : activeTab === 'redeemStore' ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4 shadow-xl">
              <h3 className="text-white font-gaming font-bold italic uppercase flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-purple-600" /> Add Gift Card
              </h3>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <input 
                  type="text" 
                  placeholder="Card Name (e.g. Play Store, Amazon)" 
                  className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none" 
                  value={newRedeem.title} 
                  onChange={e => setNewRedeem({...newRedeem, title: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" 
                  placeholder="Value Amount" 
                  className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none" 
                  value={newRedeem.amount} 
                  onChange={e => setNewRedeem({...newRedeem, amount: e.target.value})} 
                />
                <input 
                  type="number" 
                  placeholder="Diamonds Cost" 
                  className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none" 
                  value={newRedeem.diamonds} 
                  onChange={e => setNewRedeem({...newRedeem, diamonds: e.target.value})} 
                />
                <select 
                  className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none col-span-2" 
                  value={newRedeem.targetCountry} 
                  onChange={e => setNewRedeem({...newRedeem, targetCountry: e.target.value as any})}
                >
                  <option value="IN">INDIA ONLY (IN)</option>
                  <option value="ID">INDONESIA ONLY (ID)</option>
                  <option value="BOTH">BOTH COUNTRIES</option>
                </select>
              </div>
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-purple-600 transition-colors relative overflow-hidden group">
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => {
                  const f = e.target.files?.[0];
                  if(f) {
                    const r = new FileReader();
                    r.onloadend = () => setNewRedeem({...newRedeem, imageUrl: r.result as string});
                    r.readAsDataURL(f);
                  }
                }} />
                {newRedeem.imageUrl ? (
                  <img src={newRedeem.imageUrl} className="w-full h-32 object-cover rounded-lg" alt="Preview" />
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Upload Card Photo</span>
                  </div>
                )}
              </div>
              <button 
                onClick={handleAddRedeemCard} 
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl uppercase text-xs tracking-widest shadow-lg transition-all"
              >
                SAVE REDEEM CARD
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-white font-gaming font-bold italic uppercase text-xs pl-4">Existing Cards</h4>
              {redeemStore.map(card => (
                <div key={card.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:border-purple-600/30 transition-all">
                  <div className="flex items-center gap-4">
                    <img src={card.imageUrl} className="w-16 h-12 object-cover rounded-lg bg-slate-950" alt="Card" />
                    <div>
                      <h4 className="text-white font-bold text-sm">{card.title || 'No Name'}</h4>
                      <div className="flex gap-2 items-center">
                        <span className="text-[10px] text-yellow-500 font-gaming italic">{card.amount} {card.targetCountry === 'ID' ? 'Item' : '₹'}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{card.diamonds} Diamonds</span>
                        <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded uppercase font-black">{card.targetCountry || 'BOTH'}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      console.log("Admin: Attempting to delete redeem card:", card.id);
                      handleDeleteRedeemCard(card.id);
                    }} 
                    className="p-2 bg-slate-800 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {redeemStore.length === 0 && (
                <p className="text-center text-slate-600 text-xs uppercase py-10">No cards in store</p>
              )}
            </div>
          </div>
        ) : activeTab === 'tournaments' ? (
          <div className="max-w-2xl mx-auto space-y-6">
             <form onSubmit={handleAddTournament} className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4 shadow-xl">
                <h3 className="text-white font-gaming font-bold italic uppercase flex items-center gap-2 mb-4">
                   <Plus className="w-5 h-5 text-red-600" /> Deploy New Battle
                </h3>
                <input type="text" placeholder="Tournament Title" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none" value={newT.title} onChange={e => setNewT({...newT, title: e.target.value})} />
                <div className="grid grid-cols-2 gap-4">
                  <select className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none" value={newT.type} onChange={e => setNewT({...newT, type: e.target.value as TournamentType})}>
                    <option value={TournamentType.SOLO}>SOLO BATTLE</option>
                    <option value={TournamentType.SQUAD}>SQUAD WAR</option>
                  </select>
                  <select className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none font-bold" value={newT.targetCountry || 'BOTH'} onChange={e => setNewT({...newT, targetCountry: e.target.value as TargetCountry})}>
                    <option value="BOTH">ALL REGIONS</option>
                    <option value="IN">INDIA 🇮🇳</option>
                    <option value="ID">INDONESIA 🇮🇩</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-4 rounded-xl">
                      <span className="text-slate-500 font-bold">Slots:</span>
                      <input type="number" className="bg-transparent text-white outline-none w-full" value={newT.slots} onChange={e => setNewT({...newT, slots: parseInt(e.target.value)})} />
                   </div>
                   <input type="number" placeholder="Entry (Diamonds)" className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none" value={newT.entryFee} onChange={e => setNewT({...newT, entryFee: parseInt(e.target.value)})} />
                </div>
                <div className="grid grid-cols-1 gap-4">
                   <input type="number" placeholder="Prize Pool" className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none" value={newT.prizePool} onChange={e => setNewT({...newT, prizePool: parseInt(e.target.value)})} />
                </div>
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-red-600 transition-colors relative overflow-hidden group">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => {
                    const f = e.target.files?.[0];
                    if(f) {
                      const r = new FileReader();
                      r.onloadend = () => setNewT({...newT, image: r.result as string});
                      r.readAsDataURL(f);
                    }
                  }} />
                  {newT.image ? <img src={newT.image} className="w-full h-32 object-cover rounded-lg" alt="Banner" /> : <div className="flex flex-col items-center"><ImageIcon className="w-8 h-8 text-slate-500 mb-2" /><span className="text-[10px] text-slate-400 font-bold uppercase">Upload 16:9 Banner</span></div>}
                </div>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl uppercase text-xs tracking-widest shadow-lg transition-all">INITIALIZE TOURNAMENT</button>
             </form>
             <div className="space-y-4">
               {tournaments.map(tn => (
                 <div key={tn.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:border-red-600/30 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="relative">
                          <img src={tn.image} className="w-16 h-12 object-cover rounded-lg bg-slate-950" alt="Thumb" />
                          {tn.targetCountry && tn.targetCountry !== 'BOTH' && (
                             <span className="absolute -top-2 -right-2 text-sm">{tn.targetCountry === 'IN' ? '🇮🇳' : '🇮🇩'}</span>
                          )}
                       </div>
                       <div>
                          <h4 className="text-white font-bold text-sm">{tn.title}</h4>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{tn.filledSlots}/{tn.slots} Joined • {tn.status}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => handleEditRoom(tn)} className="p-2 bg-slate-800 text-yellow-500 rounded-lg hover:bg-yellow-500 hover:text-slate-950 transition-colors"><Key className="w-4 h-4" /></button>
                       <button onClick={() => handleViewParticipants(tn)} className="p-2 bg-slate-800 text-cyan-400 rounded-lg hover:bg-cyan-500 hover:text-slate-950 transition-colors"><Users className="w-4 h-4" /></button>
                       <button onClick={() => onDelete(tn.id)} className="p-2 bg-slate-800 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        ) : activeTab === 'audience' ? (
           <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
                 <h3 className="text-white font-gaming font-bold italic uppercase">Recruit Squad / Player</h3>
                 <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-20 h-20 bg-slate-950 rounded-xl border border-slate-800 relative flex items-center justify-center overflow-hidden shrink-0 group hover:border-blue-500 transition-colors cursor-pointer">
                           {newAudience.photo ? <img src={newAudience.photo} className="w-full h-full object-cover" alt="Player" /> : <Camera className="w-6 h-6 text-slate-700" />}
                           <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-[8px] font-bold text-white uppercase">Photo</span>
                           </div>
                           <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                              const f = e.target.files?.[0];
                              if(f) {
                                 const r = new FileReader();
                                 r.onloadend = () => setNewAudience({...newAudience, photo: r.result as string});
                                 r.readAsDataURL(f);
                              }
                           }} />
                        </div>
                        <div className="flex-grow space-y-2">
                           <input type="text" placeholder="Player Name" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white text-xs outline-none focus:border-blue-500 transition-colors" value={newAudience.name} onChange={e => setNewAudience({...newAudience, name: e.target.value})} />
                           <div className="flex flex-col sm:flex-row gap-2">
                              <input type="text" placeholder="Free Fire UID" className="flex-grow bg-slate-950 border border-slate-800 p-3 rounded-xl text-white text-xs outline-none focus:border-blue-500 transition-colors" value={newAudience.ffId} onChange={e => setNewAudience({...newAudience, ffId: e.target.value})} />
                              <select 
                                className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-white text-xs outline-none focus:border-blue-500 transition-colors font-bold sm:w-24"
                                value={newAudience.country}
                                onChange={e => setNewAudience({...newAudience, country: e.target.value as Country})}
                              >
                                <option value="IN">🇮🇳 IN</option>
                                <option value="ID">🇮🇩 ID</option>
                              </select>
                           </div>
                        </div>
                    </div>
                 </div>
                 <button onClick={handleAddAudience} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl uppercase text-xs tracking-widest shadow-lg mt-2">ADD TO ROSTER</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {audiencePlayers.map(p => (
                    <div key={p.id} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-2">
                       <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                             <img src={p.photo} className="w-10 h-10 rounded-full object-cover" alt="P" />
                             {p.country && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] bg-slate-900 leading-none">
                                  {p.country === 'IN' ? '🇮🇳' : '🇮🇩'}
                                </div>
                             )}
                          </div>
                          <div className="min-w-0">
                             <p className="text-white text-xs font-bold truncate">{p.name}</p>
                             <p className="text-slate-500 text-[9px] font-mono truncate">{p.ffId}</p>
                          </div>
                       </div>
                       <button onClick={() => onDeleteAudience(p.id)} className="text-red-500 hover:text-white shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 ))}
              </div>
           </div>
        ) : activeTab === 'users' ? (
             <div className="max-w-2xl mx-auto space-y-6">
               <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
                 <h3 className="text-white font-gaming font-bold italic uppercase">Quick Credit</h3>
                 <div className="space-y-2">
                   <input type="text" placeholder="Phone Number or Email ID" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none" value={phoneToCredit} onChange={e => setPhoneToCredit(e.target.value)} />
                   <p className="text-slate-500 text-[10px] px-2">Enter user's registered phone number or email address to add assets.</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <input type="number" placeholder="Amount" className="w-full bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
                   <select className="bg-slate-950 border border-slate-800 p-5 rounded-2xl text-white outline-none font-bold" value={creditType} onChange={e => setCreditType(e.target.value as any)}>
                     <option value="diamonds">DIAMONDS</option>
                     <option value="coins">COINS</option>
                   </select>
                 </div>
                 <button onClick={handleQuickCredit} className="w-full bg-emerald-600 text-white font-black py-5 rounded-3xl uppercase text-xs tracking-widest shadow-lg">EXECUTE CREDIT</button>
               </div>
             </div>
        ) : activeTab === 'settings' ? (
           <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
                 <div className="flex items-center justify-between">
                   <div>
                     <h3 className="text-white font-gaming font-bold italic uppercase">Feature Control</h3>
                     <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Manage global app features</p>
                   </div>
                   <button 
                     onClick={() => onUpdateSettings({ ...settings, hideAdsButton: !settings.hideAdsButton })}
                     className={`relative w-14 h-7 rounded-full transition-all duration-500 ${settings.hideAdsButton ? 'bg-red-600' : 'bg-green-600'}`}
                   >
                     <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 ${settings.hideAdsButton ? 'left-1' : 'left-8'}`}></div>
                   </button>
                 </div>
                 <div className={`flex items-center gap-3 p-4 rounded-xl border ${settings.hideAdsButton ? 'bg-red-900/10 border-red-500/20' : 'bg-green-900/10 border-green-500/20'}`}>
                   {settings.hideAdsButton ? <Lock className="w-4 h-4 text-red-500" /> : <Zap className="w-4 h-4 text-green-500" />}
                   <span className="text-xs text-white font-bold uppercase tracking-widest">
                     {settings.hideAdsButton ? 'Ads Mining Locked' : 'Ads Mining Active'}
                   </span>
                 </div>
              </div>
              <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 space-y-6">
                 <h3 className="text-white font-gaming font-bold italic uppercase">System Branding</h3>
                 <div className="flex gap-4 items-center">
                    <div className="relative w-24 h-24 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 group">
                       {settings.appLogo ? <img src={settings.appLogo} className="w-full h-full object-contain p-2" alt="Logo" /> : <ImageIcon className="w-8 h-8 text-slate-600" />}
                       <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} />
                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload className="w-6 h-6 text-white" /></div>
                    </div>
                    <div className="flex-grow space-y-4">
                       <div>
                          <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest block mb-2">Logo Scale: {settings.logoScale || 100}%</label>
                          <input type="range" min="50" max="200" value={settings.logoScale || 100} onChange={e => onUpdateSettings({...settings, logoScale: parseInt(e.target.value)})} className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg appearance-none" />
                       </div>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-widest">App Background Theme</h4>
                    <div className="grid grid-cols-3 gap-3">
                       {GAMING_THEMES.map(theme => (
                          <button 
                             key={theme.name}
                             onClick={() => onUpdateSettings({...settings, appBackground: theme.value})}
                             className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${settings.appBackground === theme.value ? 'border-yellow-500 bg-slate-800' : 'border-slate-800 bg-slate-950 hover:border-slate-600'}`}
                          >
                             <div className="w-8 h-8 rounded-full shadow-lg" style={{ background: theme.value }}></div>
                             <span className="text-[9px] text-white font-bold text-center leading-tight">{theme.name}</span>
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
                 <h3 className="text-white font-gaming font-bold italic uppercase">Media Uplinks</h3>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                       <LinkIcon className="w-5 h-5 text-red-600" />
                       <input type="text" placeholder="YouTube Video URL or ID" className="bg-transparent w-full text-white text-xs outline-none" value={settings.youtubeVideoId} onChange={e => onUpdateSettings({...settings, youtubeVideoId: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                       <MonitorPlay className="w-5 h-5 text-purple-500" />
                       <div className="flex-grow flex items-center justify-between">
                          <span className="text-xs text-slate-500">{settings.playVideoId ? 'Video Active' : 'No Video'}</span>
                          <label className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded-lg cursor-pointer">
                             UPLOAD
                             <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
                          </label>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                       <Instagram className="w-5 h-5 text-pink-500" />
                       <input type="text" placeholder="Instagram URL" className="bg-transparent w-full text-white text-xs outline-none" value={settings.instagramUrl || ''} onChange={e => onUpdateSettings({...settings, instagramUrl: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                       <Facebook className="w-5 h-5 text-blue-600" />
                       <input type="text" placeholder="Facebook URL" className="bg-transparent w-full text-white text-xs outline-none" value={settings.facebookUrl || ''} onChange={e => onUpdateSettings({...settings, facebookUrl: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                       <Youtube className="w-5 h-5 text-red-600" />
                       <input type="text" placeholder="YouTube Channel URL" className="bg-transparent w-full text-white text-xs outline-none" value={settings.youtubeChannelUrl || ''} onChange={e => onUpdateSettings({...settings, youtubeChannelUrl: e.target.value})} />
                     </div>
                  </div>
               </div>

               <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
                  <h3 className="text-white font-gaming font-bold italic uppercase">Battlefield Banner (Play Section)</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-grow space-y-3">
                        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                           <LinkIcon className="w-5 h-5 text-cyan-500" />
                           <input type="text" placeholder="Banner Click URL" className="bg-transparent w-full text-white text-xs outline-none" value={settings.playBannerLink || ''} onChange={e => onUpdateSettings({...settings, playBannerLink: e.target.value})} />
                        </div>
                        <div className="flex gap-2">
                           <label className="flex-grow flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold py-3 rounded-xl text-[10px] cursor-pointer uppercase tracking-widest transition-all">
                              <ImageIcon className="w-4 h-4 text-emerald-400" /> Image
                              <input type="file" className="hidden" accept="image/*" onChange={e => handlePlayBannerUpload(e, 'image')} />
                           </label>
                           <label className="flex-grow flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold py-3 rounded-xl text-[10px] cursor-pointer uppercase tracking-widest transition-all">
                              <Video className="w-4 h-4 text-purple-400" /> Video
                              <input type="file" className="hidden" accept="video/*" onChange={e => handlePlayBannerUpload(e, 'video')} />
                           </label>
                        </div>
                      </div>

                      {settings.playBannerMedia && (
                        <div className="shrink-0 w-32 aspect-video bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative group">
                          {settings.playBannerType === 'video' ? (
                            <video src={settings.playBannerMedia} className="w-full h-full object-cover" />
                          ) : (
                            <img src={settings.playBannerMedia} className="w-full h-full object-cover" alt="Preview" />
                          )}
                          <div className="absolute top-1 right-1 bg-black/40 px-1 rounded text-[6px] text-white/70 font-bold uppercase">Ad</div>
                          <button 
                            onClick={() => onUpdateSettings({...settings, playBannerMedia: null, playBannerType: null, playBannerLink: null})}
                            className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-1"
                          >
                            <Trash2 className="w-5 h-5 text-white" />
                            <span className="text-[8px] text-white font-black uppercase">Remove</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
               </div>

               <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 space-y-4">
                  <h3 className="text-white font-gaming font-bold italic uppercase flex items-center gap-2">
                    <Download className="w-5 h-5 text-emerald-500" /> Export Project (ZIP)
                  </h3>
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                      Download the full source code (components, logic, settings) in a single ZIP file for Android Studio WebView setup.
                    </p>
                    <button 
                      onClick={() => {
                        window.location.href = '/api/download-source';
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                    >
                      <Download className="w-5 h-5" />
                      GENERATE & DOWNLOAD ZIP
                    </button>
                    <p className="text-[9px] text-slate-600 italic text-center uppercase tracking-tighter">
                      This ZIP contains 100% of the current coding files.
                    </p>
                  </div>
               </div>
            </div>
         ) : activeTab === 'notify' ? (
           <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
                 <h3 className="text-white font-gaming font-bold italic uppercase flex items-center gap-2"><Bell className="w-5 h-5 text-orange-500" /> Global Broadcast</h3>
                 
                 <div className="flex gap-2 mb-2">
                   {(['BOTH', 'IN', 'ID'] as TargetCountry[]).map(c => (
                     <button
                       key={c}
                       onClick={() => setNotif({...notif, targetCountry: c})}
                       className={`flex-grow py-2 rounded-xl text-[10px] font-bold transition-all border ${notif.targetCountry === c ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                     >
                       {c === 'BOTH' ? 'ALL REGIONS' : c === 'IN' ? 'INDIA 🇮🇳' : 'INDONESIA 🇮🇩'}
                     </button>
                   ))}
                 </div>

                 <input type="text" placeholder="Alert Title" className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none" value={notif.title} onChange={e => setNotif({...notif, title: e.target.value})} />
                 <textarea placeholder="Message Content..." className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white outline-none h-32" value={notif.message} onChange={e => setNotif({...notif, message: e.target.value})} />
                 <button onClick={() => { onBroadcastNotification(notif.title, notif.message, notif.targetCountry); setNotif({title:'', message:'', targetCountry: 'BOTH'}); console.log('Broadcast Sent'); }} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl uppercase text-xs tracking-widest">TRANSMIT ALERT</button>
              </div>
              <div className="space-y-3">
                  <h4 className="text-white font-gaming font-bold italic uppercase text-xs pl-4">Broadcast History</h4>
                  {notifications.length === 0 ? (
                    <p className="text-center text-slate-600 text-xs uppercase py-4">No Active Broadcasts</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center group hover:border-red-500/30 transition-all">
                         <div className="flex-grow pr-4">
                            <p className="text-white font-bold text-sm mb-1">{n.title}</p>
                            <div className="flex items-center gap-2 mb-1">
                               <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${n.targetCountry === 'IN' ? 'bg-blue-600/20 text-blue-400' : n.targetCountry === 'ID' ? 'bg-orange-600/20 text-orange-400' : 'bg-slate-800 text-slate-400'}`}>
                                  {n.targetCountry || 'BOTH'}
                               </span>
                            </div>
                            <p className="text-slate-500 text-xs truncate max-w-[200px] sm:max-w-md">{n.message}</p>
                            <p className="text-[9px] text-slate-600 mt-1 font-mono">{new Date(n.timestamp).toLocaleString()}</p>
                         </div>
                         <button onClick={() => { 
                            console.log("Attempting to delete notification with ID:", n.id);
                            onDeleteNotification(n.id); 
                         }} className="p-3 bg-slate-950 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))
                  )}
              </div>
           </div>
        ) : activeTab === 'credentials' ? (
           <div className="max-w-5xl mx-auto space-y-4">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 sticky top-0 z-10 flex flex-col sm:flex-row gap-4">
                  <div className="flex-grow flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                    <Search className="w-5 h-5 text-slate-500" />
                    <input type="text" placeholder="Search Users..." className="bg-transparent w-full text-white outline-none" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {(['ALL', 'IN', 'ID'] as const).map(cFilter => (
                      <button
                        key={cFilter}
                        onClick={() => setUserCountryFilter(cFilter)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all border whitespace-nowrap ${userCountryFilter === cFilter ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                      >
                        {cFilter === 'ALL' ? 'GLOBAL' : cFilter === 'IN' ? 'INDIA 🇮🇳' : 'INDONESIA 🇮🇩'}
                      </button>
                    ))}
                  </div>
               </div>
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 border-bottom border-slate-800">
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">User Info</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest min-w-[200px]">Credentials</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Assets</th>
                        <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredDbUsers.map(u => (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-lg overflow-hidden border border-slate-700">
                                {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : u.name?.[0] || '?'}
                              </div>
                              <div className="max-w-[120px] sm:max-w-[200px]">
                                <div className="flex items-center gap-2">
                                  <p className="text-white font-bold text-sm truncate">{u.name}</p>
                                  <span className="text-base shrink-0">{u.country === 'IN' ? '🇮🇳' : u.country === 'ID' ? '🇮🇩' : ''}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1.5 min-w-[180px]">
                              <div className="flex items-center gap-2 text-slate-400">
                                <Mail className="w-3 h-3 shrink-0" />
                                <span className="text-xs font-mono break-all">{u.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-cyan-400">
                                <Phone className="w-3 h-3 shrink-0" />
                                <span className="text-xs font-mono">{u.phone_number || 'Not Linked'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-blue-400">
                                <Key className="w-3 h-3 shrink-0" />
                                <span className="text-xs font-mono">{u.password || 'No Pass'}</span>
                              </div>
                              <p className="text-slate-600 text-[9px] uppercase tracking-tighter">Loc: {u.permanent_location || 'Not Set'}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                <Coins className="w-3 h-3 text-yellow-500" />
                                <span className="text-xs text-white font-bold">{u.coins || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Gem className="w-3 h-3 text-cyan-400" />
                                <span className="text-xs text-white font-bold">{u.diamonds || 0}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={async () => {
                                  if (window.confirm(`Delete ${u.email}? This action cannot be undone.`)) {
                                    try {
                                      await onDeleteUser(u.id);
                                      alert("User deleted successfully.");
                                    } catch (err) {
                                      console.error("Delete action failed:", err);
                                      alert("Error deleting user.");
                                    }
                                  }
                                }}
                                className="p-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setDirectMsgUser(u)}
                                className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                                title="Message User"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <div className="flex flex-col gap-1">
                                <button 
                                  onClick={() => onUpdateAnyUser(u.id, { country: 'IN', permanent_location: 'India 🇮🇳', countryLocked: true })}
                                  className={`text-[8px] px-2 py-1 rounded font-black transition-all border ${u.country === 'IN' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                >
                                  SET IN
                                </button>
                                <button 
                                  onClick={() => onUpdateAnyUser(u.id, { country: 'ID', permanent_location: 'Indonesia 🇮🇩', countryLocked: true })}
                                  className={`text-[8px] px-2 py-1 rounded font-black transition-all border ${u.country === 'ID' ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                >
                                  SET ID
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredDbUsers.length === 0 && (
                  <div className="p-20 text-center">
                    <Search className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-600 uppercase font-black tracking-widest text-xs">No users found in this sector</p>
                  </div>
                )}
              </div>
           </div>
        ) : activeTab === 'support' ? (
          <div className="max-w-3xl mx-auto space-y-6">
             <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800">
                <h3 className="text-white font-gaming font-bold italic uppercase flex items-center gap-2 mb-4"><MessageSquare className="w-5 h-5 text-blue-500" /> User Messages</h3>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                   {supportMessages.length === 0 && <p className="text-slate-500 text-center text-sm">No messages.</p>}
                   {supportMessages.map(m => (
                      <div key={m.id} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 group hover:border-blue-500/30 transition-all">
                         <div className="flex justify-between items-start">
                            <div>
                               {m.image && (
                                  <div className="mb-2 rounded-xl overflow-hidden border border-slate-800 max-w-[200px] cursor-pointer" onClick={() => window.open(m.image, '_blank')}>
                                     <img src={m.image} className="w-full h-auto object-cover" alt="User Sent" referrerPolicy="no-referrer" />
                                  </div>
                               )}
                               <p className="text-white font-bold text-sm italic mb-1">{m.text}</p>
                               <span className="text-[9px] text-slate-500 font-mono">{new Date(m.timestamp).toLocaleString()} • User ID: {m.userId}</span>
                            </div>
                            <button onClick={() => deleteSupportMessage(m.id)} className="text-slate-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                         </div>
                         {m.reply ? (
                            <div className="bg-blue-900/20 border border-blue-900/50 p-3 rounded-xl">
                               <p className="text-blue-200 text-xs"><span className="font-bold text-blue-400">Admin:</span> {m.reply}</p>
                            </div>
                         ) : (
                            <div className="flex gap-2">
                               <input 
                                 type="text" 
                                 placeholder="Type Reply..." 
                                 className="flex-grow bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-blue-500"
                                 value={replyText[m.id] || ''}
                                 onChange={(e) => setReplyText({...replyText, [m.id]: e.target.value})}
                               />
                               <button onClick={() => sendReply(m.id)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg font-bold text-xs"><Send className="w-3 h-3" /></button>
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             </div>
          </div>
        ) : null}

        {directMsgUser && (
           <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-6 z-[210] animate-in slide-in-from-bottom">
              <div className="max-w-2xl mx-auto flex flex-col gap-3">
                 <div className="flex justify-between items-center">
                    <h4 className="text-white font-bold text-sm">Message to: <span className="text-yellow-500">{directMsgUser.name}</span></h4>
                    <button onClick={() => setDirectMsgUser(null)}><X className="w-5 h-5 text-slate-500" /></button>
                 </div>
                 <div className="flex gap-2">
                    <input 
                       type="text" 
                       className="flex-grow bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-yellow-500" 
                       placeholder="Type admin message..."
                       value={directMsgText}
                       onChange={(e) => setDirectMsgText(e.target.value)}
                    />
                    <button onClick={sendDirectMessage} className="bg-yellow-500 text-slate-950 font-black px-6 rounded-xl hover:bg-yellow-400 uppercase text-xs">SEND</button>
                 </div>
              </div>
           </div>
        )}
      </div>

    </div>
  );
};

export default AdminPanel;
