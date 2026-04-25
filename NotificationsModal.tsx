
import React from 'react';
import { X, Bell, Clock, Trash2 } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsModalProps {
  notifications: AppNotification[];
  onClose: () => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  t: any;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ notifications, onClose, isAdmin, onDelete, t }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-[2.5rem] relative shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-yellow-500" />
            <h3 className="text-white font-gaming font-bold italic uppercase tracking-wider">{t.alert_center}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4 no-scrollbar">
          {notifications.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm italic font-medium tracking-wide">{t.no_alerts}</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 hover:border-yellow-500/30 transition-colors relative group">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-grow">
                    <h4 className="text-white font-bold text-sm mb-1 italic">{n.title}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed mb-3">{n.message}</p>
                  </div>
                  {isAdmin && onDelete && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(n.id);
                      }}
                      className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                      title="Delete Notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  {new Date(n.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 bg-slate-950/50 text-center">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{t.end_transmission}</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
