
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User as UserIcon, Clock, CheckCheck, ShieldCheck, ImageIcon, Camera, Loader2 } from 'lucide-react';
import { Message, User } from '../types';
import { uploadToCloudinary } from '../firebase';

interface ChatViewProps {
  user: User;
  messages: Message[];
  onSendMessage: (text: string, image?: string) => Promise<void>;
  onClose: () => void;
  t: any;
}

const ChatView: React.FC<ChatViewProps> = ({ user, messages, onSendMessage, onClose, t }) => {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    await onSendMessage(inputText);
    setInputText('');
    setSending(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploading) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'image');
      await onSendMessage("Sent a photo", url);
    } catch (err) {
      console.error("Chat photo upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] flex flex-col animate-in slide-in-from-right duration-300">
      {/* WhatsApp Style Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <ShieldCheck className="text-slate-950 w-6 h-6" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h3 className="text-white font-bold leading-none">{t.team_support}</h3>
            <span className="text-[10px] text-green-500 font-bold uppercase tracking-wider">{t.online}</span>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-grow overflow-y-auto p-4 space-y-4 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
              <UserIcon className="w-10 h-10 text-slate-700" />
            </div>
            <p className="text-slate-500 text-sm font-medium">{t.no_messages}<br/>{t.type_to_start}</p>
          </div>
        ) : (
          messages.map((m) => (
            <React.Fragment key={m.id}>
              {/* User Message */}
              <div className="flex flex-col items-end">
                <div className="max-w-[80%] bg-yellow-500 text-slate-950 p-3 rounded-2xl rounded-tr-none shadow-lg relative group">
                  {m.image && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                      <img src={m.image} className="w-full h-auto max-h-60 object-cover" alt="Sent" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <p className="text-sm font-medium">{m.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                    <span className="text-[9px] font-bold">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <CheckCheck className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Admin Reply */}
              {m.reply && (
                <div className="flex flex-col items-start">
                  <div className="max-w-[80%] bg-slate-800 text-white p-3 rounded-2xl rounded-tl-none shadow-lg border border-slate-700">
                    <p className="text-sm">{m.reply}</p>
                    <div className="flex items-center gap-1 mt-1 opacity-50">
                      <span className="text-[9px] font-bold">{t.support_team}</span>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          )).reverse() // Show oldest at top
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="bg-slate-900 p-4 border-t border-slate-800 flex items-center gap-3">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileSelect}
        />
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-3 bg-slate-800 text-slate-400 rounded-2xl hover:text-white transition-all disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        </button>
        <div className="flex-grow relative">
          <input 
            type="text" 
            placeholder={t.message_placeholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-4 pr-12 text-white text-sm focus:outline-none focus:border-yellow-500 transition-all"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        <button 
          type="submit"
          disabled={!inputText.trim() || sending}
          className="bg-yellow-500 p-3 rounded-2xl text-slate-950 hover:bg-yellow-400 transition-all active:scale-90 shadow-[0_0_15px_rgba(234,179,8,0.3)] disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatView;
