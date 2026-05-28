import React from 'react';
import { X, Check, ChevronLeft, Phone, Lock } from 'lucide-react';

const VotePaymentModal = ({
  isOpen, onClose, candidate, packs, selectedPack, setSelectedPack,
  step, setStep, paymentMethod, setPaymentMethod,
  phoneNumber, setPhoneNumber, fullName, setFullName,
  termsAccepted, setTermsAccepted, onProceed, onFinalSubmit,
  isProcessing, getImageUrl
}) => {
  if (!isOpen) return null;

  const isValid = termsAccepted && phoneNumber.replace(/\D/g, '').length >= 8;
  const methods = [
    { id: 'orange', name: 'Orange Money', img: '/images/orange.png' },
    { id: 'mtn', name: 'MTN (MOMO)', img: '/images/mtn.png' },
    { id: 'moov', name: 'Moov Money', img: '/images/moov.png' },
    { id: 'djamo', name: 'Djamo', img: '/images/djamo.png' },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w- bg-white rounded-t- sm:rounded- shadow-2xl flex flex-col max-h- animate-in slide-in-from-bottom duration-300">

        {/* HEADER */}
        <div className="bg-[#101b4d] px-4 py-3.5 flex items-center justify-between rounded-t-">
          <div className="flex items-center gap-3">
            <img src={getImageUrl(candidate?.image) || `https://ui-avatars.com/api/?name=${candidate?.nom}`} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20" alt="" />
            <div>
              <p className="text- text-white/70 -mb-0.5">Voter pour</p>
              <h3 className="text-white font-semibold text- leading-tight">{candidate?.nom}</h3>
              <p className="text-[#ffcc00] text- font-medium">{selectedPack?.votes || 1} vote · {selectedPack?.prix || 100} FCFA</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 grid place-items-center rounded-full bg-white/10 text-white/80 hover:bg-white/20">
            <X size={16} />
          </button>
        </div>

        {/* CONTENU SCROLLABLE */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-4">

              {/* PACKS */}
              <p className="text- font-bold text-slate-500 tracking-wider mb-2.5">PACK DE VOTES</p>
              <div className="grid grid-cols-3 gap-2 mb-5">
                {packs.map(p => {
                  const active = selectedPack?.id === p.id;
                  return (
                    <button key={p.id} onClick={() => setSelectedPack(p)}
                      className={`relative rounded-xl border-2 p-3 text-center transition-all
                        ${active? 'bg-[#0066ff] border-[#0066ff]' : 'bg-[#f3f4f6] border-transparent hover:bg-slate-100'}`}>
                      {active && <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white rounded-full grid place-items-center"><Check size={10} className="text-[#0066ff]" strokeWidth={3} /></div>}
                      <div className={`text- font-extrabold leading-none ${active? 'text-white' : 'text-slate-900'}`}>{p.votes}</div>
                      <div className={`text- mb-1.5 ${active? 'text-white/80' : 'text-slate-500'}`}>vote{p.votes>1?'s':''}</div>
                      <div className={`text- font-semibold rounded-full py-0.5 ${active? 'bg-white/20 text-white' : 'bg-white text-slate-600'}`}>{p.prix} FCFA</div>
                    </button>
                  )
                })}
              </div>

              {/* INFOS */}
              <p className="text- font-bold text-slate-500 tracking-wider mb-2.5">VOS INFORMATIONS</p>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="text- font-medium text-slate-800 mb-1 block">Numéro de téléphone <span className="text-red-500">*</span></label>
                  <input value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} placeholder="+225 07 XX XX XX XX"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text- focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"/>
                </div>
                <div>
                  <label className="text- font-medium text-slate-800 mb-1 block">Nom complet <span className="text-slate-400">(facultatif)</span></label>
                  <input value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Votre nom"
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text- focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"/>
                </div>
              </div>

              {/* PAIEMENT */}
              <div className="flex items-center justify-between mb-2.5">
                <p className="text- font-bold text-slate-500 tracking-wider">MODE DE PAIEMENT</p>
                <span className="text- text-slate-400">Glisser →</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
                {methods.map(m => {
                  const active = paymentMethod === m.id;
                  return (
                    <button key={m.id} onClick={()=>setPaymentMethod(m.id)}
                      className={`snap-start shrink-0 w- relative rounded-xl border-2 p-2.5 bg-white transition-all ${active? 'border-[#0066ff]' : 'border-slate-200'}`}>
                      {active && <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#0066ff] rounded-full grid place-items-center"><Check size={9} className="text-white" strokeWidth={3}/></div>}
                      <div className="w-12 h-12 mx-auto mb-1.5 rounded-lg bg-black flex items-center justify-center overflow-hidden">
                        <img src={m.img} alt={m.name} className="w-8 h-8 object-contain"/>
                      </div>
                      <p className="text- leading-tight text-slate-700 font-medium">{m.name}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER FIXE */}
        {step === 1 && (
          <div className="p-4 bg-white border-t border-slate-100">
            <label className="flex gap-2.5 mb-3 cursor-pointer">
              <input type="checkbox" checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#0066ff]"/>
              <span className="text- text-slate-600 leading-snug">J'accepte les <a className="text-[#0066ff] underline">conditions d'utilisation</a> et certifie que mes informations sont exactes.</span>
            </label>
            <button onClick={onProceed} disabled={!isValid}
              className={`w-full h- rounded-xl font-semibold text- flex items-center justify-center gap-2 transition-all
                ${isValid? 'bg-[#0066ff] text-white active:scale-[0.98]' : 'bg-[#f1f3f5] text-[#adb5bd]'}`}>
              <Phone size={16}/> {isValid? `Payer ${selectedPack.prix} FCFA` : 'Entrez votre numéro'}
            </button>
            <p className="text-center text- text-slate-400 mt-2.5 flex items-center justify-center gap-1"><Lock size={10}/> Paiement 100% sécurisé</p>
          </div>
        )}

        {/* STEP 2 - inchangé */}
        {step === 2 && (
          <div className="p-5">
            <button onClick={()=>setStep(1)} className="text- text-[#ff7900] font-medium flex items-center gap-1 mb-4"><ChevronLeft size={16}/>Retour</button>
            <p className="text-center">...</p>
          </div>
        )}
      </div>

      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
};

export default VotePaymentModal;