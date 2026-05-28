import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { X, Wallet, TrendingUp, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

// MODAL DE TRAÇABILITÉ
function TransactionDetail({ organisateurId, nomOrg, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      const { data: events } = await supabase.from('events').select('id').eq('organisateur_id', organisateurId);
      const { data: votes } = await supabase.from('votes').select('id').eq('organisateur_id', organisateurId);
      
      const eventIds = events?.map(e => e.id) || [];
      const voteIds = votes?.map(v => v.id) || [];

      const { data } = await supabase
        .from('purchases')
        .select('*')
        .eq('status', 'completed')
        .or(`event_id.in.(${eventIds.length > 0 ? eventIds.join(',') : 'null'}),vote_id.in.(${voteIds.length > 0 ? voteIds.join(',') : 'null'})`)
        .order('created_at', { ascending: false });

      setTransactions(data || []);
      setLoading(false);
    }
    fetchDetails();
  }, [organisateurId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-[#0A0A12] border border-white/10 w-full max-w-2xl rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-white font-black text-2xl">Traçabilité : {nomOrg}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white"><X size={24} /></button>
        </div>
        <div className="overflow-y-auto max-h-[50vh] custom-scrollbar">
          {loading ? <div className="flex justify-center p-10"><Spinner /></div> : (
            <table className="w-full text-white">
              <thead className="text-slate-500 text-[10px] uppercase tracking-widest border-b border-white/5">
                <tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Réf</th><th className="p-3 text-right">Montant</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-white/5">
                    <td className="p-4">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-mono text-amber-500">{t.reference}</td>
                    <td className="p-4 text-right">{t.montant?.toLocaleString()} F</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Commissions() {
  const { dark } = useSelector((s) => s.theme);
  const [organisateurs, setOrganisateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const loadCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: purchases } = await supabase.from('purchases').select('*').eq('status', 'completed');
      const { data: allEvents } = await supabase.from('events').select('id, organisateur_id');
      const { data: allVotes } = await supabase.from('votes').select('id, organisateur_id');
      const { data: profiles } = await supabase.from('profiles').select('id, nom');

      const orgMap = {};
      purchases?.forEach(p => {
        const orgId = allEvents?.find(e => e.id === p.event_id)?.organisateur_id || 
                      allVotes?.find(v => v.id === p.vote_id)?.organisateur_id;
        
        if (orgId) {
          if (!orgMap[orgId]) {
            const prof = profiles?.find(pr => pr.id === orgId);
            orgMap[orgId] = { id: orgId, nom: prof?.nom || 'Inconnu', totalVentes: 0, totalCommission: 0 };
          }
          orgMap[orgId].totalVentes += (p.montant || 0);
          orgMap[orgId].totalCommission += (allEvents?.find(e => e.id === p.event_id)) ? (p.montant * 0.05) : (p.montant * 0.20);
        }
      });
      setOrganisateurs(Object.values(orgMap));
    } catch (err) { toast.error('Erreur chargement'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadCommissions(); }, [loadCommissions]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="bg-[#0A0A12]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <h2 className="text-white text-2xl font-black mb-8 tracking-tighter flex items-center gap-3">
          <Wallet className="text-amber-500" /> Registre des Flux Financiers
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                <th className="p-4 text-left">Partenaire</th>
                <th className="p-4 text-right">Volume</th>
                <th className="p-4 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {organisateurs.map(org => (
                <tr key={org.id} onClick={() => setSelectedOrg(org)} className="group cursor-pointer hover:bg-white/5 transition-all">
                  <td className="p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 flex items-center justify-center text-amber-500 font-black">{org.nom[0]}</div>
                    <span className="text-white font-bold text-sm">{org.nom}</span>
                  </td>
                  <td className="p-5 text-right text-slate-300 font-mono text-sm">{org.totalVentes.toLocaleString()} F</td>
                  <td className="p-5 text-right text-amber-400 font-black text-sm group-hover:scale-105 transition-transform">+{org.totalCommission.toLocaleString()} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrg && (
        <TransactionDetail 
          organisateurId={selectedOrg.id} 
          nomOrg={selectedOrg.nom} 
          onClose={() => setSelectedOrg(null)} 
        />
      )}
      {loading && <div className="flex justify-center"><Spinner /></div>}
    </div>
  );
}