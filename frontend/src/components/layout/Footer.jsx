import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../config/supabaseClient';
import {
  Ticket, Calendar, MapPin, Instagram, Facebook, Linkedin,
  Music, Mic2, PartyPopper, ArrowRight, Sparkles
} from 'lucide-react';

// Icône TikTok (lucide ne l'a pas)
const TikTokIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-1.77V14a6.5 6.5 0 1 1-6.5-6.5c.37 0.73.04 1.08.1v3.26a3.25 0 1 0 2.12 3.06V2h3.25a4.82 0 0 0 3.77 4.69Z"/>
  </svg>
);

export default function Footer() {
  const location = useLocation();
  const { dark } = useSelector(s => s.theme);
  const [nextEvent, setNextEvent] = useState(null);

  useEffect(() => {
    supabase.from('events')
     .select('id,titre,date,lieu,image')
     .gte('date', new Date().toISOString())
     .order('date')
     .limit(1)
     .single()
     .then(({data}) => setNextEvent(data));
  }, []);

  if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin')) return null;

  const socials = [
    { Icon: Instagram, href: 'https://www.instagram.com/tickofiesta/', label: 'Instagram' },
    { Icon: Facebook, href: 'https://www.facebook.com/profile.php?id=61588766290326', label: 'Facebook' },
    { Icon: TikTokIcon, href: 'https://www.tiktok.com/@tickofiesta', label: 'TikTok' },
    { Icon: Linkedin, href: 'https://www.linkedin.com/in/ticko-fiesta-464184407/?skipRedirect=true', label: 'LinkedIn' },
  ];

  return (
    <footer className="relative mt-32">
      <div className="bg-[#050507] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-10">

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-amber-500 flex items-center justify-center">
                <PartyPopper size={18} className="text-white" />
              </div>
              <span className="text-xl font-black text-white">TICKOFIESTA</span>
            </div>
            <p className="text-sm text-zinc-500">Concerts • Festivals • Conférences • Soirées</p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Music size={14} className="text-violet-400"/> Catégories</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link to="/events?cat=concert" className="hover:text-white">Concerts</Link></li>
              <li><Link to="/events?cat=festival" className="hover:text-white">Festivals</Link></li>
              <li><Link to="/events?cat=sport" className="hover:text-white">Sport</Link></li>
              <li><Link to="/events?cat=conference" className="hover:text-white">Conférences</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Mic2 size={14} className="text-fuchsia-400"/> Organisateurs</h4>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li><Link to="/organisateurs" className="hover:text-white">Créer un événement</Link></li>
              <li><Link to="/tarifs" className="hover:text-white">Tarifs</Link></li>
              <li><Link to="/dashboard" className="hover:text-white">Espace Pro</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Restez branché</h4>
            <div className="flex gap-3">
              {socials.map(({Icon, href, label}) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10 transition-all"
                >
                  <Icon size={16}/>
                </a>
              ))}
            </div>
            <p className="text-xs text-zinc-600 mt-4">
              contact@tickofiesta.com<br/>
              +225 27 24 39 47 01
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 py-6 px-6 flex flex-col md:flex-row gap-3 justify-between items-center max-w-7xl mx-auto">
          <p className="text-xs text-zinc-600">© 2026 TICKOFIESTA — Made for nightlife</p>
          <div className="flex items-center gap-2 text- font-bold uppercase tracking-widest text-zinc-500">
            <Sparkles size={12} className="text-amber-400"/> Abidjan • Côte d'Ivoire
          </div>
        </div>
      </div>
    </footer>
  );
}