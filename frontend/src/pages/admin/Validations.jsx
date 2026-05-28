import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../config/supabaseClient';
import { Clock, Trophy, Trash2, ImageIcon, History, Store, HeartHandshake, Calendar, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function Validations() {
  const [activeTab, setActiveTab] = useState('events');
  const [viewMode, setViewMode] = useState('pending');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Liste globale des statuts considérés comme "traités/validés"
  const VALIDATED_STATUSES = ['occupé', 'réservé', 'validé', 'actif', 'confirmé', 'approuvé'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: results, error } = await supabase.from(activeTab).select('*');
    
    if (error) {
      toast.error("Erreur de chargement");
      console.error("Erreur Fetch:", error);
    } else {
      const filtered = (results || []).filter(item => {
        const status = (item.statut || '').toLowerCase().trim();
        const isValidated = VALIDATED_STATUSES.includes(status);
        return viewMode === 'history' ? isValidated : !isValidated;
      });
      setData(filtered);
    }
    setLoading(false);
  }, [activeTab, viewMode]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handleValidate = async (item) => {
    if (!item?.id) return false;
    
    // ✅ CORRECTION : Attribution dynamique du statut selon le type d'élément
    let targetStatus = 'validé'; // Par défaut pour Événements et Cagnottes
    
    if (activeTab === 'stands') {
      targetStatus = 'occupé'; // Pour respecter la contrainte stands_statut_check
    } else if (activeTab === 'votes') {
      targetStatus = 'actif'; // Souvent utilisé pour activer les compétitions
    }

    const { data: updatedData, error } = await supabase
      .from(activeTab)
      .update({ statut: targetStatus }) 
      .eq('id', item.id)
      .select();

    if (error) {
      console.error("Erreur lors de la validation:", error);
      toast.error(`Erreur: ${error.message}`);
      return false;
    }
    
    if (updatedData) {
      toast.success("Élément validé et publié avec succès !");
      setData(prev => prev.filter(i => i.id !== item.id));
      return true;
    }
    return false;
  };

  const handleDelete = async (item) => {
    if (!item?.id) return false;
    if (!window.confirm("Supprimer définitivement cet élément ?")) return false;
    
    const { error } = await supabase.from(activeTab).delete().eq('id', item.id);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return false;
    }
    
    toast.success("Élément supprimé");
    setData(prev => prev.filter(i => i.id !== item.id));
    return true;
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex bg-slate-900/5 p-1 rounded-2xl">
          <button onClick={() => setViewMode('pending')} className={`px-6 py-3 rounded-xl transition-all ${viewMode === 'pending' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}><Clock size={16} className="inline mr-2"/> À Traiter</button>
          <button onClick={() => setViewMode('history')} className={`px-6 py-3 rounded-xl transition-all ${viewMode === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}><History size={16} className="inline mr-2"/> Historique</button>
        </div>

        <div className="flex flex-wrap bg-slate-900/5 p-1 rounded-2xl ml-auto gap-1">
          {[
            { id: 'events', label: 'Événements', icon: Calendar },
            { id: 'votes', label: 'Votes', icon: Trophy },
            { id: 'stands', label: 'Stands', icon: Store },
            { id: 'cagnottes', label: 'Cagnottes', icon: HeartHandshake }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-black/5 text-slate-600'}`}>
              <tab.icon size={16}/> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="text-center py-20"><Spinner /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.length === 0 ? <p className="col-span-full text-center py-20 text-slate-500">Aucun élément dans cette catégorie.</p> : 
            data.map(item => (
              <Card key={item.id} item={item} onValidate={handleValidate} onDelete={handleDelete} type={activeTab} viewMode={viewMode} />
            ))
          }
        </div>
      )}
    </div>
  );
}

function Card({ item, onValidate, onDelete, type, viewMode }) {
  const [processing, setProcessing] = useState(false);
  const img = item.image || item.image_url || item.portrait_url;
  const title = item.titre || item.nom || "Sans titre";
  
  let value = item.description || "Aucune description";
  if (type === 'votes') value = `Prix vote: ${item.prix_vote || 0} FCFA`;
  if (type === 'cagnottes') value = `Objectif: ${Number(item.objectif_montant || 0).toLocaleString()} FCFA`;

  const runAction = async (action) => {
    setProcessing(true);
    await action(item);
    setProcessing(false);
  };

  return (
    <div className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col relative transition-shadow hover:shadow-lg">
      {viewMode === 'history' && (
        <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 z-10">
          <ShieldCheck size={12}/> Validé
        </div>
      )}
      <div className="w-full h-40 rounded-2xl overflow-hidden bg-slate-100 mb-4">
        {img ? <img src={img} className="w-full h-full object-cover" alt={title} /> : <div className="flex items-center justify-center h-full"><ImageIcon className="text-slate-400"/></div>}
      </div>
      <h4 className="text-blue-600 font-bold text-lg truncate">{title}</h4>
      <p className="!text-slate-900 text-xs mt-1 line-clamp-2">{value}</p>
      
      {viewMode === 'pending' && (
        <div className="mt-4 flex gap-2">
          <button disabled={processing} onClick={() => runAction(onValidate)} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition disabled:opacity-50" title="Valider et publier">
            {processing ? <Loader2 size={20} className="animate-spin"/> : <CheckCircle2 size={20}/>}
          </button>
          <button disabled={processing} onClick={() => runAction(onDelete)} className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition disabled:opacity-50" title="Supprimer">
            <Trash2 size={20}/>
          </button>
        </div>
      )}
    </div>
  );
}