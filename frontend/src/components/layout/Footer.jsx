import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';

import {
  Mail,
  Phone,
  Instagram,
  Youtube,
  Facebook,
  X,
  ArrowUpRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

/**
 * GESTION DES CONTACTS
 */
const DEFAULT_CONTACT = {
  email: 'contact@tickofiesta.com',
  phone: '+225 07 00 00 00',
  instagram: 'https://instagram.com/tickofiesta',
  facebook: 'https://facebook.com/tickofiesta',
  x: 'https://x.com/tickofiesta',
  youtube: 'https://youtube.com/@tickofiesta'
};

export function getContact() {
  try {
    const saved = localStorage.getItem('bv_contact');
    return saved? { ...DEFAULT_CONTACT, ...JSON.parse(saved) } : DEFAULT_CONTACT;
  } catch {
    return DEFAULT_CONTACT;
  }
}

export default function Footer() {
  const location = useLocation();
  const { dark } = useSelector((s) => s.theme);
  const contact = getContact();
  const [partners, setPartners] = useState([]);

  // --- LOGIQUE SUPABASE : PARTENAIRES ---
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const { data, error } = await supabase
        .from('partenaires')
        .select('id, nom, logo')
        .eq('actif', true)
        .order('ordre', { ascending: true });

        if (error) {
          console.warn('Erreur Supabase partenaires:', error.message);
          return;
        }
        setPartners(data || []);
      } catch (err) {
        console.info("Partenaires non chargés.");
        setPartners([]);
      }
    };
    fetchPartners();
  }, []);

  // Masquer le footer sur les interfaces de gestion
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin');
  if (isDashboard) return null;

  const theme = {
    bg: dark? 'bg-[#080812]' : 'bg-[#fcfcfd]',
    border: dark? 'border-white/5' : 'border-gray-100',
    text: dark? 'text-white' : 'text-gray-900',
    sub: dark? 'text-[#8b87b8]' : 'text-gray-500',
    card: dark? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200',
  };

  const socialLinks = [
    { Icon: Instagram, href: contact.instagram, label: 'Instagram' },
    { Icon: Facebook, href: contact.facebook, label: 'Facebook' },
    { Icon: X, href: contact.x, label: 'X' },
    { Icon: Youtube, href: contact.youtube, label: 'Youtube' }
  ].filter(s => s.href && s.href !== '#');

  return (
    <footer className={`relative overflow-hidden border-t ${theme.border} ${theme.bg} mt-auto transition-colors duration-500`}>
      {/* Effets visuels */}
      <div className="absolute -bottom-24 -left-20 w-80 h-80 bg-[#6c47ff]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -right-20 w-64 h-64 bg-[#00d4aa]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 pt-12 md:pt-20 pb-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Section 1: Marque */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6c47ff] to-[#00d4aa] flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-300">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className={`font-black text-xl tracking-tighter ${theme.text}`}>TICKOFIESTA</span>
            </Link>
            <p className={`text-sm leading-relaxed max-w-xs ${theme.sub}`}>
              L'élite de la billetterie numérique et du vote interactif en Afrique. Une expérience premium et sécurisée.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className={`w-9 h-9 rounded-xl border ${theme.card} flex items-center justify-center ${theme.sub} hover:text-[#6c47ff] hover:border-[#6c47ff]/50 hover:-translate-y-1 transition-all duration-300`}
                >
                  <social.Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Section 2: Liens */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-[0.25em] mb-8 ${theme.text}`}>Exploration</h4>
            <ul className="space-y-4">
              {[
                { to: '/events', label: 'Tous les événements' },
                { to: '/votes', label: 'Espace de vote' },
                { to: '/organisateurs', label: 'Devenir Organisateur' },
                { to: '/mes-billets', label: 'Mes Réservations' }
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={`text-sm font-bold ${theme.sub} hover:text-[#6c47ff] transition-colors flex items-center gap-2 group`}>
                    {link.label}
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 3: Contact */}
          <div>
            <h4 className={`text-xs font-black uppercase tracking-[0.25em] mb-8 ${theme.text}`}>Assistance</h4>
            <div className="space-y-5">
              <a href={`mailto:${contact.email}`} className="flex items-center gap-4 group">
                <div className={`w-9 h-9 rounded-xl border ${theme.card} flex items-center justify-center text-[#6c47ff] group-hover:bg-[#6c47ff] group-hover:text-white transition-all`}>
                  <Mail size={16} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-black uppercase tracking-wider opacity-40 ${theme.text}`}>Email</span>
                  <span className={`text-sm font-bold ${theme.sub}`}>{contact.email}</span>
                </div>
              </a>
              <a href={`tel:${contact.phone}`} className="flex items-center gap-4 group">
                <div className={`w-9 h-9 rounded-xl border ${theme.card} flex items-center justify-center text-[#00d4aa] group-hover:bg-[#00d4aa] group-hover:text-white transition-all`}>
                  <Phone size={16} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-black uppercase tracking-wider opacity-40 ${theme.text}`}>Téléphone</span>
                  <span className={`text-sm font-bold ${theme.sub}`}>{contact.phone}</span>
                </div>
              </a>
            </div>
          </div>

          {/* Section 4: Sécurité */}
          <div className="space-y-6">
            <h4 className={`text-xs font-black uppercase tracking-[0.25em] mb-8 ${theme.text}`}>Certification</h4>
            <div className={`p-5 rounded-[1.5rem] border ${theme.card} relative overflow-hidden group`}>
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                <ShieldCheck size={40} className={theme.text} />
              </div>
              <div className="flex items-center gap-3 mb-3 relative z-10">
                <div className="w-2 h-2 rounded-full bg-[#00d4aa] shadow-[0_0_8px_#00d4aa]" />
                <span className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>SSL 256-bit</span>
              </div>
              <p className={`text-xs leading-relaxed relative z-10 ${theme.sub}`}>
                Vos transactions sont protégées par un cryptage de niveau bancaire.
              </p>
            </div>
          </div>
        </div>

        {/* Partenaires dynamiques */}
        {partners.length > 0 && (
          <div className={`py-10 border-t border-b ${theme.border} mb-12`}>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
              {partners.map((p) => (
                <img 
                  key={p.id} 
                  src={p.logo} 
                  alt={p.nom} 
                  className="h-7 md:h-9 object-contain"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pied de page final */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-4">
          <p className={`text-xs font-medium ${theme.sub}`}>
            © 2026 <span className="font-black text-[#6c47ff]">TICKOFIESTA</span>. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/faq" className={`text-xs font-black uppercase tracking-widest ${theme.sub} hover:text-[#6c47ff] transition-colors`}>FAQ</Link>
            <Link to="/politique" className={`text-xs font-black uppercase tracking-widest ${theme.sub} hover:text-[#6c47ff] transition-colors`}>Vie Privée</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}