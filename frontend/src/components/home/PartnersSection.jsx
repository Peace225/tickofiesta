export default function PartnersSection({ partners = [], dark }) {
  if (!partners || partners.length === 0) return null;

  const text = dark? "text-white" : "text-gray-900";
  const sub = dark? "text-[#8b87b8]" : "text-gray-400";

  return (
    <section className={`py-24 overflow-hidden ${dark? 'bg-[#080812]' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="h- w-8 bg-[#6c47ff]/30" />
          <p className={`text- font-black uppercase tracking-[0.3em] ${sub}`}>
            Network & Trust
          </p>
          <div className="h- w-8 bg-[#6c47ff]/30" />
        </div>
        <h2 className={`text-2xl md:text-3xl font-black tracking-tighter ${text}`}>
          Ils propulsent <span className="text-[#6c47ff]">TickoFiesta</span>
        </h2>
      </div>

      <div className="relative flex overflow-hidden group">
        <div className={`absolute left-0 top-0 bottom-0 w-40 z-10 pointer-events-none bg-gradient-to-r ${dark? 'from-[#080812]' : 'from-white'} to-transparent`} />
        <div className={`absolute right-0 top-0 bottom-0 w-40 z-10 pointer-events-none bg-gradient-to-l ${dark? 'from-[#080812]' : 'from-white'} to-transparent`} />

        <div className="flex animate-scroll whitespace-nowrap py-4">
          {[...partners,...partners,...partners].map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-4 px-12 transition-all duration-500 group-hover:pause">
              <div className="w-32 h-20 flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500 transform hover:scale-110">
                {p?.logo? (
                  <img src={p.logo} alt={p.nom} className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className={`text-xl font-black tracking-widest ${sub}`}>{p?.nom}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}