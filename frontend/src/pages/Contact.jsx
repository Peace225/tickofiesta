import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Mail, Phone, MapPin, Send, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '../config/supabaseClient'; // Assure-toi que le chemin est correct

export default function Contact() {
  const { dark } = useSelector((s) => s.theme);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Envoi des données vers Supabase
      const { error: supabaseError } = await supabase
        .from('contact_messages')
        .insert([
          { 
            name: form.name.trim(), 
            email: form.email.trim(), 
            subject: form.subject.trim(), 
            message: form.message.trim() 
          }
        ]);

      if (supabaseError) throw supabaseError;

      // 2. Si succès, on affiche le message de confirmation
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });

      // 3. On remet le formulaire à zéro après 5 secondes
      setTimeout(() => {
        setSent(false);
      }, 5000);

    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err.message);
      setError("Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contacts = [
    {
      icon: Mail,
      title: 'Email',
      value: 'support@tickofiesta.com',
      link: 'mailto:support@tickofiesta.com'
    },
    {
      icon: Phone,
      title: 'Téléphone',
      value: '+225 07 00 00 00 00',
      link: 'tel:+2250700000000'
    },
    {
      icon: MapPin,
      title: 'Adresse',
      value: 'Abidjan, Cocody, Côte d\'Ivoire',
      link: null
    }
  ];

  return (
    <div className={`min-h-screen pt-32 pb-20 ${dark ? 'bg-[#0a0a16]' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* EN-TÊTE */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#6c47ff] to-[#00d4aa] mb-6 shadow-[0_0_20px_rgba(108,71,255,0.3)]">
            <MessageSquare size={32} className="text-white" />
          </div>
          <h1 className={`text-5xl font-black mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>
            Nous <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6c47ff] to-[#00d4aa]">contacter</span>
          </h1>
          <p className={`text-lg ${dark ? 'text-white/60' : 'text-gray-600'}`}>
            Une question ? Un problème ? Notre équipe répond sous 24h.
          </p>
        </div>

        {/* CARTES DE CONTACT RAPIDE */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {contacts.map((contact, i) => {
            const Icon = contact.icon;
            const Content = () => (
              <div className={`p-8 rounded-2xl border backdrop-blur-xl text-center transition-all hover:scale-105 ${
                dark ? 'bg-[#12121f]/60 border-white/10 hover:border-[#6c47ff]/50' : 'bg-white border-gray-200 hover:border-[#6c47ff]/50 hover:shadow-lg'
              }`}>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#6c47ff] to-[#00d4aa] flex items-center justify-center mx-auto mb-4">
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className={`font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>{contact.title}</h3>
                <p className={dark ? 'text-white/70' : 'text-gray-600'}>{contact.value}</p>
              </div>
            );
            
            return contact.link ? (
              <a key={i} href={contact.link}><Content /></a>
            ) : (
              <div key={i}><Content /></div>
            );
          })}
        </div>

        {/* FORMULAIRE */}
        <div className={`max-w-2xl mx-auto rounded-3xl border backdrop-blur-xl p-8 ${
          dark ? 'bg-[#12121f]/60 border-white/10' : 'bg-white border-gray-200 shadow-xl'
        }`}>
          <h2 className={`text-2xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>
            Envoyez-nous un message
          </h2>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
              {error}
            </div>
          )}
          
          {sent ? (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-green-500" />
              </div>
              <p className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>Message envoyé avec succès !</p>
              <p className={dark ? 'text-white/60' : 'text-gray-600'}>Notre équipe vous répondra dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-white/80' : 'text-gray-700'}`}>
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-[#6c47ff] transition-colors ${
                      dark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                    }`}
                    placeholder="Kouassi Jean"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-white/80' : 'text-gray-700'}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-[#6c47ff] transition-colors ${
                      dark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                    }`}
                    placeholder="jean@email.com"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-white/80' : 'text-gray-700'}`}>
                  Sujet
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-[#6c47ff] transition-colors ${
                    dark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                  }`}
                  placeholder="Demande de partenariat, Problème technique..."
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-white/80' : 'text-gray-700'}`}>
                  Message
                </label>
                <textarea
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-[#6c47ff] transition-colors resize-none ${
                    dark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                  }`}
                  placeholder="Décrivez votre demande en détail..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#6c47ff] to-[#8b6bff] shadow-lg shadow-[#6c47ff]/30 hover:shadow-[#6c47ff]/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}