import { QRCodeSVG } from 'qrcode.react';
import { Ticket, User, ShieldAlert } from 'lucide-react';

export default function UserTicket({ ticketData }) {
  // ticketData doit contenir : { id: "UUID-DU-BILLET", event_title: "...", ticket_name: "VIP", client_name: "..." }

  // Gestion dynamique des couleurs des badges selon le type de billet
  const getBadgeColor = (name) => {
    const type = name?.toUpperCase() || '';
    if (type.includes('VVIP')) return 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white';
    if (type.includes('VIP')) return 'bg-gradient-to-r from-amber-400 to-amber-600 text-[#0A0A12]';
    if (type.includes('STAND')) return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white';
    return 'bg-slate-700 text-slate-200'; // Par défaut si autre type
  };

  return (
    <div className="max-w-sm mx-auto bg-[#0A0A12] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl text-white my-4 hover:border-white/20 transition-all duration-300">
      
      {/* Haut du billet */}
      <div className="p-8 bg-gradient-to-b from-indigo-600/10 to-transparent space-y-4">
        <div className="flex justify-between items-center">
          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md ${getBadgeColor(ticketData?.ticket_name)}`}>
            {ticketData?.ticket_name || 'STANDARD'}
          </span>
          <Ticket className="text-white/20" size={20} />
        </div>
        <h2 className="text-xl font-black tracking-tight leading-tight line-clamp-2">
          {ticketData?.event_title || 'Événement Spécial'}
        </h2>
      </div>

      {/* Ligne de découpe physique stylisée */}
      <div className="relative flex items-center py-2">
        <div className="absolute left-0 w-4 h-8 bg-[#05050A] rounded-r-full border-r border-white/10" />
        <div className="w-full border-t border-dashed border-white/20 mx-6" />
        <div className="absolute right-0 w-4 h-8 bg-[#05050A] rounded-l-full border-l border-white/10" />
      </div>

      {/* Bas du billet : Le QR Code */}
      <div className="p-8 flex flex-col items-center text-center space-y-6">
        <div className="bg-white p-4 rounded-3xl shadow-2xl inline-block transition-transform hover:scale-105 duration-300">
          <QRCodeSVG 
            value={ticketData?.id || "Code invalide"} 
            size={160}
            bgColor={"#ffffff"}
            fgColor={"#0A0A12"}
            level={"H"} 
          />
        </div>

        {/* Détails du titulaire */}
        <div className="space-y-2 w-full text-left bg-white/5 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <User size={14} className="text-indigo-400" />
            <span className="font-medium truncate">Titulaire : {ticketData?.client_name || 'Client Tickofiesta'}</span>
          </div>
          
          <div className="w-full border-t border-white/5 my-2" />
          
          <p className="text-[9px] font-mono text-slate-500 text-center select-all break-all tracking-tight">
            ID: {ticketData?.id}
          </p>
        </div>
        
        <p className="text-[9px] text-slate-500 flex items-center gap-1">
          <ShieldAlert size={10} /> Présentez ce QR code unique à la borne d'entrée.
        </p>
      </div>
    </div>
  );
}