import { useSelector } from 'react-redux';
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Send } from 'lucide-react';

export default function SocialFollow() {
  const { dark } = useSelector((s) => s.theme);

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, color: '#1877F2', url: '#', followers: '12k' },
    { name: 'Instagram', icon: Instagram, color: '#E4405F', url: '#', followers: '25k' },
    { name: 'Twitter', icon: Twitter, color: '#1DA1F2', url: '#', followers: '8k' },
    { name: 'LinkedIn', icon: Linkedin, color: '#0A66C2', url: '#', followers: '5k' },
    { name: 'TikTok', icon: () => <span className="font-bold text-[10px]">TK</span>, color: '#000000', url: '#', followers: '40k' },
  ];

  const theme = {
    card: dark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:shadow-xl',
    text: dark ? 'text-white' : 'text-slate-900',
    sub: dark ? 'text-slate-400' : 'text-slate-500',
  };

  return (
    <section className="py-12 md:py-20 border-t border-inherit border-opacity-10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          {/* Texte d'appel à l'action */}
          <div className="max-w-md">
            <h3 className={`text-2xl md:text-3xl font-black tracking-tighter mb-3 ${theme.text}`}>
              Rejoignez la <span className="text-[#6c47ff]">Fiesta</span> sur les réseaux !
            </h3>
            <p className={`text-sm font-medium leading-relaxed ${theme.sub}`}>
              Ne manquez aucun événement, aucune vente flash et découvrez les coulisses des plus grands festivals d'Abidjan.
            </p>
          </div>

          {/* Grille des réseaux */}
          <div className="flex flex-wrap gap-3 md:gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 group ${theme.card}`}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110"
                  style={{ backgroundColor: social.color }}
                >
                  <social.icon size={20} />
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>{social.name}</p>
                  <p className="text-[10px] font-bold text-[#00d4aa]">{social.followers} abonnés</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Newsletter Express */}
        <div className={`mt-12 p-6 md:p-8 rounded-[2rem] border flex flex-col md:flex-row items-center gap-6 ${dark ? 'bg-gradient-to-r from-[#6c47ff]/10 to-transparent border-[#6c47ff]/20' : 'bg-slate-100 border-slate-200'}`}>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-[#6c47ff] flex items-center justify-center text-white shadow-lg shadow-[#6c47ff]/20">
              <Send size={24} />
            </div>
            <div>
              <p className={`text-sm font-black uppercase tracking-widest ${theme.text}`}>Alerte Bons Plans</p>
              <p className={`text-xs ${theme.sub}`}>Recevez les tickets "Early Bird" avant tout le monde.</p>
            </div>
          </div>
          
          <div className="w-full md:w-auto flex gap-2">
            <input 
              type="email" 
              placeholder="Votre email" 
              className={`flex-1 md:w-64 px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-[#6c47ff]/50 transition-all ${dark ? 'bg-black/20 border-white/10 text-white' : 'bg-white border-slate-200'}`}
            />
            <button className="px-6 py-3 rounded-xl bg-[#6c47ff] text-white text-xs font-black uppercase tracking-widest hover:bg-[#5a3ae6] transition-all">
              Ok
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}