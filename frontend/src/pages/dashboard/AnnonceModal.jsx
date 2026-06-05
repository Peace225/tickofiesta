import React, { useState, useEffect } from 'react';
import { X, Megaphone, Sparkles, Loader2, CheckSquare, Square } from 'lucide-react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import toast from 'react-hot-toast';

export default function AnnonceModal({ isOpen, onClose, subscriberCount, subscribers = [] }) {
  const [title, setTitle] = useState('Nouvelle annonce TickoFiesta');
  const [message, setMessage] = useState("Découvrez notre événement ici : https://tickofiesta.com/event/123");
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [isSending, setIsSending] = useState(false);
  
  const dark = useSelector((state) => state.theme?.dark) ?? false;
  const { user } = useSelector((state) => state.auth);

  // Initialisation : sélectionner tous les emails par défaut à l'ouverture
  useEffect(() => {
    if (subscribers.length > 0) {
      setSelectedEmails(subscribers.map(s => s.profiles?.email).filter(Boolean));
    }
  }, [subscribers]);

  const toggleEmail = (email) => {
    setSelectedEmails(prev => 
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleSend = async () => {
    if (selectedEmails.length === 0) {
      toast.error("Veuillez sélectionner au moins un destinataire.");
      return;
    }

    setIsSending(true);
    try {
      // 1. Insertion en base de données avec récupération de l'ID généré
      const { data: campaign, error: dbError } = await supabase
        .from('campaign_stats')
        .insert({ 
          organisateur_id: user.id, 
          campaign_id: title, // Utilisé pour le nom de la campagne
          emails_sent: selectedEmails.length 
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Transformation des liens avec tracking
      const functionUrl = "https://kmtnulchjoljeyplfoin.supabase.co/functions/v1/track-click";
      const trackedMessage = message.replace(/(https?:\/\/[^\s]+)/g, (url) => {
        return `${functionUrl}?campaign_id=${campaign.id}&url=${encodeURIComponent(url)}`;
      });

      // 3. Appel de la Edge Function d'envoi
      const { error: sendError } = await supabase.functions.invoke('send-announcement', {
        body: { title, message: trackedMessage, emails: selectedEmails },
      });

      if (sendError) throw sendError;
      
      toast.success(`Annonce envoyée à ${selectedEmails.length} abonnés !`);
      onClose();
    } catch (err) {
  // Affiche le message d'erreur explicite de Supabase
  console.error("Erreur détaillée:", err.message);
  console.error("Détails complets:", err);
  toast.error(`Erreur: ${err.message || "Échec de l'envoi"}`);
} finally {
  setIsSending(false);
}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`${dark ? 'bg-[#0f0f12] border-zinc-800' : 'bg-white'} w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border relative max-h-[90vh] flex flex-col`}>
        
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Sélectionner les destinataires</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
        </div>

        {/* LISTE DES EMAILS SÉLECTIONNABLES */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-2 pr-2">
          {subscribers.map((s) => {
            const email = s.profiles?.email;
            if (!email) return null;
            const isSelected = selectedEmails.includes(email);
            return (
              <div key={email} onClick={() => toggleEmail(email)} 
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border ${isSelected ? 'border-violet-500 bg-violet-50/10' : 'border-transparent'}`}>
                {isSelected ? <CheckSquare className="text-violet-500" size={20}/> : <Square size={20} className="text-gray-400"/>}
                <span className={`text-sm ${dark ? 'text-gray-300' : 'text-gray-700'}`}>{email}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <input className="w-full p-3 rounded-xl bg-gray-100 border-none" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="w-full p-3 rounded-xl bg-gray-100 border-none" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
          <button onClick={handleSend} disabled={isSending || selectedEmails.length === 0}
            className="w-full py-4 font-black rounded-2xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50">
            {isSending ? <Loader2 className="animate-spin" /> : `Envoyer à ${selectedEmails.length} destinataires`}
          </button>
        </div>
      </div>
    </div>
  );
}