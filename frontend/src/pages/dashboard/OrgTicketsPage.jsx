import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabaseClient';
import { ScanLine, Ticket, Plus, Sparkles, ArrowRight, X, Loader2, Info, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgTicketsPage() {
  const { dark } = useSelector(s => s.theme);
  const { user } = useSelector(s => s.auth);

  const [events, setEvents] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showTarifModal, setShowTarifModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const theme = useMemo(() => ({
    card: dark? 'bg-[#0f0e1a]/80 border-white/5' : 'bg-white border-gray-100 shadow-lg',
    text: dark? 'text-white' : 'text-slate-900',
    sub: dark? 'text-slate-400' : 'text-slate-500',
    input: dark? 'bg-[#161527] border-white/10 text-white' : 'bg-gray-50 border-gray-200',
  }), [dark]);

  useEffect(() => { if(user?.id) supabase.from('events').select('id,titre,date').eq('organisateur_id', user.id).order('date',{ascending:false}).then(({data})=>setEvents(data||[])); }, [user]);
  useEffect(() => { if(selectedEvent) supabase.from('tarifs').select('*').eq('event_id', selectedEvent.id).order('prix').then(({data})=>setTarifs(data||[])); }, [selectedEvent]);

  const handleCreateTarif = async (e) => {
    e.preventDefault(); setSaving(true);
    const fd = new FormData(e.target);
    const payload = {
      event_id: selectedEvent.id, organisateur_id: user.id,
      nom: fd.get('nom'), prix: Number(fd.get('prix')),
      quantite_totale: Number(fd.get('quantite')), quantite_disponible: Number(fd.get('quantite'))
    };
    const { error } = await supabase.from('tarifs').insert([payload]);
    if(error) toast.error(error.message); else { toast.success('Tarif ajouté'); setShowTarifModal(false); setTarifs([]); }
    setSaving(false);
  };

  // ✅ PLUS DE <DashboardSidebar /> - juste le contenu
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-600 px-3 py-1 rounded-full text- font-bold uppercase mb-3"><Sparkles size={12}/> Billetterie</div>
        <h1 className={`text-4xl font-black ${theme.text}`}>Gestion des <span className="text-violet-600">Tickets</span></h1>
        <p className={`text-sm ${theme.sub}`}>Créez vos tarifs et gérez les accès</p>
      </div>

      {/* Sélecteur */}
      <div className={`p-5 rounded-2xl border ${theme.card}`}>
        <select value={selectedEvent?.id||''} onChange={e=>setSelectedEvent(events.find(ev=>ev.id===e.target.value))} className={`w-full p-3 rounded-xl border ${theme.input}`}>
          <option value="">-- Choisir un événement --</option>
          {events.map(ev=><option key={ev.id} value={ev.id}>{ev.titre}</option>)}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/dashboard/scanner" className={`p-8 rounded-2xl border text-center hover:-translate-y-1 transition ${theme.card}`}>
          <div className="w-16 h-16 bg-emerald-500 rounded-xl grid place-items-center mx-auto mb-4 text-white"><ScanLine/></div>
          <h3 className={`font-bold ${theme.text}`}>Scanner</h3>
          <p className={`text-xs ${theme.sub}`}>Validation QR à l'entrée</p>
        </Link>
        <div className={`p-8 rounded-2xl border text-center ${theme.card}`}>
          <div className="w-16 h-16 bg-violet-600 rounded-xl grid place-items-center mx-auto mb-4 text-white"><Ticket/></div>
          <h3 className={`font-bold mb-2 ${theme.text}`}>Tarifs</h3>
          <button onClick={()=>setShowTarifModal(true)} disabled={!selectedEvent} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-30 flex items-center gap-1 mx-auto"><Plus size={14}/> Ajouter</button>
        </div>
      </div>

      {/* Liste tarifs */}
      {selectedEvent && (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tarifs.length? tarifs.map(t=>(
            <div key={t.id} className={`p-4 rounded-xl border ${theme.card}`}>
              <p className="text-violet-600 text-xs font-bold uppercase">{t.nom}</p>
              <p className={`text-xl font-black ${theme.text}`}>{t.prix.toLocaleString()} F</p>
              <p className={`text-xs ${theme.sub}`}>Stock: {t.quantite_totale}</p>
            </div>
          )) : <div className={`col-span-full text-center py-10 rounded-xl border-2 border-dashed ${theme.card}`}><Info className="mx-auto opacity-30 mb-2"/><p className={theme.sub}>Aucun tarif</p></div>}
        </div>
      )}

      {/* Modal */}
      {showTarifModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur z-50 grid place-items-center p-4">
          <div className={`w-full max-w-sm p-6 rounded-2xl border ${theme.card}`}>
            <div className="flex justify-between mb-4"><h3 className={`font-bold ${theme.text}`}>Nouveau tarif</h3><button onClick={()=>setShowTarifModal(false)}><X size={20}/></button></div>
            <form onSubmit={handleCreateTarif} className="space-y-3">
              <input name="nom" required placeholder="Nom" className={`w-full p-3 rounded-lg border ${theme.input}`}/>
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