import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import toast from 'react-hot-toast';
import { 
  User, Mail, Phone, Award, Gift, 
  Loader2, Save, Sparkles, ShieldCheck, CheckCircle2, Camera,
  Zap, Users, Copy, Check, MessageCircle
} from 'lucide-react';

export default function ClientProfile() {
  const { user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Nouveaux états pour le parrainage et les crédits
  const [credits, setCredits] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: ''
  });

  const isIncomplete = profile?.nom?.startsWith('User_') || profile?.email?.includes('@participant.tickofiesta.ci');
  const referralLink = `${window.location.origin}/register?role=client&ref=${user?.id}`;

  useEffect(() => {
    if (user?.id) fetchProfile();
  }, [user]);

  // Écoute en temps réel des crédits
  useEffect(() => {
    if (!user?.id) return;
    
    const creditChannel = supabase.channel(`public:user_credits:user_id=eq.${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_credits', filter: `user_id=eq.${user.id}` }, (payload) => {
        setCredits(payload.new.balance);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(creditChannel);
    };
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      let data = null;

      // 1. Profil par id
      const byId = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (byId.data) data = byId.data;

      // 2. Profil orphelin par téléphone
      if (!data && user?.phone) {
        const byPhone = await supabase.from('profiles').select('*').eq('telephone', user.phone).maybeSingle();
        if (byPhone.data) {
          data = byPhone.data;
          if (data.id !== user.id) {
            await supabase.from('profiles').update({ id: user.id }).eq('telephone', user.phone);
            data.id = user.id;
          }
        }
      }

      // 3. Création minimale
      if (!data) {
        const { data: created, error } = await supabase.from('profiles').insert({ id: user.id, points: 0 }).select().single();
        if (error) throw error;
        data = created;
      }

      setProfile(data);
      setForm({
        nom: data.nom?.startsWith('User_') ? '' : (data.nom || ''),
        email: data.email?.includes('@participant') ? '' : (data.email || ''),
        telephone: data.telephone || user.phone || ''
      });
      if (!data.nom || data.nom.startsWith('User_')) setIsEditing(true);

      // --- NOUVEAU : Récupération des crédits de vote et statistiques de parrainage ---
      const [creditsResponse, referralsResponse] = await Promise.all([
        supabase.from('user_credits').select('balance').eq('user_id', user.id).maybeSingle(),
        supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id)
      ]);

      if (creditsResponse.data) setCredits(creditsResponse.data.balance);
      if (referralsResponse.count !== null) setReferralCount(referralsResponse.count);

    } catch (e) {
      console.error('Erreur fetch profile:', e);
      toast.error('Impossible de charger le profil');
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Sélectionnez une image.');

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Photo de profil mise à jour !');
    } catch (error) {
      toast.error(error.message || "Erreur lors de l'upload de l'image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim()) return toast.error('Le nom est requis');
    if (!form.email.includes('@')) return toast.error('Email invalide');

    setSaving(true);
    try {
      const { data: doublon } = await supabase.from('profiles').select('id').eq('telephone', form.telephone.trim()).neq('id', user.id).maybeSingle();
      if (doublon) throw new Error("Ce numéro est déjà utilisé par un autre compte.");

      const shouldAwardPoints = isIncomplete && form.nom && form.email;
      const pointsToAward = shouldAwardPoints ? 100 : 0;
      const newPoints = (profile.points || 0) + pointsToAward;

      const { error: updateError } = await supabase.from('profiles').update({
        nom: form.nom.trim(),
        email: form.email.trim(),
        points: newPoints
      }).eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, ...form, points: newPoints });
      setIsEditing(false);

      if (shouldAwardPoints) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold text-lg">Profil complété ! 🎉</span>
            <span className="text-sm">+100 points ajoutés.</span>
          </div>,
          { duration: 5000, icon: '🎁' }
        );
      } else {
        toast.success('Profil mis à jour !');
      }

    } catch (error) {
      if (error.code === '23505') {
        toast.error("Ce numéro vient d'être pris. Choisis-en un autre.");
      } else {
        toast.error(error.message || 'Erreur lors de la mise à jour');
      }
    } finally {
      setSaving(false);
    }
  };

  // Actions de parrainage
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Lien copié dans le presse-papiers !");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(`Soutiens tes candidats préférés sur TickoFiesta ! Inscris-toi rapidement via ce lien et nous gagnerons tous les deux des votes gratuits 🎁 : ${referralLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#fafafe]',
    card: dark ? 'bg-[#1c1c1e] border-white/10 shadow-2xl shadow-black/50' : 'bg-white border-black/5 shadow-xl shadow-black/5',
    text: dark ? 'text-white' : 'text-[#1d1d1f]',
    sub: dark ? 'text-[#98989d]' : 'text-[#86868b]',
    input: dark ? 'bg-[#2c2c2e] text-white border-transparent focus:border-[#6c47ff]' : 'bg-[#f5f5f7] text-[#1d1d1f] border-transparent focus:border-[#6c47ff]',
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-[#6c47ff]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER DU PROFIL */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-black tracking-tight ${theme.text}`}>Mon Espace</h1>
          <p className={`text-sm font-medium mt-1 ${theme.sub}`}>Gérez vos informations, vos votes et vos gains</p>
        </div>
        
        {/* BADGES */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-500 p-1 pr-4 rounded-full shadow-lg shadow-blue-500/20">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Crédits de vote</span>
              <span className="text-white font-black leading-none">{credits} dispo.</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gradient-to-r from-[#6c47ff] to-[#a385ff] p-1 pr-4 rounded-full shadow-lg shadow-[#6c47ff]/20">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Award size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">TickoPoints</span>
              <span className="text-white font-black leading-none">{profile?.points || 0} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* BANNIÈRE DE GAMIFICATION (Si incomplet) */}
      {isIncomplete && !isEditing && (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-500 p-8 text-white shadow-xl shadow-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute -right-10 -top-10 opacity-20"><Gift size={200} /></div>
          <div className="relative z-10 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-widest mb-4">
              <Sparkles size={14} /> Récompense débloquée
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-2 leading-tight">Complétez votre profil<br/>et gagnez 100 points !</h2>
            <p className="text-white/90 font-medium">
              Ajoutez votre nom et votre adresse e-mail pour finaliser votre inscription et débloquer vos avantages.
            </p>
          </div>
          <div className="relative z-10 w-full md:w-auto">
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full md:w-auto px-8 py-4 bg-white text-orange-500 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Réclamer mes points
            </button>
          </div>
        </div>
      )}

      {/* NOUVEAU : PROGRAMME AMBASSADEUR (BOUCLE VIRALE) */}
      <div className={`rounded-[2rem] border p-8 md:p-10 transition-colors bg-gradient-to-br from-[#0b1021] to-[#1a1f35] text-white shadow-2xl`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-cyan-400/20">
              <Sparkles size={14} /> Programme Ambassadeur
            </div>
            <h2 className="text-2xl font-black mb-2">Invitez & Gagnez des votes</h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Partagez ce lien avec vos amis. À chaque fois qu'un ami s'inscrit via votre lien, 
              <strong className="text-white"> vous recevez automatiquement 5 votes gratuits</strong> pour soutenir votre candidat favori.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Users size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Filleuls inscrits</p>
              <p className="text-2xl font-black text-white">{referralCount}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <input 
              type="text" 
              readOnly 
              value={referralLink} 
              className="w-full h-14 pl-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-sm font-medium outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button 
            onClick={copyToClipboard}
            className={`h-14 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${copied ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/5'}`}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copié !' : 'Copier'}
          </button>
          <button 
            onClick={shareOnWhatsApp}
            className="h-14 px-6 bg-[#25D366] hover:bg-[#22bf5b] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/20"
          >
            <MessageCircle size={18} /> Partager WhatsApp
          </button>
        </div>
      </div>

      {/* FORMULAIRE / AFFICHAGE PROFIL */}
      <div className={`rounded-[2rem] border p-8 md:p-10 transition-colors ${theme.card}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            
            {/* AVATAR INTERACTIF */}
            <div className="relative group cursor-pointer">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-[#6c47ff]/20 to-[#a385ff]/20 flex items-center justify-center overflow-hidden border border-[#6c47ff]/10">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-[#6c47ff]" />
                )}
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {uploading ? <Loader2 size={20} className="text-white animate-spin" /> : <Camera size={20} className="text-white" />}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
                </label>
              </div>
            </div>

            <div>
              <h2 className={`text-xl font-bold ${theme.text}`}>Informations Personnelles</h2>
              <p className={`text-sm ${theme.sub}`}>Vos données sont protégées et privées.</p>
            </div>
          </div>
          
          {!isEditing && !isIncomplete && (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 font-semibold transition-colors text-sm"
            >
              Modifier
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider pl-2 ${theme.sub}`}>Nom complet</label>
                <div className="relative">
                  <User size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.sub}`} />
                  <input 
                    type="text" required value={form.nom} 
                    onChange={e => setForm({...form, nom: e.target.value})}
                    placeholder="Entrez votre nom"
                    className={`w-full h-14 pl-12 pr-4 rounded-2xl outline-none border-2 transition-all ${theme.input}`}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider pl-2 ${theme.sub}`}>Adresse E-mail</label>
                <div className="relative">
                  <Mail size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.sub}`} />
                  <input 
                    type="email" required value={form.email} 
                    onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="Entrez votre e-mail"
                    className={`w-full h-14 pl-12 pr-4 rounded-2xl outline-none border-2 transition-all ${theme.input}`}
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={`text-xs font-bold uppercase tracking-wider pl-2 ${theme.sub}`}>Numéro de Téléphone (Identifiant)</label>
                <div className="relative">
                  <Phone size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.sub}`} />
                  <input 
                    type="text" readOnly value={form.telephone} 
                    className={`w-full h-14 pl-12 pr-4 rounded-2xl outline-none border-2 opacity-60 cursor-not-allowed ${theme.input}`}
                  />
                </div>
                <p className={`text-xs pl-2 ${theme.sub}`}>Ce numéro est utilisé pour votre connexion.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4">
              {!isIncomplete && (
                <button 
                  type="button" onClick={() => setIsEditing(false)}
                  className={`px-6 py-3 rounded-xl font-semibold hover:opacity-70 transition-opacity ${theme.sub}`}
                >
                  Annuler
                </button>
              )}
              <button 
                type="submit" disabled={saving}
                className="px-8 py-3 bg-[#6c47ff] hover:bg-[#5b3ce0] text-white rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Enregistrer le profil
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-black/5 dark:bg-white/5 ${theme.sub}`}><User size={20} /></div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.sub}`}>Nom complet</p>
                <p className={`font-semibold text-lg ${theme.text}`}>{profile?.nom || '—'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-black/5 dark:bg-white/5 ${theme.sub}`}><Mail size={20} /></div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.sub}`}>Adresse E-mail</p>
                <p className={`font-semibold text-lg ${theme.text}`}>{profile?.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-black/5 dark:bg-white/5 ${theme.sub}`}><Phone size={20} /></div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.sub}`}>Téléphone</p>
                <p className={`font-semibold text-lg ${theme.text}`}>{profile?.telephone || '—'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-green-500/10 text-green-500`}><ShieldCheck size={20} /></div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${theme.sub}`}>Statut du compte</p>
                <p className="font-bold text-green-500 flex items-center gap-1">
                  <CheckCircle2 size={16} /> Actif
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}