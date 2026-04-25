
import React, { useState } from 'react';
import { Tournament, TournamentType, User } from '../types';
import { Users, User as SoloUser, Gem, ChevronRight, Lock, CheckCircle2, Shield, Trophy, X, Copy, Check, Ban } from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
  onJoin: () => void;
  onCancel?: () => void;
  isJoined?: boolean;
  user?: User | null;
  t: any;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, onJoin, onCancel, isJoined, user, t }) => {
  const [showResult, setShowResult] = useState(false);
  const [copiedState, setCopiedState] = useState<'id' | 'pass' | null>(null);
  
  // 1. Precise Number Conversion
  const filled = Number(tournament.filledSlots) || 0;
  const total = Number(tournament.slots) || 0; 
  
  // 2. Logic Check: Is it full?
  const isFull = total > 0 && filled >= total;
  const isFinished = tournament.status === 'FINISHED';
  const isCancelled = !isJoined && tournament.id === user?.lastJoinedTournamentId && user?.cancelReason;
  
  // 3. Progress Formula: (joined / total) * 100
  let progressPercent = 0;
  if (total > 0) {
    progressPercent = (filled / total) * 100;
  }
  
  // 4. Safety Clamp (0% to 100%)
  progressPercent = Math.min(100, Math.max(0, progressPercent));

  // Visual enhancement
  if (filled > 0 && progressPercent < 2) progressPercent = 2;

  const handleCopy = (text: string, type: 'id' | 'pass') => {
    if (!text || text === 'WAITING...') return;
    navigator.clipboard.writeText(text);
    setCopiedState(type);
    setTimeout(() => setCopiedState(null), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden group hover:border-yellow-500/50 transition-all duration-500 flex flex-col shadow-xl hover:shadow-yellow-500/5">
      {/* Banner Image Section */}
      <div className="aspect-[16/9] relative overflow-hidden bg-slate-950">
        <img 
          src={tournament.image} 
          alt={tournament.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
        
        {/* Type Badge */}
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="bg-yellow-500 text-slate-950 text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            {tournament.type === TournamentType.SQUAD ? <Users className="w-3 h-3" /> : <SoloUser className="w-3 h-3" />}
            {tournament.type}
          </div>
          {isJoined && !isFinished && (
            <div className="bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> {t.joined_badge}
            </div>
          )}
        </div>

        {/* Entry Fee Badge */}
        {!isFinished && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-2xl flex items-center gap-2">
            <Gem className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-gaming font-bold text-white italic">{tournament.entryFee}</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Title & Info */}
        <div>
          <h3 className="text-xl font-gaming font-bold text-white italic tracking-tight mb-1 group-hover:text-yellow-500 transition-colors">
            {tournament.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <Shield className="w-3 h-3 text-slate-500" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">STARK PRO BATTLEGROUND</span>
            </div>
            {isCancelled && (
              <div className="bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg animate-pulse">
                <span className="text-[8px] text-red-500 font-black uppercase tracking-widest">{t.rejected}</span>
              </div>
            )}
          </div>
        </div>

        {isCancelled && (
          <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <Ban className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">{t.cancel_reason}</p>
              <p className="text-xs text-white font-medium italic">"{ user?.cancelReason }"</p>
            </div>
          </div>
        )}

        {/* Prize & Status Grid */}
        <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.total_prize}</span>
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-cyan-400" />
              <span className="text-lg font-gaming font-bold text-white italic">{tournament.prizePool}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.status}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isFull ? 'text-red-500' : 'text-green-500'}`}>
              {isFull ? t.house_full : t.open_entry}
            </span>
          </div>
        </div>

        {isFinished ? (
          <button onClick={() => setShowResult(true)} className="w-full py-4 rounded-2xl bg-purple-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg flex items-center justify-center gap-3">
            <Trophy className="w-4 h-4" /> {t.view_result}
          </button>
        ) : (
          <>
            {/* Progress Bar System */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] px-1">
                <span className="text-slate-500">
                  {isFull ? t.reg_closed : t.recruitment_progress}
                </span>
                <span className={`${isFull ? 'text-red-500' : 'text-yellow-500'} italic`}>
                  {t.filled}: {filled} / {total}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full border border-slate-800 p-[2px] overflow-hidden relative shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ease-out ${isFull ? 'bg-red-600' : 'bg-gradient-to-r from-yellow-600 to-yellow-400'}`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Action Buttons */}
            {isJoined ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-yellow-500/20 space-y-3">
                  {/* Room ID Row */}
                  <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{t.room_id}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-gaming font-bold text-white select-all">
                        {tournament.roomId || 'WAITING...'}
                      </span>
                      {(tournament.roomId && tournament.roomId !== 'WAITING...') && (
                        <button 
                          onClick={() => handleCopy(tournament.roomId || '', 'id')}
                          className="text-slate-400 hover:text-yellow-500 transition-colors"
                        >
                          {copiedState === 'id' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Password Row */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{t.room_pass}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-gaming font-bold text-white select-all">
                        {tournament.roomPassword || 'WAITING...'}
                      </span>
                      {(tournament.roomPassword && tournament.roomPassword !== 'WAITING...') && (
                        <button 
                           onClick={() => handleCopy(tournament.roomPassword || '', 'pass')}
                           className="text-slate-400 hover:text-yellow-500 transition-colors"
                        >
                          {copiedState === 'pass' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Leave Button */}
                  <div className="pt-4 border-t border-slate-700">
                    <button 
                      onClick={onCancel}
                      className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      {t.leave_tournament}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={onJoin}
                disabled={isFull}
                className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] transition-all ${
                  isFull 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                    : 'bg-yellow-500 text-slate-950 hover:bg-yellow-400 shadow-lg shadow-yellow-500/20'
                }`}
              >
                {isFull ? (
                  <><Lock className="w-4 h-4" /> {t.slot_full}</>
                ) : (
                  <><span className="uppercase text-xs">{t.join_engagement}</span><ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Result Modal */}
      {showResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setShowResult(false)}></div>
          <div className="bg-slate-900 border border-purple-500/30 w-full max-w-lg rounded-[2.5rem] relative shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-white font-gaming font-bold italic uppercase tracking-wider">{t.official_result}</h3>
              <button onClick={() => setShowResult(false)} className="p-2 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-8 space-y-6 text-center">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 block">{t.champion}</span>
                <h4 className="text-3xl font-gaming font-bold text-yellow-500 italic uppercase">{tournament.winnerName || t.undeclared}</h4>
              </div>
              <div className="aspect-video rounded-3xl overflow-hidden border-2 border-slate-800 bg-slate-950">
                {tournament.resultImage ? <img src={tournament.resultImage} className="w-full h-full object-contain" alt="Result" /> : <p className="text-slate-700 p-10 uppercase text-xs font-black">{t.proof_pending}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentCard;
