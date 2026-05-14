import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const phone = '2250789663926'; // +225 27 24 39 47 01
  const message = encodeURIComponent("Bonjour TickoFiesta, j'ai une question sur un événement");
  
  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discuter sur WhatsApp"
      className="fixed bottom-5 right-5 z-50 group"
    >
      <div className="relative">
        {/* Pulse */}
        <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping" />
        
        {/* Bouton */}
        <div className="relative w-14 h-14 rounded-full bg-[#25D366] shadow-lg shadow-green-900/30 flex items-center justify-center hover:scale-110 transition-transform">
          <MessageCircle size={28} className="text-white fill-white" />
        </div>
        
        {/* Tooltip desktop */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap border border-zinc-800">
            Discuter sur WhatsApp
          </div>
        </div>
      </div>
    </a>
  );
}