import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../config/supabaseClient'; 
import { loginSuccess } from '../store/slices/authSlice'; 
import toast from 'react-hot-toast';
import { 
  Zap, User, Mail, Lock, Eye, EyeOff, 
  Ticket, Sparkles, ShieldCheck, X, FileText, Smartphone, KeyRound
} from 'lucide-react';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { user } = useSelector((s) => s.auth);
  const { dark } = useSelector((s) => s.theme);
  
  // États de l'interface
  const [step, setStep] = useState('register'); // 'register' ou 'otp'
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  
  // Données du formulaire
  const [otpCode, setOtpCode] = useState('');
  const [form, setForm] = useState({
    nom: '', 
    email: '', 
    telephone: '', // Nouveau champ pour le client
    mot_de_passe: '',
    role: searchParams.get('role') === 'organisateur' ? 'organisateur' : 'client',
    accepteConditions: false
  });

  // --- REDIRECTION SI DÉJÀ CONNECTÉ ---
  useEffect(() => {
    if (user) {
      const role = user.user_metadata?.role || user.role;
      navigate(role === 'admin' ? '/admin' : role === 'organisateur' ? '/dashboard' : '/events');
    }
  }, [user, navigate]);

  // --- ÉTAPE 1 : SOUMISSION DU FORMULAIRE D'INSCRIPTION ---
  const handleSubmit = async (e) => { 
    e.preventDefault(); 

    if (!form.accepteConditions) {
      return toast.error("Vous devez accepter le contrat pour continuer.");
    }

    setLoading(true);

    try {
      if (form.role === 'client') {
        // INSCRIPTION CLIENT (Téléphone + SMS)
        // 1. Enlever les espaces
        let phoneFormatted = form.telephone.trim().replace(/\s+/g, '');
        
        // 2. Remplacer '00' par '+'
        if (phoneFormatted.startsWith('00')) {
          phoneFormatted = '+' + phoneFormatted.substring(2);
        }
        
        // 3. Ajouter l'indicatif +225 s'il n'y a pas de '+'
        if (!phoneFormatted.startsWith('+')) {
          phoneFormatted = '+225' + phoneFormatted; 
        }

        const { error } = await supabase.auth.signUp({
          phone: phoneFormatted,
          password: form.mot_de_passe,
          options: {
            data: { nom: form.nom, role: form.role }
          }
        });

        if (error) throw error;
        
        toast.success("Code de validation envoyé par SMS !");
        setStep('otp'); // On passe à l'écran de validation
      } else {
        // INSCRIPTION ORGANISATEUR (Email classique)
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.mot_de_passe,
          options: {
            data: { nom: form.nom, role: form.role }
          }
        });

        if (error) throw error;

        if (data.user) {
          await finalizeRegistration(data.user);
        }
      }
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  // --- ÉTAPE 2 : VÉRIFICATION DU CODE SMS (Client Uniquement) ---
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Reproduire le même formatage que pour l'inscription
    let phoneFormatted = form.telephone.trim().replace(/\s+/g, '');
    if (phoneFormatted.startsWith('00')) {
      phoneFormatted = '+' + phoneFormatted.substring(2);
    }
    if (!phoneFormatted.startsWith('+')) {
      phoneFormatted = '+225' + phoneFormatted; 
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneFormatted,
        token: otpCode,
        type: 'sms'
      });

      if (error) throw error;

      if (data.user) {
        await finalizeRegistration(data.user, data.session);
      }
    } catch (err) {
      toast.error("Code SMS incorrect ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  // --- FINALISATION COMMUNE (Création profil + Redirection) ---
  const finalizeRegistration = async (authUser, session = null) => {
    // S'assurer que le numéro formaté est celui enregistré en base
    let finalPhone = null;
    if (form.role === 'client') {
      finalPhone = form.telephone.trim().replace(/\s+/g, '');
      if (finalPhone.startsWith('00')) finalPhone = '+' + finalPhone.substring(2);
      if (!finalPhone.startsWith('+')) finalPhone = '+225' + finalPhone;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authUser.id,
          nom: form.nom,
          email: form.role === 'organisateur' ? form.email : null,
          telephone: finalPhone,
          role: form.role,
          isActive: true
        },
        { onConflict: 'id' }
      );

    if (profileError) console.error("Erreur profil:", profileError);

    if (typeof loginSuccess === "function") {
        dispatch(loginSuccess({
          id: authUser.id,
          email: form.email,
          telephone: finalPhone,
          nom: form.nom,
          role: form.role,
          ...(session || {})
        }));
    }

    toast.success(form.role === 'organisateur' ? 'Compte Organisateur créé ! 🎉' : 'Compte activé avec succès ! 🎉');
    navigate(form.role === 'organisateur' ? '/dashboard' : '/events');
  };

  const theme = {
    bg: dark ? 'bg-[#080812]' : 'bg-[#f8f9ff]',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
    card: dark ? 'bg-[#0A0A12] border-white/10' : 'bg-white border-slate-200',
    input: dark 
      ? 'bg-[#0f0e1a] border-white/10 text-white placeholder-white/20 focus:border-[#6c47ff] focus:ring-[#6c47ff]/20' 
      : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#6c47ff] focus:ring-[#6c47ff]/20',
  };

  const handleCheckboxClick = () => {
    if (!form.accepteConditions) {
      setShowContractModal(true);
    } else {
      setForm({ ...form, accepteConditions: false });
    }
  };

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-500 ${theme.bg}`}>
      
      {/* PANEL GAUCHE (Branding) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#080812] flex-col justify-between p-8 md:p-12">
        <div className="absolute inset-0">
          <img src="/fond ecran evenement.jpg" alt="Branding" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#080812]/90 via-[#080812]/50 to-[#6c47ff]/20" />
        </div>
        <div className="relative z-10">
          <Link to="/" className="text-xl md:text-2xl font-black tracking-tighter text-white flex items-center gap-2 group">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center">
               <Sparkles size={16} className="text-white" />
             </div>
             TICKOFIESTA
          </Link>
        </div>
        <div className="relative z-10 w-full max-w-md mx-auto my-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 tracking-tighter leading-[1.1]">
            L'ÉVÉNEMENTIEL, <br /> RÉINVENTÉ.
          </h2>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {[{ icon: Ticket, label: 'Billetterie', color: '#6c47ff' }, { icon: Zap, label: 'Votes Live', color: '#f5a623' }].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3 md:gap-4 bg-white/5 border border-white/10 rounded-2xl p-3 md:p-4 backdrop-blur-md">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20`, color }}>
                  <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                </div>
                <span className="text-white font-bold text-[10px] md:text-xs truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PANEL DROIT (Formulaire) */}
      <div className={`flex-1 flex items-center justify-center px-4 sm:px-6 py-8 md:py-12 ${theme.bg}`}>
        <div className="w-full max-w-md relative">
          
          {/* Logo Mobile */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/" className={`text-2xl font-black tracking-tighter flex items-center gap-2 ${theme.text}`}>
               <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center">
                 <Sparkles size={16} className="text-white" />
               </div>
               TICKOFIESTA
            </Link>
          </div>

          {/* === VUE 1 : FORMULAIRE D'INSCRIPTION === */}
          {step === 'register' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h1 className={`text-2xl md:text-3xl font-black tracking-tight mb-6 md:mb-8 text-center lg:text-left ${theme.text}`}>Créer un compte</h1>
              
              {/* Sélecteur de rôle */}
              <div className={`flex p-1.5 rounded-xl md:rounded-2xl mb-6 md:mb-8 ${dark ? 'bg-[#0f0e1a] border border-white/5' : 'bg-gray-200/50'}`}>
                {['client', 'organisateur'].map((r) => (
                  <button key={r} type="button" onClick={() => setForm({ ...form, role: r, email: '', telephone: '' })}
                    className={`flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase transition-all ${form.role === r ? 'bg-white text-[#6c47ff] shadow-md' : 'text-gray-500'}`}
                    style={form.role === r && dark ? { backgroundColor: '#2A2640', color: '#fff' } : {}}
                  >
                    {r === 'client' ? 'Participant' : 'Organisateur'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                <div className="space-y-1.5">
                  <input type="text" required value={form.nom} placeholder={form.role === 'organisateur' ? "Nom de l'organisation" : "Nom complet"}
                    autoComplete="name"
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className={`w-full px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border text-xs md:text-sm font-bold outline-none transition-all ${theme.input}`} />
                </div>
                
                {/* Champ Dynamique : Téléphone (Client) vs Email (Organisateur) */}
                <div className="space-y-1.5 relative">
                  {form.role === 'client' ? (
                    <>
                      <Smartphone size={18} className="absolute left-4 top-3.5 md:top-4 text-gray-400" />
                      <input type="tel" required value={form.telephone} placeholder="Numéro de téléphone (ex: 0102030405)"
                        autoComplete="tel"
                        onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                        className={`w-full pl-11 pr-5 py-3 md:py-4 rounded-xl md:rounded-2xl border text-xs md:text-sm font-bold outline-none transition-all ${theme.input}`} />
                    </>
                  ) : (
                    <>
                      <Mail size={18} className="absolute left-4 top-3.5 md:top-4 text-gray-400" />
                      <input type="email" required value={form.email} placeholder="Email professionnel"
                        autoComplete="email"
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={`w-full pl-11 pr-5 py-3 md:py-4 rounded-xl md:rounded-2xl border text-xs md:text-sm font-bold outline-none transition-all ${theme.input}`} />
                    </>
                  )}
                </div>
                
                <div className="relative space-y-1.5">
                  <input type={showPwd ? 'text' : 'password'} required value={form.mot_de_passe} placeholder="Mot de passe"
                    autoComplete="new-password"
                    onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })}
                    className={`w-full px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl border text-xs md:text-sm font-bold outline-none transition-all ${theme.input}`} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 md:right-5 top-3.5 md:top-4 text-gray-400">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div className="flex items-center h-5 mt-0.5">
                    <input id="conditions" type="checkbox" checked={form.accepteConditions} onChange={handleCheckboxClick}
                      className={`w-4 h-4 rounded border focus:ring-[#6c47ff] focus:ring-2 transition-all cursor-pointer ${dark ? 'bg-[#0f0e1a] border-white/20 text-[#6c47ff]' : 'bg-white border-gray-300 text-[#6c47ff]'}`} />
                  </div>
                  <label htmlFor="conditions" className={`text-[10px] md:text-xs leading-relaxed ${theme.sub}`}>
                    J'accepte le <button type="button" onClick={() => setShowContractModal(true)} className="text-[#6c47ff] font-bold hover:underline">Contrat Partenaire et les CGU</button> de la plateforme TickoFiesta.
                  </label>
                </div>

                <button type="submit" disabled={loading || !form.accepteConditions} className="w-full bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest shadow-xl shadow-[#6c47ff]/20 disabled:opacity-50 active:scale-95 transition-all">
                  {loading ? 'Traitement...' : form.role === 'client' ? 'Recevoir le code SMS' : 'S\'inscrire'}
                </button>
              </form>
              
              <p className={`text-center text-xs md:text-sm mt-6 md:mt-8 ${theme.sub}`}>
                Déjà un compte ? <Link to="/login" className="text-[#6c47ff] font-black hover:underline">Connexion</Link>
              </p>
            </div>
          )}

          {/* === VUE 2 : VÉRIFICATION OTP SMS === */}
          {step === 'otp' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[#6c47ff]/10 rounded-full flex items-center justify-center mb-6 border border-[#6c47ff]/20">
                <KeyRound size={32} className="text-[#6c47ff]" />
              </div>
              <h2 className={`text-2xl md:text-3xl font-black tracking-tight mb-2 ${theme.text}`}>Vérification SMS</h2>
              <p className={`text-xs md:text-sm mb-8 ${theme.sub}`}>
                Un code à 6 chiffres a été envoyé au <br/> <strong className={theme.text}>{form.telephone}</strong>
              </p>

              <form onSubmit={handleVerifyOTP} className="w-full space-y-6">
                <input 
                  type="text" 
                  maxLength={6} 
                  required 
                  value={otpCode}
                  autoComplete="one-time-code"
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} // Que des chiffres
                  placeholder="------"
                  className={`w-full text-center tracking-[1em] px-4 py-4 rounded-2xl border text-2xl font-black outline-none transition-all ${theme.input}`} 
                />
                
                <button type="submit" disabled={loading || otpCode.length < 6} className="w-full bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] text-white py-3.5 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest shadow-xl shadow-[#6c47ff]/20 disabled:opacity-50 active:scale-95 transition-all">
                  {loading ? 'Vérification...' : 'Activer mon compte'}
                </button>
              </form>

              <button onClick={() => setStep('register')} className={`mt-6 text-[10px] md:text-xs font-bold uppercase tracking-widest hover:underline ${theme.sub}`}>
                Modifier le numéro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODAL DU CONTRAT */}
      {/* ==================================================================== */}
      {showContractModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-[2rem] border shadow-2xl ${theme.card}`}>
            {/* Header Modal */}
            <div className="p-6 md:p-8 border-b border-inherit border-opacity-10 flex justify-between items-center bg-black/5 dark:bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <ShieldCheck size={20} className="text-indigo-500" />
                </div>
                <div>
                  <h2 className={`text-lg md:text-xl font-black ${theme.text}`}>Contrat & Conditions (CGU)</h2>
                  <p className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${theme.sub}`}>Plateforme TickoFiesta</p>
                </div>
              </div>
              <button onClick={() => setShowContractModal(false)} className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${theme.sub}`}>
                <X size={20} />
              </button>
            </div>

            {/* Corps du Contrat */}
            <div className={`p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-xs md:text-sm leading-relaxed ${theme.sub}`}>
              <p>
                En créant un compte sur <strong>TickoFiesta</strong>, vous acceptez les présents termes régissant l'utilisation de nos services.
              </p>
              <div>
                <h3 className={`text-sm font-black mb-2 ${theme.text}`}>Article 1 : Collecte des données</h3>
                <p>TickoFiesta collecte vos données personnelles (Numéro de téléphone, Nom) dans le seul but d'assurer le bon fonctionnement de la billetterie et des concours. Ces données sont stockées de manière sécurisée et ne sont jamais revendues à des tiers.</p>
              </div>
              {/* Le reste du contrat dynamique Organisateur/Client ici */}
              {form.role === 'organisateur' && (
                  <div className={`p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 mt-4`}>
                    <h3 className={`text-sm font-black mb-3 text-indigo-500`}>Fonctionnement et Services (Organisateur)</h3>
                    <p className="text-indigo-500/80">L'Organisateur bénéficie d'un espace de gestion complet permettant de créer des événements et de suivre les ventes en temps réel.</p>
                  </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-inherit border-opacity-10 bg-black/5 dark:bg-white/5 flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowContractModal(false)} className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${theme.text} border-inherit border-opacity-20 hover:bg-black/5 dark:hover:bg-white/5`}>
                Fermer
              </button>
              <button 
                onClick={() => {
                  setForm({ ...form, accepteConditions: true });
                  setShowContractModal(false);
                }} 
                className="flex-[2] py-3.5 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <FileText size={16} /> J'ai lu et j'accepte les conditions
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}