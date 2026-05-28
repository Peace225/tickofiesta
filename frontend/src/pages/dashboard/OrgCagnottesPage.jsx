import { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import {
  PiggyBank, Plus, Clock, CheckCircle, XCircle,
  Target, Heart, Wallet,
  Upload, X, Image as ImageIcon, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgCagnottesPage() {
  const { dark } = useSelector(s => s.theme);
  const user = useSelector(s => s.auth.user);
  const fileRef = useRef(null);

  const [form, setForm] = useState({ titre: '', description: '', objectif_montant: '', date_fin: '' });
  const [myCagnottes, setMyCagnottes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => { if (user?.id) fetchMine(); }, [user?.id]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const fetchMine = async () => {
    const { data, error } = await supabase
    .from('cagnottes')
    .select('*')
    .eq('organisateur_id', user.id)
    .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      toast.error('Erreur chargement');
      return;
    }
    setMyCagnottes(data || []);
  };

  const handleImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error('Image max 5Mo');
    if (!f.type.startsWith('image/')) return toast.error('Format image uniquement');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Non connecté');
    setLoading(true);

    try {
      let image_url = null;

      if (file) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
        const fileName = `${user.id}/${uuid}.${fileExt}`;

        const { error: upErr } = await supabase.storage
        .from('cagnottes')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });

        if (upErr) {
          console.error('Upload error:', upErr);
          throw new Error(`Upload: ${upErr.message}`);
        }

        const { data } = supabase.storage.from('cagnottes').getPublicUrl(fileName);
        image_url = data.publicUrl;
      }

      const { error } = await supabase.from('cagnottes').insert({
        titre: form.titre.trim(),
        description: form.description.trim(),
        objectif_montant: Number(form.objectif_montant),
        date_fin: form.date_fin,
        organisateur_id: user.id,
        // ✅ Retour à l'état "en_attente" pour exiger la validation de l'admin
        statut: 'en_attente', 
        montant_actuel: 0,
        image_url
      });

      if (error) throw error;

      toast.success('Cagnotte soumise pour validation ✨');
      setForm({ titre: '', description: '', objectif_montant: '', date_fin: '' });
      setFile(null);
      setPreview(null);
      setShowForm(false);
      fetchMine();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => ({
    total: myCagnottes.length,
    collecté: myCagnottes.reduce((a, c) => a + (c.montant_actuel || 0), 0),
    validées: myCagnottes.filter(c => c.statut === 'validé').length,
  }), [myCagnottes]);

  const theme = {
    bg: dark ? 'bg-[#050507]' : 'bg-[#fafbff]',
    card: dark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-zinc-200/60',
    text: dark ? 'text-white' : 'text-zinc-900',
    sub: dark ? 'text-zinc-500' : 'text-zinc-600',
    input: dark ? 'bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400',
  };

  // ✅ Configuration des statuts améliorée visuellement
  const statusConfig = {
    'validé': { icon: CheckCircle, text: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Validée' },
    'rejeté': { icon: XCircle, text: 'text-red-500', bg: 'bg-red-500/10', label: 'Rejetée' },
    'en_attente': { icon: Clock, text: 'text-amber-500', bg: 'bg-amber-500/10', label: 'En attente' },
  };

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
        
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-3xl mb-8 p-px bg-gradient-to-b from-violet-500/20 to-transparent">
          <div className={`relative rounded-[calc(1.5rem-1px)] ${dark ? 'bg-zinc-900/80' : 'bg-white/80'} backdrop-blur-2xl p-6 sm:p-8`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center shadow-xl">
                  <PiggyBank className="text-white" size={26} />
                </div>
                <div>
                  <h1 className={`text-2xl sm:text-3xl font-bold ${theme.text}`}>Cagnottes Solidaires</h1>
                  <p className={`text-sm mt-1 ${theme.sub}`}>Soumises à validation admin</p>
                </div>
              </div>
              <button onClick={() => setShowForm(!showForm)} className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-medium flex items-center gap-2 hover:scale-[1.02] transition">
                <Plus size={16} /> <span className="hidden sm:inline">Nouvelle</span>
              </button>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: Target },
            { label: 'Collecté', value: `${Math.round(stats.collecté / 1000)}k`, icon: Wallet },
            { label: 'Actives', value: stats.validées, icon: Heart },
          ].map((s, i) => (
            <div key={i} className={`p-4 rounded-2xl border ${theme.card}`}>
              <div className="flex items-center gap-2 mb-1">
                <s.icon size={14} className={theme.sub} />
                <p className={`text-xs uppercase tracking-wide ${theme.sub}`}>{s.label}</p>
              </div>
              <p className={`text-2xl font-bold ${theme.text}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* FORM */}
        {showForm && (
          <div className="mb-8">
            <div className={`rounded-2xl border ${theme.card} p-6`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className={`font-semibold ${theme.text}`}>Créer une cagnotte</h3>
                <button type="button" onClick={() => setShowForm(false)} className={`p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/10 ${theme.sub}`}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                  <div onClick={() => fileRef.current?.click()} className={`relative h-44 rounded-xl border-2 border-dashed ${dark ? 'border-zinc-700 hover:border-violet-500/50' : 'border-zinc-300 hover:border-violet-500/50'} cursor-pointer overflow-hidden group transition`}>
                    {preview ? (
                      <>
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition grid place-items-center">
                          <span className="text-white text-xs">Changer</span>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white grid place-items-center hover:bg-red-600">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-violet-500/10 grid place-items-center">
                          <ImageIcon className="text-violet-500" size={24} />
                        </div>
                        <p className={`text-sm font-medium ${theme.text}`}>Cliquez pour uploader</p>
                        <p className={`text-xs ${theme.sub}`}>PNG, JPG - 5Mo max</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <input required placeholder="Titre du projet" value={form.titre} onChange={e => setForm({...form, titre: e.target.value })} className={`md:col-span-2 w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500/20 ${theme.input}`} />
                  <input required type="number" min="1000" placeholder="Objectif FCFA" value={form.objectif_montant} onChange={e => setForm({...form, objectif_montant: e.target.value })} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500/20 ${theme.input}`} />
                  <input type="date" required value={form.date_fin} onChange={e => setForm({...form, date_fin: e.target.value })} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500/20 ${theme.input}`} />
                  <textarea required placeholder="Description du projet..." value={form.description} onChange={e => setForm({...form, description: e.target.value })} className={`md:col-span-2 w-full px-4 py-3 rounded-xl border text-sm h-24 resize-none outline-none focus:ring-2 focus:ring-violet-500/20 ${theme.input}`} />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-sky-500 text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg transition">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Upload en cours...</> : <><Upload size={16} /> Soumettre la cagnotte</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* LISTE DES CAGNOTTES */}
        <div className="space-y-3">
          {myCagnottes.map(c => {
            const cfg = statusConfig[c.statut] || statusConfig['en_attente'];
            const Icon = cfg.icon;
            const progress = c.objectif_montant ? (c.montant_actuel / c.objectif_montant * 100) : 0;
            return (
              <div key={c.id} className={`p-5 rounded-2xl border ${theme.card} hover:-translate-y-0.5 transition`}>
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                    {c.image_url ? <img src={c.image_url} className="w-full h-full object-cover" alt={c.titre} /> : <div className="w-full h-full grid place-items-center"><PiggyBank className="text-zinc-400" size={24} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <h3 className={`font-semibold truncate ${theme.text}`}>{c.titre}</h3>
                      
                      {/* ✅ BADGE DE STATUT VISUELLEMENT PREMIUM */}
                      <div className={`flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1 rounded-md ${cfg.bg}`}>
                        <Icon size={14} className={cfg.text} />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
                      </div>
                      
                    </div>
                    <p className={`text-xs mt-1 line-clamp-1 ${theme.sub}`}>{c.description}</p>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className={`font-medium ${theme.text}`}>{(c.montant_actuel || 0).toLocaleString()} FCFA</span>
                        <span className={theme.sub}>{Number(c.objectif_montant).toLocaleString()} FCFA</span>
                      </div>
                      <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        {/* La barre de progression est grisée si la cagnotte n'est pas encore validée */}
                        <div 
                          className={`h-full transition-all ${c.statut === 'validé' ? 'bg-gradient-to-r from-violet-500 to-sky-500' : 'bg-zinc-400 dark:bg-zinc-600'}`} 
                          style={{ width: `${Math.min(progress, 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {myCagnottes.length === 0 && !showForm && (
            <div className={`text-center py-16 rounded-2xl border border-dashed ${dark ? 'border-zinc-800' : 'border-zinc-200'}`}>
              <PiggyBank size={32} className={`mx-auto mb-3 ${theme.sub}`} />
              <p className={`${theme.text} font-medium`}>Aucune cagnotte</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}