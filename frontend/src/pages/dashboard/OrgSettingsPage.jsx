import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import { User, Save, Camera, Shield, Loader2, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrgSettingsPage() {
  const { dark } = useSelector(s => s.theme);
  const { user } = useSelector(s => s.auth);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    nom: '', phone: '', avatar_url: '', bio: '',
    is_verified: false, accepted_privacy_policy: false
  });

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('*').eq('id', user.id).single()
     .then(({ data }) => data && setForm({
        nom: data.nom || '', phone: data.phone || '', avatar_url: data.avatar_url || '',
        bio: data.bio || '', is_verified: data.is_verified || false,
        accepted_privacy_policy: data.accepted_privacy_policy || false
      }));
  }, [user]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 2*1024*1024) return toast.error('Max 2Mo');
    setUploading(true);
    try {
      const fileName = `${user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setForm(f => ({...f, avatar_url: data.publicUrl }));
      toast.success('Photo mise à jour');
    } catch { toast.error('Upload échoué'); }
    finally { setUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.accepted_privacy_policy) return toast.error('Acceptez la charte');
    setLoading(true);
    await supabase.from('profiles').update({
     ...form, accepted_privacy_policy: true, date_acceptance: new Date().toISOString()
    }).eq('id', user.id);
    setLoading(false);
    toast.success('Profil mis à jour');
  };

  const theme = useMemo(() => ({
    card: dark? 'bg-[#0f0e1a]/80 border-white/5' : 'bg-white border-gray-100',
    text: dark? 'text-white' : 'text-slate-900',
    sub: dark? 'text-slate-400' : 'text-slate-500',
    input: dark? 'bg-[#161527] border-white/10 text-white' : 'bg-gray-50 border-gray-200',
  }), [dark]);

  // ✅ PLUS DE <DashboardSidebar /> - juste le contenu
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className={`text-4xl font-black ${theme.text}`}>Mon <span className="text-violet-600">Profil</span></h1>
        <p className={`text-sm ${theme.sub}`}>Vérification et informations légales</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Preview */}
        <div className={`p-6 rounded-2xl border text-center ${theme.card}`}>
          <div className="relative inline-block">
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-violet-600 to-emerald-400 p-1">
              <div className="w-full h-full rounded-xl bg-gray-900 grid place-items-center overflow-hidden">
                {form.avatar_url? <img src={form.avatar_url} className="w-full h-full object-cover" alt="" /> : <User className="text-gray-600" size={32} />}
                {uploading && <Loader2 className="absolute animate-spin text-white" />}
              </div>
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-8 h-8 bg-violet-600 rounded-lg grid place-items-center text-white"><Camera size={14} /></button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <p className={`mt-4 font-bold ${theme.text}`}>{form.nom || 'Organisateur'}</p>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text- font-bold mt-2 ${form.is_verified?'bg-emerald-500/10 text-emerald-600':'bg-amber-500/10 text-amber-600'}`}>
            {form.is_verified? <CheckCircle size={12}/> : <Shield size={12}/>} {form.is_verified?'Vérifié':'En attente'}
          </span>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSave} className={`lg:col-span-2 p-6 rounded-2xl border space-y-4 ${theme.card}`}>
          <div className="grid md:grid-cols-2 gap-4">
            <input value={form.nom} onChange={e=>setForm({...form, nom:e.target.value})} placeholder="Nom organisation" className={`p-3 rounded-xl border ${theme.input}`} />
            <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="Mobile Money" className={`p-3 rounded-xl border ${theme.input}`} />
          </div>
          <textarea value={form.bio} onChange={e=>setForm({...form, bio:e.target.value})} rows={3} placeholder="Biographie" className={`w-full p-3 rounded-xl border ${theme.input}`} />

          <div className={`p-4 rounded-xl border ${dark?'bg-white/5':'bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2"><FileText size={14} className="text-violet-600" /><span className="text-xs font-bold uppercase">Charte</span></div>
            <p className={`text-xs ${theme.sub} mb-3`}>Vous acceptez la transparence des votes et la protection des données.</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.accepted_privacy_policy} onChange={e=>setForm({...form, accepted_privacy_policy:e.target.checked})} className="w-4 h-4" />
              <span className={`text-xs ${theme.text}`}>J'accepte les clauses</span>
            </label>
          </div>

          <button disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-emerald-400 text-white py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2">
            {loading? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Enregistrer
          </button>
        </form>
      </div>
    </div>
  );
}