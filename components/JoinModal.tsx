
import React, { useState } from 'react';
import { X, Shield, Camera, Upload, Loader2, Trophy, ArrowRight, AlertTriangle, Users, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { Tournament, User, TournamentType } from '../types';
import { firebaseJoinTournament, uploadToCloudinary } from '../firebase';

interface JoinModalProps {
  tournament: Tournament;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
  t: any;
}

const JoinModal: React.FC<JoinModalProps> = ({ tournament, user, onClose, onSuccess, t }) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // SOLO State
  const [soloFfId, setSoloFfId] = useState('');
  const [soloPhoto, setSoloPhoto] = useState<string | null>(null);

  // SQUAD State
  const [teamName, setTeamName] = useState('');
  const [teamLogo, setTeamLogo] = useState<string | null>(null);
  const [squadMembers, setSquadMembers] = useState([
    { name: '', ffId: '', photo: null as string | null }, // Member 1 (Leader)
    { name: '', ffId: '', photo: null as string | null }, // Member 2
    { name: '', ffId: '', photo: null as string | null }, // Member 3
    { name: '', ffId: '', photo: null as string | null }  // Member 4
  ]);

  // Use 'diamonds' instead of kohinoor
  const canAfford = (user.diamonds || 0) >= (tournament.entryFee || 0);
  const isSquad = tournament.type === TournamentType.SQUAD;

  const updateMember = (index: number, field: string, value: string) => {
    const newMembers = [...squadMembers];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setSquadMembers(newMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAfford) return;

    // Validation
      if (!isSquad) {
        if (!soloFfId || !soloPhoto) {
          setErrorMsg(t.fill_id_photo);
          return;
        }
      } else {
        if (!teamName || !teamLogo) {
          setErrorMsg(t.team_name_logo_req);
          return;
        }
        for (let i = 0; i < 4; i++) {
          const m = squadMembers[i];
          if (!m.name || !m.ffId || !m.photo) {
            setErrorMsg(`${t.player} ${i + 1} ${t.details_incomplete}`);
            return;
          }
        }
      }

    setLoading(true);
    setErrorMsg(null);

    try {
      let regData: any = {
        tournamentId: tournament.id,
        isSquad: isSquad
      };

      if (!isSquad) {
        // SOLO JOIN LOGIC
        setLoadingText(t.uploading_proof);
        const finalPhotoUrl = await uploadToCloudinary(soloPhoto!, 'image');
        regData.freeFireId = soloFfId;
        regData.idPhoto = finalPhotoUrl;
      } else {
        // SQUAD JOIN LOGIC
        setLoadingText(t.uploading_team);
        
        // Upload Team Logo
        const finalTeamLogo = await uploadToCloudinary(teamLogo!, 'image');
        
        // Upload All Member Photos
        const uploadedMembers = await Promise.all(squadMembers.map(async (m, idx) => {
           setLoadingText(`${t.uploading_player} ${idx+1}...`);
           const pUrl = await uploadToCloudinary(m.photo!, 'image');
           return {
             name: m.name,
             ffId: m.ffId,
             photo: pUrl
           };
        }));

        regData.teamName = teamName;
        regData.teamLogo = finalTeamLogo;
        regData.squadMembers = uploadedMembers;
        regData.freeFireId = uploadedMembers[0].ffId; // Leader ID for quick ref
      }

      setLoadingText(t.processing_fee);
      const result = await firebaseJoinTournament(user.id, regData, tournament.entryFee);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => onSuccess(), 1500);
      } else {
        setErrorMsg(result.error || "Update failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      if (!success) setLoading(false);
      setLoadingText('');
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl"></div>
        <div className="bg-slate-900 border border-yellow-500/50 w-full max-w-md rounded-[3rem] p-12 text-center relative shadow-2xl">
          <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trophy className="w-10 h-10 text-slate-950" /></div>
          <h2 className="text-2xl font-gaming font-bold text-white mb-4 italic uppercase">{t.joined_success}</h2>
          <p className="text-slate-400 text-sm">{t.slot_confirmed}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[2.5rem] relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {loading && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
             <Loader2 className="w-12 h-12 text-yellow-500 animate-spin mb-4" />
             <p className="text-white font-gaming font-bold italic uppercase tracking-widest text-sm">{loadingText}</p>
          </div>
        )}

        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
             {isSquad ? <Users className="w-5 h-5 text-yellow-500" /> : <UserIcon className="w-5 h-5 text-yellow-500" />}
             <h3 className="text-white font-gaming font-bold italic text-sm uppercase">{isSquad ? t.squad_reg : t.solo_enroll}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {errorMsg && (
            <div className="bg-red-600/10 border border-red-600/30 p-4 rounded-2xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{errorMsg}</p>
            </div>
          )}

          {/* PHOTO GUIDELINES SECTION */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl space-y-3">
             <div className="flex gap-3">
               <Shield className="w-5 h-5 text-blue-400 shrink-0" />
               <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wide leading-relaxed">
                 {t.photo_guideline}
               </p>
             </div>
             
             <div className="flex items-end justify-center gap-6 pt-2">
                {/* Correct 1 */}
                <div className="flex flex-col items-center gap-2">
                   <div className="relative group">
                     <img 
                       src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=250&fit=crop&q=80" 
                       className="w-16 h-20 rounded-lg border-2 border-green-500 bg-slate-800 object-cover shadow-lg shadow-green-500/20" 
                       alt="Correct Pose 1"
                     />
                     <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full border border-slate-800">
                       <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/20" />
                     </div>
                   </div>
                   <span className="text-[8px] font-black text-green-500 uppercase tracking-wider">{t.straight}</span>
                </div>

                {/* Correct 2 */}
                <div className="flex flex-col items-center gap-2">
                   <div className="relative group">
                     <img 
                       src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=250&fit=crop&q=80" 
                       className="w-16 h-20 rounded-lg border-2 border-green-500 bg-slate-800 object-cover shadow-lg shadow-green-500/20" 
                       alt="Correct Pose 2"
                     />
                     <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full border border-slate-800">
                       <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-500/20" />
                     </div>
                   </div>
                   <span className="text-[8px] font-black text-green-500 uppercase tracking-wider">{t.straight}</span>
                </div>

                {/* Incorrect (Crooked) */}
                <div className="flex flex-col items-center gap-2">
                   <div className="relative group opacity-80">
                     <img 
                       src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=250&fit=crop&q=80" 
                       className="w-16 h-20 rounded-lg border-2 border-red-500 bg-slate-800 object-cover shadow-lg rotate-6 grayscale-[0.5]" 
                       alt="Wrong Pose"
                     />
                     <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full border border-slate-800 z-10">
                       <X className="w-5 h-5 text-red-500 fill-red-500/20" />
                     </div>
                   </div>
                   <span className="text-[8px] font-black text-red-500 uppercase tracking-wider">{t.crooked}</span>
                </div>
             </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center justify-between">
             <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{t.entry_fee}</span>
             <span className="text-sm font-gaming font-bold text-white italic">{tournament.entryFee} {t.kohinoor}</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isSquad ? (
              // SOLO FORM
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder={t.ff_id_placeholder} 
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white text-xs outline-none focus:border-yellow-500" 
                  value={soloFfId} 
                  onChange={e => setSoloFfId(e.target.value)} 
                  required 
                />

                <label className="flex items-center gap-4 bg-slate-950 border border-slate-800 p-4 rounded-xl cursor-pointer">
                  <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center">
                    {soloPhoto ? <img src={soloPhoto} className="w-full h-full object-cover rounded-lg" /> : <Camera className="w-6 h-6 text-slate-700" />}
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase">{soloPhoto ? t.photo_loaded : t.upload_photo}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if(file) {
                      const r = new FileReader();
                      r.onloadend = () => setSoloPhoto(r.result as string);
                      r.readAsDataURL(file);
                    }
                  }} required />
                </label>
              </div>
            ) : (
              // SQUAD FORM
              <div className="space-y-6">
                 {/* Team Info */}
                 <div className="space-y-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
                    <h4 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-2">{t.team_details}</h4>
                    <div className="flex gap-4">
                       <div className="flex flex-col gap-2 shrink-0 items-center">
                         <label className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center cursor-pointer hover:border-yellow-500/50 transition-colors relative overflow-hidden">
                            {teamLogo ? <img src={teamLogo} className="w-full h-full object-cover" /> : <Upload className="w-6 h-6 text-slate-700" />}
                            <input type="file" className="hidden" accept="image/*" onChange={e => {
                                const f = e.target.files?.[0];
                                if(f) {
                                  const r = new FileReader();
                                  r.onloadend = () => setTeamLogo(r.result as string);
                                  r.readAsDataURL(f);
                                }
                            }} />
                         </label>
                         <span className="text-[9px] font-black text-slate-500 uppercase text-center">{t.gaming_logo}</span>
                       </div>
                       <div className="flex-grow">
                          <input 
                            type="text" 
                            placeholder={t.team_name} 
                            className="w-full h-full bg-slate-950 border border-slate-800 p-4 rounded-xl text-white text-xs outline-none focus:border-yellow-500" 
                            value={teamName} 
                            onChange={e => setTeamName(e.target.value)} 
                          />
                       </div>
                    </div>
                 </div>

                 {/* Members 1-4 */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{t.squad_roster}</h4>
                    {squadMembers.map((member, idx) => (
                      <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{t.player} 0{idx+1} {idx === 0 && `(${t.leader})`}</span>
                         </div>
                         <div className="flex gap-3">
                            <label className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer shrink-0 border border-slate-800 overflow-hidden">
                               {member.photo ? <img src={member.photo} className="w-full h-full object-cover" /> : <Camera className="w-4 h-4 text-slate-700" />}
                               <input type="file" className="hidden" accept="image/*" onChange={e => {
                                  const f = e.target.files?.[0];
                                  if(f) {
                                    const r = new FileReader();
                                    r.onloadend = () => updateMember(idx, 'photo', r.result as string);
                                    r.readAsDataURL(f);
                                  }
                               }} />
                            </label>
                            <div className="flex-grow space-y-2">
                               <input 
                                 type="text" 
                                 placeholder={t.ign_placeholder} 
                                 className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-white text-[10px] outline-none focus:border-yellow-500"
                                 value={member.name}
                                 onChange={e => updateMember(idx, 'name', e.target.value)}
                               />
                               <input 
                                 type="text" 
                                 placeholder={t.ff_id_short} 
                                 className="w-full bg-slate-900 border border-slate-800 p-2 rounded-lg text-white text-[10px] outline-none focus:border-yellow-500"
                                 value={member.ffId}
                                 onChange={e => updateMember(idx, 'ffId', e.target.value)}
                               />
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            <button type="submit" disabled={loading || !canAfford} className="w-full py-5 bg-yellow-500 text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50 hover:bg-yellow-400 transition-colors shadow-xl">
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (canAfford ? (isSquad ? t.deploy_squad : t.confirm_solo) : t.insufficient_funds)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinModal;
