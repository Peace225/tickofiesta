import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, X } from "lucide-react";

export default function AdsManager({ ads }) {
  const [popupAds, setPopupAds] = useState([]);
  const [popupIndex, setPopupIndex] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [widgetVisible, setWidgetVisible] = useState(true);
  
  // Ajustement de la position initiale pour qu'elle passe bien sur mobile
  const [widgetPos, setWidgetPos] = useState({ 
    x: Math.min(window.innerWidth - 240, window.innerWidth - 20), // Évite de sortir de l'écran
    y: window.innerHeight - 120 
  });
  
  const dragRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0, moved: false });

  useEffect(() => {
    // Sécurité au cas où "ads" est undefined
    if (!ads || !Array.isArray(ads)) return;

    const pops = ads.filter(a => a.type_pub === 'popup' || !a.type_pub);
    if (pops.length > 0) {
      setPopupAds(pops);
      setTimeout(() => setPopupOpen(true), 1500);
    }
  }, [ads]);

  // Logic Draggable Widget (Compatible Souris ET Tactile)
  const onPointerDown = (e) => {
    if (e.target.closest('[data-nodrag]')) return;
    
    // Empêche le scroll de la page pendant qu'on drag sur mobile
    if (e.cancelable) e.preventDefault(); 

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    dragRef.current = { active: true, startX: clientX, startY: clientY, origX: widgetPos.x, origY: widgetPos.y, moved: false };

    const onMove = (ev) => {
      if (!dragRef.current.active) return;
      const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const dx = cx - dragRef.current.startX;
      const dy = cy - dragRef.current.startY;
      
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.moved = true;
      
      setWidgetPos({
        x: Math.max(10, Math.min(window.innerWidth - 230, dragRef.current.origX + dx)),
        y: Math.max(70, Math.min(window.innerHeight - 80, dragRef.current.origY + dy)),
      });
    };

    const onUp = () => {
      dragRef.current.active = false;
      // On retire les écouteurs souris ET tactiles
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    // On ajoute les écouteurs souris ET tactiles
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  const adPopup = popupAds[popupIndex];

  return (
    <>
      {/* POPUP OVERLAY */}
      {popupOpen && adPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setPopupOpen(false)}>
          {/* Ajout de w-[calc(100%-2rem)] pour garantir des marges sur mobile */}
          <div className="relative w-[calc(100%-2rem)] max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPopupOpen(false)} className="absolute top-3 right-3 md:top-4 md:right-4 z-20 bg-black/20 text-white p-2 rounded-full backdrop-blur-md hover:bg-black/40 transition-colors">
              <X size={20}/>
            </button>
            <img src={adPopup.image} className="w-full aspect-video object-cover" alt="Publicité" />
            <div className="p-5 md:p-6 text-center">
              <h3 className="font-black text-lg md:text-xl mb-3 md:mb-4 text-gray-900">{adPopup.titre?.toUpperCase()}</h3>
              <a href={adPopup.lien} target="_blank" rel="noopener noreferrer" className="block w-full bg-[#6c47ff] hover:bg-[#5a38e6] transition-colors text-white text-sm md:text-base font-black py-3 rounded-xl md:rounded-2xl shadow-lg shadow-[#6c47ff]/30">
                VOIR L'ÉVÉNEMENT
              </a>
            </div>
          </div>
        </div>
      )}

      {/* DRAGGABLE WIDGET */}
      {widgetVisible && adPopup && !popupOpen && (
        <div 
          style={{ left: widgetPos.x, top: widgetPos.y }}
          className="fixed z-[99] w-[220px] cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown} // INDISPENSABLE POUR LE MOBILE
          onClick={() => !dragRef.current.moved && setPopupOpen(true)}
        >
          <div className="flex items-center gap-3 bg-[#0f0e1a]/95 backdrop-blur-md border border-[#6c47ff]/30 rounded-2xl p-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
             <img src={adPopup.image} className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover" alt="Miniature pub" />
             <div className="min-w-0 flex-1">
               <span className="block text-[8px] md:text-[9px] font-black text-[#f5a623] uppercase tracking-widest">Sponsorisé</span>
               <span className="block text-white text-[10px] md:text-xs font-black truncate">{adPopup.titre}</span>
             </div>
             <button data-nodrag onClick={(e) => { e.stopPropagation(); setWidgetVisible(false); }} className="ml-auto text-white/40 hover:text-white p-1">
               <X size={14} className="md:w-[16px] md:h-[16px]" />
             </button>
          </div>
        </div>
      )}
    </>
  );
}