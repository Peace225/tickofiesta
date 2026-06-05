import React, { useState, useEffect } from 'react';
import { supabase } from "../config/supabaseClient"; // Ajustez le chemin selon votre projet
import { FaWhatsapp, FaCopy, FaCheck } from 'react-icons/fa'; // Nécessite npm install react-icons

export default function ReferralCard({ userId }) {
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupération du code de parrainage depuis la table profiles
    const fetchReferralCode = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', userId)
          .single();

        if (error) throw error;
        
        if (data && data.referral_code) {
          setReferralCode(data.referral_code);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du code :', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchReferralCode();
    }
  }, [userId]);

  // Génération dynamique de l'URL et du texte de partage
  const shareUrl = `https://tickofiesta.com/inscription?ref=${referralCode}`;
  const shareText = `🔥 Rejoins-moi sur TickoFiesta pour accéder aux meilleurs événements d'Abidjan ! Utilise mon code VIP : ${referralCode}`;

  // Fonction pour copier dans le presse-papier
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500); // Remet le bouton à l'état initial après 2.5s
  };

  // Fonction pour ouvrir WhatsApp avec le message pré-rempli
  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500 animate-pulse">Génération de votre code VIP...</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 p-6 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Invitez vos amis</h3>
        <p className="text-purple-100 text-sm">Gagnez des réductions sur vos prochains tickets pour chaque ami inscrit !</p>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Votre lien unique</label>
          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1">
            <input 
              type="text" 
              readOnly 
              value={shareUrl}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-600 px-3 outline-none"
            />
            <button 
              onClick={handleCopy}
              className={`flex items-center justify-center p-2 rounded-md transition-colors ${copied ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
              title="Copier le lien"
            >
              {copied ? <FaCheck size={16} /> : <FaCopy size={16} />}
            </button>
          </div>
        </div>

        <button 
          onClick={handleWhatsAppShare}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-4 rounded-xl transition-transform active:scale-95"
        >
          <FaWhatsapp size={20} />
          Partager sur WhatsApp
        </button>
      </div>
    </div>
  );
}