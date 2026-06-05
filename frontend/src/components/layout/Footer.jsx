import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Instagram, Facebook, Linkedin, Music, Mic2, Sparkles } from 'lucide-react';
// Importation de votre logo local
import LogoTicko from '../../assets/logo1.png'; 

// Icône TikTok personnalisée
const TikTokIcon = ({ size = 16, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} {...props}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.13 3.42-.06 6.84-.11 10.26-.2 2.31-1.39 4.69-3.5 5.79-2.49 1.35-5.83.91-7.85-1.12-2.12-2.11-2.49-5.71-1-8.15 1.25-2.07 3.73-3.19 6.06-2.91v4.11c-1.16-.27-2.52-.02-3.39.81-.97.94-1.07 2.64-.17 3.73.91 1.16 2.75 1.35 3.84.4 1.01-.84 1.05-2.43 1.05-3.66V0h.35Z"/>
  </svg>
);

export default function Footer() {
  const location = useLocation();

  // Ne pas afficher le footer sur le Dashboard ou Admin
  if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin')) {
    return null;
  }

  const socials = [
    { Icon: Instagram, href: 'https://www.instagram.com/tickofiesta/', label: 'Instagram' },
    { Icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61588766290326', label: 'Facebook' },
    { Icon: TikTokIcon, href: 'https://www.tiktok.com/@tickofiesta', label: 'TikTok' },
    { Icon: Linkedin, href: 'https://www.linkedin.com/in/ticko-fiesta-464184407/', label: 'LinkedIn' },
  ];

  return (
    <footer className="relative mt-20 md:mt-32">
      <div className="bg-[#050507] border-t border-white/5">
        
        {/* Grille principale */}
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-left">
          
          {/* Logo et Marque */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center gap-3">
              <img src={LogoTicko} alt="TickoFiesta Logo" className="w-10 h-10 object-contain" />
              <span className="text-lg font-black text-white tracking-tight">TICKOFIESTA</span>
            </div>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed">Concerts • Festivals • Conférences • Soirées</p>
          </div>

          {/* Catégories */}
          <nav className="space-y-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
              <Music size={14} className="text-violet-400"/> Catégories
            </h4>
            <ul className="space-y-3 text-xs md:text-sm text-zinc-400">
              {['Concerts', 'Festivals', 'Sport', 'Conférences'].map((item) => (
                <li key={item}><Link to={`/events?cat=${item.toLowerCase()}`} className="hover:text-white transition-colors">{item}</Link></li>
              ))}
            </ul>
          </nav>

          {/* Organisateurs */}
          <nav className="space-y-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
              <Mic2 size={14} className="text-fuchsia-400"/> Organisateurs
            </h4>
            <ul className="space-y-3 text-xs md:text-sm text-zinc-400">
              <li><Link to="/organisateurs" className="hover:text-white transition-colors">Créer un événement</Link></li>
              <li><Link to="/tarifs" className="hover:text-white transition-colors">Tarifs</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Espace Pro</Link></li>
            </ul>
          </nav>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-widest">Restez branché</h4>
            <div className="flex gap-3">
              {socials.map(({ Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-violet-500/50 transition-all">
                  <Icon size={16} />
                </a>
              ))}
            </div>
            <div className="text-xs text-zinc-600 space-y-1">
              <p>contact@tickofiesta.com</p>
              <p>+225 27 24 39 47 01</p>
            </div>
          </div>
        </div>

        {/* Barre de pied de page */}
        <div className="border-t border-white/5 py-8 px-6 text-center">
          <div className="flex flex-col items-center gap-3 text-[10px] md:text-xs text-zinc-600">
            <p>© {new Date().getFullYear()} TICKOFIESTA — Made for nightlife</p>
            
            {/* Liens légaux directs */}
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Link to="/confidentialite" className="hover:text-white transition-colors font-medium underline underline-offset-4">
                Confidentialité
              </Link>
              <Link to="/cgu" className="hover:text-white transition-colors font-medium underline underline-offset-4">
                Conditions d'utilisation
              </Link>
            </div>

            <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-zinc-500 mt-4">
              <Sparkles size={12} className="text-amber-400"/> Abidjan • Côte d'Ivoire
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}