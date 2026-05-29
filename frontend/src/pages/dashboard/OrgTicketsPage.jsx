import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { ScanLine, Ticket, Plus, Sparkles, X, Loader2, Info, Save, ChevronDown, CheckCircle2, Pointer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgTicketsPage() {
  const { dark } = useSelector(s => s.theme);
  const { user } = useSelector(s => s.auth);

  const [events, setEvents] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showTarifModal, setShowTarifModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingTarifs, setLoadingTarifs] = useState(false);

  const theme = useMemo(() => ({
    card: dark ? 'bg-[#0f0e1a]/80 border-white/5' : 'bg-white border-gray-100 shadow-lg',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    input: dark ? 'bg-[#161527] border-white/10 text-white' : 'bg-gray-50 border-gray-200',
  }), [dark]);

  useEffect(() => { 
    if(user?.id) supabase.from('events').select('id,titre,date').eq('organisateur_id', user.id).order('date',{ascending:false}).then(({data})=>setEvents(data||[])); 
  }, [user]);

  useEffect(() => { 
    if(selectedEvent) {
      setLoadingTarifs(true);
      supabase.from('tarifs').select('*').eq('event_id', selectedEvent.id).order('prix').then(({data})=>{setTarifs(data||[]); setLoadingTarifs(false);}); 
    }
  }, [selectedEvent]);

  const handleCreateTarif = async (e) => {
    e.preventDefault(); setSaving(true);
    const fd = new FormData(e.target);
    const payload = { event_id: selectedEvent.id, organisateur_id: user.id, nom: fd.get('nom'), prix: Number(fd.get('prix')), quantite_totale: Number(fd.get('quantite')), quantite_disponible: Number(fd.get('quantite')) };
    const { error } = await supabase.from('tarifs').insert([payload]);
    if(error) toast.error(error.message); else { toast.success('Tarif ajouté'); setShowTarifModal(false); setSelectedEvent({...selectedEvent}); }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"><Sparkles size={12}/> Billetterie</div>
          <h1 className={`text-3xl md:text-4xl font-black ${theme.text}`}>Gestion des <span className="text-violet-600">Tickets</span></h1>
          <p className={`text-sm ${theme.sub} mt-1`}>Configurez vos tarifs et suivez vos accès</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-600 text-xs font-bold">
            <Info size={16} /> <span>Sélectionnez un événement.</span>
        </div>
      </div>

      {/* Sélecteur Responsif */}
      <div className={`p-2 rounded-2xl border ${theme.card} flex items-center`}>
        <select value={selectedEvent?.id||''} onChange={e=>setSelectedEvent(events.find(ev=>ev.id===e.target.value))} className={`w-full p-3 bg-transparent rounded-xl outline-none font-bold ${theme.text}`}>
          <option value="" className="text-gray-500">-- Choisir un événement --</option>
          {events.map(ev=><option key={ev.id} value={ev.id} className="text-black">{ev.titre}</option>)}
        </select>
        <ChevronDown className={theme.sub} />
      </div>

      {/* Actions Grid */}
      {selectedEvent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/dashboard/scanner" className={`p-6 rounded-2xl border text-center hover:border-emerald-500 transition ${theme.card}`}>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl grid place-items-center mx-auto mb-3"><ScanLine/></div>
            <h3 className={`font-bold ${theme.text}`}>Scanner</h3>
          </Link>
          
          <div className={`p-6 rounded-2xl border text-center ${theme.card} relative`}>
            <div className="w-12 h-12 bg-violet-600/10 text-violet-600 rounded-xl grid place-items-center mx-auto mb-3"><Ticket/></div>
            <h3 className={`font-bold mb-3 ${theme.text}`}>Tarifs</h3>
            <button onClick={()=>setShowTarifModal(true)} className="bg-violet-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 mx-auto"><Plus size={14}/> Ajouter</button>
            
            {/* Doigt qui pointe */}
            <div className="absolute -top-4 -right-2 text-violet-500 animate-bounce hidden md:block">
                <Pointer size={24} className="rotate-[135deg]" />
            </div>
          </div>
        </div>
      )}

      {/* Liste tarifs */}
      {selectedEvent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {loadingTarifs ? <Loader2 className="animate-spin text-violet-600 mx-auto" /> : 
           tarifs.length ? tarifs.map(t=>(
            <div key={t.id} className={`p-4 rounded-xl border ${theme.card}`}>
              <p className="text-violet-600 text-[10px] font-bold uppercase">{t.nom}</p>
              <p className={`text-lg font-black ${theme.text}`}>{t.prix.toLocaleString()} F</p>
              <div className="flex items-center gap-1 text-[10px] mt-2 font-bold text-emerald-600">
                <CheckCircle2 size={12} /> Stock: {t.quantite_disponible}
              </div>
            </div>
          )) : <div className={`col-span-full text-center py-10 rounded-xl border-2 border-dashed ${theme.card}`}><p className={theme.sub}>Aucun tarif configuré</p></div>}
        </div>
      )}

      {/* Modal */}
      {showTarifModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 grid place-items-center p-4">
          <div className={`w-full max-w-sm p-6 rounded-2xl border ${theme.card}`}>
            <div className="flex justify-between mb-4"><h3 className={`font-bold ${theme.text}`}>Nouveau tarif</h3><button onClick={()=>setShowTarifModal(false)}><X size={20}/></button></div>
            <form onSubmit={handleCreateTarif} className="space-y-3">
              <input name="nom" required placeholder="Nom (ex: VIP)" className={`w-full p-3 rounded-lg border ${theme.input}`}/>
              <div className="grid grid-cols-2 gap-3">
                <input name="prix" type="number" required placeholder="Prix" className={`p-3 rounded-lg border ${theme.input}`}/>
                <input name="quantite" type="number" required placeholder="Qté" className={`p-3 rounded-lg border ${theme.input}`}/>
              </div>
              <button disabled={saving} className="w-full bg-violet-600 text-white py-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2">{saving?<Loader2 className="animate-spin" size={14}/>:<Save size={14}/>} Créer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}