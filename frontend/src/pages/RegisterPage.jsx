import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient';
import { loginSuccess } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  Zap, Mail, Eye, EyeOff,
  Ticket, Sparkles, ShieldCheck, X, FileText, Smartphone, KeyRound
} from 'lucide-react';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);

  const [step, setStep] = useState('register');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [form, setForm] = useState({
    nom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    role: searchParams.get('role') === 'organisateur'? 'organisateur' : 'client',
    accepteConditions: false
  });

  // ✅ CORRECTION : on ne redirige plus automatiquement si déjà connecté
  // Si tu veux garder la protection, décommente :
  // useEffect(() => {
  // if (user) navigate('/dashboard');
  // }, [user, navigate]);

  const formatPhone = (phone) => {
    let p = phone.trim().replace(/\s+/g, '');
    if (p.startsWith('00')) p = '+' + p.substring(2);
    if (!p.startsWith('+')) p = '+225' + p;
    return p;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.accepteConditions) return toast.error("Acceptez le contrat.");

    setLoading(true);
    try {
      if (form.role === 'client') {
        const phoneFormatted = formatPhone(form.telephone);
        const { error } = await supabase.auth.signUp({
          phone: phoneFormatted,
          password: form.mot_de_passe,
          options: { data: { nom: form.nom, role: form.role } }
        });
        if (error) throw error;
        toast.success("Code SMS envoyé!");
        setStep('otp');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.mot_de_passe,
          options: { data: { nom: form.nom, role: form.role } }
        });
        if (error) throw error;
        if (data.user) await finalizeRegistration(data.user, data.session);
      }
    } catch (err) {
      toast.error(err.message || "Erreur inscription");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formatPhone(form.telephone),
        token: otpCode,
        type: 'sms'
      });
      if (error) throw error;
      if (data.user) await finalizeRegistration(data.user, data.session);
    } catch (err) {
      toast.error("Code incorrect");
    } finally {
      setLoading(false);
    }
  };

  const finalizeRegistration = async (authUser, session = null) => {
    const finalPhone = form.role === 'client'? formatPhone(form.telephone) : null;

    await supabase.from('profiles').upsert({
      id: authUser.id,
      nom: form.nom,
      email: form.role === 'organisateur'? form.email : null,
      telephone: finalPhone,
      role: form.role,
      isActive: true
    }, { onConflict: 'id' });

    // ✅ CORRECTION : bon format pour Redux
    dispatch(loginSuccess({
      user: {...authUser, user_metadata: {...authUser.user_metadata, nom: form.nom, role: form.role } },
      session
    }));

    toast.success('Compte créé! 🎉');
    navigate(form.role === 'organisateur'? '/dashboard' : '/events');
  };

  const theme = {
    bg: dark? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    text: dark? 'text-white' : 'text-slate-900',
    sub: dark? 'text-slate-400' : 'text-slate-500',
    card: dark? 'bg-[#0A0A12] border-white/10' : 'bg-white border-slate-200',
    input: dark
     ? 'bg-[#0f0e1a] border-white/10 text-white placeholder-white/20 focus:border-[#6c47ff]'
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#6c47ff]',
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row ${theme.bg}`}>
      {/* Panel gauche */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#080812] flex-col justify-between p-12">
        <div className="absolute inset-0">
          <img src="/fond ecran evenement.jpg" alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#080812]/90 to-[#6c47ff]/20" />
        </div>
        <Link to="/" className="relative z-10 text-2xl font-black text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          TICKOFIESTA
        </Link>
      </div>

      {/* Panel droit */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {step === 'register' && (
            <div>
              <h1 className={`text-3xl font-black mb-8 text-center ${theme.text}`}>Créer un compte</h1>

              <div className={`flex p-1.5 rounded-2xl mb-8 ${dark? 'bg-[#0f0e1a]' : 'bg-gray-100'}`}>
                {['client', 'organisateur'].map((r) => (
                  <button key={r} type="button" onClick={() => setForm({...form, role: r })}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${form.role === r? 'bg-[#6c47ff] text-white shadow-lg' : theme.sub}`}>
                    {r === 'client'? 'Participant' : 'Organisateur'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" required value={form.nom} placeholder="Nom complet"
                  onChange={(e) => setForm({...form, nom: e.target.value })}
                  className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium outline-none ${theme.input}`} />

                {form.role === 'client'? (
                  <div className="relative">
                    <Smartphone size={18} className="absolute left-4 top-4 text-gray-400" />
                    <input type="tel" required value={form.telephone} placeholder="0102030405"
                      onChange={(e) => setForm({...form, telephone: e.target.value })}
                      className={`w-full pl-11 pr-5 py-4 rounded-2xl border text-sm font-medium ${theme.input}`} />
                  </div>
                ) : (
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-4 text-gray-400" />
                    <input type="email" required value={form.email} placeholder="Email pro"
                      onChange={(e) => setForm({...form, email: e.target.value })}
                      className={`w-full pl-11 pr-5 py-4 rounded-2xl border text-sm font-medium ${theme.input}`} />
                  </div>
                )}

                <div className="relative">
                  <input type={showPwd? 'text' : 'password'} required value={form.mot_de_passe} placeholder="Mot de passe"
                    onChange={(e) => setForm({...form, mot_de_passe: e.target.value })}
                    className={`w-full px-5 py-4 rounded-2xl border text-sm font-medium ${theme.input}`} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-4 text-gray-400">
                    {showPwd? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.accepteConditions} onChange={() => setForm({...form, accepteConditions:!form.accepteConditions})}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#6c47ff] focus:ring-[#6c47ff]" />
                  <span className={`text-xs ${theme.sub}`}>J'accepte les <button type="button" onClick={() => setShowContractModal(true)} className="text-[#6c47ff] font-bold">CGU</button></span>
                </label>

                <button type="submit" disabled={loading ||!form.accepteConditions}
                  className="w-full bg-[#6c47ff] text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest disabled:opacity-50 hover:bg-[#5a3ae0] transition-all">
                  {loading? '...' : form.role === 'client'? 'Recevoir le SMS' : "S'inscrire"}
                </button>
              </form>

              <p className={`text-center text-sm mt-8 ${theme.sub}`}>
                Déjà un compte? <Link to="/login" className="text-[#6c47ff] font-bold">Connexion</Link>
              </p>
            </div>
          )}

          {step === 'otp' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-[#6c47ff]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <KeyRound size={32} className="text-[#6c47ff]" />
              </div>
              <h2 className={`text-2xl font-black mb-2 ${theme.text}`}>Code SMS</h2>
              <p className={`text-sm mb-6 ${theme.sub}`}>Envoyé au {form.telephone}</p>
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000" className={`w-full text-center text-2xl tracking-[0.5em] py-4 rounded-2xl border font-black ${theme.input}`} />
                <button type="submit" disabled={loading || otpCode.length < 6}
                  className="w-full bg-[#6c47ff] text-white py-4 rounded-2xl font-black uppercase disabled:opacity-50">
                  Vérifier
                </button>
              </form>
              <button onClick={() => setStep('register')} className={`mt-4 text-xs ${theme.sub} hover:underline`}>Retour</button>
            </div>
          )}
        </div>
      </div>

      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowContractModal(false)}>
          <div className={`w-full max-w-2xl rounded-3xl p-8 ${theme.card}`} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-black ${theme.text}`}>Conditions</h3>
              <button onClick={() => setShowContractModal(false)}><X size={20} className={theme.sub} /></button>
            </div>
            <p className={`${theme.sub} text-sm mb-6`}>En créant un compte, vous acceptez nos CGU.</p>
            <button onClick={() => { setForm({...form, accepteConditions: true}); setShowContractModal(false); }}
              className="w-full bg-[#6c47ff] text-white py-3 rounded-xl font-bold">J'accepte</button>
          </div>
        </div>
      )}
    </div>
  );
}