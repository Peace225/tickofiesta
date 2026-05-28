import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import { ArrowLeft, X, Loader2, Store, MapPin, Share2, Copy, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StandsPage() {
  const navigate = useNavigate();
  const dark = useSelector((s) => s?.theme?.dark)?? false;

  const [stands, setStands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategorie, setFilterCategorie] = useState('tous');
  const [showModal, setShowModal] = useState(false);
  const [selectedStand, setSelectedStand] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    email: '',
    besoins_techniques: '',
    conditions: false,
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('stands').select('*');
      if (error) throw error;
      setStands(data || []);
    } catch (err) {
      console.error("Erreur Supabase:", err);
      toast.error("Erreur lors du chargement des stands");
    } finally {
      setLoading(false);
    }
  };

  const categories = ['tous', 'standard', 'premium', 'vip / gold', 'restauration'];

  const filtered = useMemo(() => {
    return stands.filter((s) =>
      filterCategorie === 'tous' || (s.categorie || '').toLowerCase() === filterCategorie.toLowerCase()
    );
  }, [stands, filterCategorie]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // ✅ payload 100% aligné avec ta table reservations_stands
      const { data, error } = await supabase
      .from('reservations_stands')
      .insert({
          stand_id: selectedStand.id,
          stand_nom: selectedStand.nom,
          nom: formData.nom.trim(),
          telephone: formData.telephone.trim(),
          email: formData.email?.trim() || null,
          besoins_techniques: formData.besoins_techniques?.trim() || null,
          accepte_conditions: formData.conditions,
          statut: 'en_attente',
          prix: selectedStand.prix_location || null
        })
      .select('id')
      .single();

      if (error) throw error;

      toast.success('Réservation enregistrée!');
      setShowModal(false);

      // ✅ on passe tout ce dont PaiementPage a besoin
      navigate('/paiement', {
        state: {
          reservationId: data.id,
          montant: selectedStand.prix_location,
          standNom: selectedStand.nom,
          telephone: formData.telephone,
          email: formData.email,
          nom: formData.nom
        }
      });
    } catch (err) {
      console.error("Erreur détaillée:", err);
      toast.error(err.message || "Erreur lors de la réservation");
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Lien copié!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#F5F8FD]"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  return (
    <div className="min-h-screen bg-[#F5F8FD]">
      {/* HERO */}
      <div className="relative bg-[#070E22] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(37,99,235,0.25),transparent_60%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-10 pb-14">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/50 hover:text-white/80 transition mb-8"
          >
            <ArrowLeft size={14} /> RETOUR
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text- font-bold uppercase tracking-wider text-emerald-300">RÉSERVATION OUVERTE</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-[0.9] tracking-tight">
            <span className="text-white">NOS </span>
            <span className="bg-gradient-to-r from-[#38BDF8] to-[#2DD4BF] bg-clip-text text-transparent">STANDS</span>
          </h1>

          <div className="flex items-center gap-1.5 mt-4 text-white/60 text-sm">
            <MapPin size={14} className="opacity-70" />
            Abidjan, Côte d'Ivoire
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="bg-[#EEF4FF] border border-[#DCE7FF] rounded-2xl px-4 py-3 flex items-center gap-2.5 text-sm text-[#3B5BDB] mb-8">
            <Info size={16} className="shrink-0" />
            <span>Réservation instantanée • Paiement sécurisé à l'étape suivante.</span>
          </div>

          <div className="mb-6">
            <h2 className="flex items-center gap-3 text-lg font-extrabold text-slate-800 mb-4">
              <span className="w-1 h-5 bg-[#2563EB] rounded-full" />
              Catégories
              <span className="text-sm font-medium text-slate-400 mt-1">({filtered.length})</span>
            </h2>

            <div className="flex gap-2.5 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategorie(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
                    filterCategorie === cat
                     ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0? (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
              <Store size={44} className="mx-auto text-slate-300 mb-3"/>
              <p className="text-slate-500 text-sm">Aucun stand dans cette catégorie.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {filtered.map((stand) => (
                <div key={stand.id} className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-slate-200/60 transition-all">
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img src={stand.image_url} alt={stand.nom} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur text- font-bold uppercase tracking-wider text-white">
                      {stand.categorie}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-slate-900 mb-1">{stand.nom}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 min-h-">{stand.description || 'Emplacement premium pour votre activité.'}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-black text-slate-900">
                        {stand.prix_location?.toLocaleString()} <span className="text-sm font-medium text-slate-500">FCFA</span>
                      </div>
                      <button
                        onClick={() => { setSelectedStand(stand); setShowModal(true); }}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-[#2563EB] transition-colors"
                      >
                        Réserver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="space-y-5">
          <div className="bg-gradient-to-b from-[#1A56DB] to-[#0E3AA7] rounded-2xl p-5 text-white shadow-lg shadow-blue-600/20">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3 opacity-95">
              <Share2 size={15} /> Partager
            </h3>
            <a
              href={`https://wa.me/?text=${encodeURIComponent('Découvrez les stands TickoFiesta: ' + window.location.href)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20C05A] text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm mb-2.5 transition"
            >
              WhatsApp
            </a>
            <button onClick={copyLink} className="w-full bg-white/15 hover:bg-white/25 backdrop-blur text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition">
              <Copy size={14} /> Copier le lien
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h4 className="text- font-bold uppercase tracking-widest text-slate-400 mb-4">STATISTIQUES</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Stands disponibles</span>
                <span className="text-sm font-bold text-slate-900">{stands.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Catégories</span>
                <span className="text-sm font-bold text-slate-900">{categories.length - 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && selectedStand && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Réserver {selectedStand.nom}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition"><X size={20} className="text-slate-500"/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              <input required placeholder="Nom complet" className="w-full px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" onChange={e => setFormData({...formData, nom: e.target.value})} />
              <input required type="tel" placeholder="Téléphone" className="w-full px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" onChange={e => setFormData({...formData, telephone: e.target.value})} />
              <input type="email" placeholder="Email (optionnel)" className="w-full px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" onChange={e => setFormData({...formData, email: e.target.value})} />
              <textarea placeholder="Besoins techniques..." rows="3" className="w-full px-4 py-3 bg-[#F8FAFC] rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-none" onChange={e => setFormData({...formData, besoins_techniques: e.target.value})} />

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input type="checkbox" required className="mt-0.5" onChange={e => setFormData({...formData, conditions: e.target.checked})} />
                <span className="text-xs text-slate-600 leading-snug">J'accepte les conditions de réservation</span>
              </label>

              <button disabled={submitting} className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-semibold text-sm mt-2 disabled:opacity-60 transition">
                {submitting? 'Traitement...' : `Continuer vers paiement • ${selectedStand.prix_location?.toLocaleString()} FCFA`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}