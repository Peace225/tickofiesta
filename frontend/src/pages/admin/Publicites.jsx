import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import AdminSidebar from '../../components/layout/AdminSidebar';
import { Plus, Megaphone, Activity, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';

export default function Publicites() {
  const dark = useSelector((s) => s.theme?.dark) || false;
  
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  const [selectedAdForReview, setSelectedAdForReview] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  const theme = {
    bg: dark ? 'bg-[#05050A]' : 'bg-[#f4f7ff]',
    card: dark ? 'bg-[#0A0A12]/90 border-white/5' : 'bg-white border-indigo-50',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
  };

  const loadAds = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsUpdating(true);
    try {
      const { data, error } = await supabase.from('publicites').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAds(data || []);
    } catch (err) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, []);

  useEffect(() => {
    loadAds();
    const channel = supabase.channel('realtime_publicites')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'publicites' }, () => loadAds(true))
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'));
    return () => supabase.removeChannel(channel);
  }, [loadAds]);

  const handleToggleActive = async (ad) => {
    const newStatus = !ad.actif;
    try {
      await supabase.from('publicites').update({ actif: newStatus }).eq('id', ad.id);
      loadAds(true);
      if (selectedAdForReview?.id === ad.id) setSelectedAdForReview(prev => ({ ...prev, actif: newStatus }));
    } catch (err) { toast.error('Erreur'); }
  };

  return (
    <div className={`relative w-full min-h-screen ${theme.bg} p-4 md:p-8`}>
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-end gap-8 p-10 rounded-[2rem] bg-[#0A0A12] border border-white/5">
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white">Approbation Publicitaire</h1>
          <p className="text-white/50">{ads.filter(a => !a.actif).length} en attente.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-4 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-[0.2em]">
          <Plus size={16} /> Créer une annonce
        </button>
      </div>

      {/* LISTE */}
      <div className="max-w-7xl mx-auto mt-8">
        {loading ? <div className="flex justify-center"><Spinner size="xl" /></div> : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ads.map(ad => (
              <div key={ad.id} className={`p-6 rounded-[2rem] border ${theme.card} cursor-pointer hover:border-indigo-500/50 transition-all`} 
                   onClick={() => { setSelectedAdForReview(ad); setIsSidebarOpen(true); }}>
                <h3 className="text-2xl font-black text-white">{ad.titre}</h3>
                <p className="text-sm text-slate-400 mt-2">{ad.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VOLET LATÉRAL (Overlay manuel) */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-80 bg-[#0A0A12] border-l border-white/5 z-50 shadow-2xl">
            <AdminSidebar 
              ad={selectedAdForReview} 
              onClose={() => setIsSidebarOpen(false)} 
              onToggleApprove={() => handleToggleActive(selectedAdForReview)} 
            />
          </div>
        </>
      )}
    </div>
  );
}