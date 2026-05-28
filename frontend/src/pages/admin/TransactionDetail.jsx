// components/admin/TransactionDetail.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../../config/supabaseClient';

export default function TransactionDetail({ organisateurId, nomOrg, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      // On récupère les événements et votes de l'organisateur
      const { data: events } = await supabase.from('events').select('id').eq('organisateur_id', organisateurId);
      const { data: votes } = await supabase.from('votes').select('id').eq('organisateur_id', organisateurId);
      
      const eventIds = events?.map(e => e.id) || [];
      const voteIds = votes?.map(v => v.id) || [];

      // On récupère tous les achats liés
      const { data } = await supabase
        .from('purchases')
        .select('*, events(titre), votes(titre)')
        .or(`event_id.in.(${eventIds}),vote_id.in.(${voteIds})`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      setTransactions(data || []);
      setLoading(false);
    }
    fetchDetails();
  }, [organisateurId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0A0A12] border border-white/10 w-full max-w-2xl max-h-[80vh] rounded-2xl p-6 overflow-y-auto">
        <h2 className="text-white font-black mb-4">Traçabilité : {nomOrg}</h2>
        {loading ? <p className="text-white">Chargement...</p> : (
          <table className="w-full text-white text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="p-2">Date</th>
                <th className="p-2">Référence</th>
                <th className="p-2">Source</th>
                <th className="p-2">Montant</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b border-white/5">
                  <td className="p-2">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="p-2">{t.reference}</td>
                  <td className="p-2">{t.events?.titre || t.votes?.titre || 'Inconnu'}</td>
                  <td className="p-2">{t.montant} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button onClick={onClose} className="mt-4 bg-amber-500 text-black px-4 py-2 rounded-lg font-bold">Fermer</button>
      </div>
    </div>
  );
}